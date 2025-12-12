from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
import logging
import asyncio
import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from typing import Optional

from app.db_session import get_db
from app.services.whoop_client import whoop_client
from app.core_config import get_settings

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/authorize")
async def authorize_whoop(user_id: str, request: Request):
    """
    Redirects the user to Whoop's OAuth authorization page.
    """
    logger.info(f"DEBUG: Authorize endpoint called for user_id: {user_id}")
    logger.info(f"DEBUG: Request URL: {request.url}")
    logger.info(f"DEBUG: Request base URL: {request.base_url}")
    # Pass user_id as state to ensure we know who to sync data for in the callback
    # Pass request to allow auto-detection of redirect URI if env var not set
    auth_url = whoop_client.get_authorization_url(state=user_id, request=request)
    logger.info(f"DEBUG: Generated Auth URL: {auth_url}")
    return {"url": auth_url}

@router.get("/callback")
async def whoop_callback(code: str, state: str, user_id: str = None, request: Request = None, db: Session = Depends(get_db)):
    """
    Handles the callback from Whoop, exchanges code for token, and syncs data.
    """
    try:
        logger.info(f"DEBUG: Callback received for user_id: {user_id}")
        logger.info(f"DEBUG: Callback request URL: {request.url if request else 'N/A'}")
        
        # If user_id is not provided in query, try to get it from the state or assume single user mode for now
        # In this app, the frontend sends user_id as a query param to this endpoint
        # If user_id is not provided in query, try to get it from the state
        if not user_id and state:
            logger.info(f"DEBUG: Using state as user_id: {state}")
            user_id = state
            
        if not user_id:
            logger.info("DEBUG: No user_id provided and no state, using default_user")
            user_id = "default_user" 

        # Pass request to allow auto-detection of redirect URI if env var not set
        token_data = await whoop_client.get_access_token(code, request=request)
        access_token = token_data["access_token"]
        refresh_token = token_data["refresh_token"]
        
        # Calculate token expiration (typically 1 hour, but use expires_in if provided)
        expires_in = token_data.get("expires_in", 3600)  # Default to 1 hour
        expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        
        # Fetch Profile
        profile = await whoop_client.get_profile(access_token)
        logger.info(f"DEBUG: Fetched profile for: {profile.get('email')}")
        
        # Update User Profile in DB
        from app.services.ingestion.whoop_ingestion import ensure_user, clear_existing_data, upsert_daily_metrics, persist_workouts
        from app.ml.feature_engineering.daily_features import recompute_daily_features
        from app.ml.models.trainer import train_user_models
        from app.models.database import WhoopToken
        import pandas as pd

        # Map profile data - ensure user exists before inserting any data
        user = ensure_user(
            db, 
            user_id, 
            email=profile.get("email"), 
            name=f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip(),
        )
        # Explicitly commit to ensure user exists before foreign key constraints
        db.commit()
        logger.info(f"DEBUG: Ensured user exists: {user_id} (email: {user.email})")
        
        # Store or update tokens
        existing_token = db.query(WhoopToken).filter(WhoopToken.user_id == user_id).first()
        if existing_token:
            existing_token.access_token = access_token
            existing_token.refresh_token = refresh_token
            existing_token.expires_at = expires_at
            existing_token.token_type = token_data.get("token_type", "Bearer")
            existing_token.updated_at = datetime.utcnow()
        else:
            whoop_token = WhoopToken(
                user_id=user_id,
                access_token=access_token,
                refresh_token=refresh_token,
                expires_at=expires_at,
                token_type=token_data.get("token_type", "Bearer"),
            )
            db.add(whoop_token)
        db.commit()
        logger.info(f"DEBUG: Stored tokens for user: {user_id}")

        # Fetch Data - Use a reasonable date range (last 2 years)
        # Whoop API may have limits on date range, so we'll fetch in chunks if needed
        
        # Try to fetch up to the very current second first to get the latest data
        # Add a small buffer (1 minute) to ensure we don't hit clock skew issues
        # but still get today's data
        end_date = datetime.utcnow() - timedelta(minutes=1)
        
        # Start from 2 years ago, or account creation date if available
        # Most users won't have data older than 2 years anyway
        start_date = end_date - timedelta(days=730)  # ~2 years
        # Strip microseconds to avoid 400 Bad Request from Whoop API
        start_date = start_date.replace(microsecond=0)
        end_date = end_date.replace(microsecond=0)
        
        start_str = start_date.isoformat() + "Z"
        end_str = end_date.isoformat() + "Z"

        logger.info(f"DEBUG: Fetching data from {start_str} to {end_str} (UTC)")
        logger.info(f"DEBUG: This should include data up to approximately {end_date.date()} (UTC date)")

        # 1. Fetch Cycles (Recovery, Strain)
        # Try 2 years first, fall back to smaller ranges if API rejects it
        # Note: We'll update start_str/end_str so all subsequent API calls use the same range
        cycles_fetched = False
        try:
            cycles_data = await whoop_client.get_cycle_data(access_token, start_str, end_str)
            logger.info(f"DEBUG: Fetched {len(cycles_data)} cycles with 2-year range")
            cycles_fetched = True
        except Exception as e:
            error_msg = str(e)
            logger.error(f"DEBUG: Error fetching cycles with 2-year range: {error_msg}")
            
            # Check if it's a 400 error, potentially due to future timestamp (clock skew) or date range too large
            if "400" in error_msg or "Bad Request" in error_msg:
                logger.info("DEBUG: 400 Error, trying with 5-minute buffer for end_date")
                # Apply 5 minute buffer and retry
                end_date = datetime.utcnow() - timedelta(minutes=5)
                end_date = end_date.replace(microsecond=0)
                end_str = end_date.isoformat() + "Z"
                
                # Also reduce range if needed, but first try just the buffer with full range
                try:
                    cycles_data = await whoop_client.get_cycle_data(access_token, start_str, end_str)
                    logger.info(f"DEBUG: Fetched {len(cycles_data)} cycles with 5-min buffer and 2-year range")
                    cycles_fetched = True
                except Exception as e2:
                    logger.error(f"DEBUG: Still failed with buffer: {e2}")
                    
                    # Now try reducing range AND keeping buffer
                    logger.info("DEBUG: Date range too large, trying last 1 year instead")
                    start_date = end_date - timedelta(days=365)
                    start_date = start_date.replace(microsecond=0)
                    start_str = start_date.isoformat() + "Z"
                    try:
                        cycles_data = await whoop_client.get_cycle_data(access_token, start_str, end_str)
                        logger.info(f"DEBUG: Fetched {len(cycles_data)} cycles with 1-year range")
                        cycles_fetched = True
                    except Exception as e3:
                        logger.error(f"DEBUG: Still failed with 1-year range: {e3}")
                        # Last resort: try last 90 days
                        logger.info("DEBUG: Trying last 90 days as fallback")
                        start_date = end_date - timedelta(days=90)
                        start_date = start_date.replace(microsecond=0)
                        start_str = start_date.isoformat() + "Z"
                        try:
                            cycles_data = await whoop_client.get_cycle_data(access_token, start_str, end_str)
                            logger.info(f"DEBUG: Fetched {len(cycles_data)} cycles with 90-day range")
                            cycles_fetched = True
                        except Exception as e4:
                            logger.error(f"DEBUG: Failed even with 90-day range: {e4}")
                            # Try 180 days as a middle ground
                            logger.info("DEBUG: Trying last 180 days as fallback")
                            start_date = end_date - timedelta(days=180)
                            start_date = start_date.replace(microsecond=0)
                            start_str = start_date.isoformat() + "Z"
                            cycles_data = await whoop_client.get_cycle_data(access_token, start_str, end_str)
                            logger.info(f"DEBUG: Fetched {len(cycles_data)} cycles with 180-day range")
                            cycles_fetched = True
            else:
                raise
        
        if not cycles_fetched:
            cycles_data = []
        
        # Log the final date range being used for all subsequent API calls
        logger.info(f"DEBUG: Using date range for all API calls: {start_str} to {end_str}")
        
        # 2. Fetch Sleep
        # Add small delay between endpoint calls to spread out requests
        await asyncio.sleep(0.5)
        try:
            sleep_data = await whoop_client.get_sleep_data(access_token, start_str, end_str)
            logger.info(f"DEBUG: Fetched {len(sleep_data)} sleep records")
        except Exception as e:
            logger.warning(f"DEBUG: Error fetching sleep data: {e}, continuing with empty list")
            sleep_data = []
        
        # 3. Fetch Recovery (New for V2)
        await asyncio.sleep(0.5)
        try:
            recovery_data = await whoop_client.get_recovery_data(access_token, start_str, end_str)
            logger.info(f"DEBUG: Fetched {len(recovery_data)} recovery records")
        except Exception as e:
            logger.warning(f"DEBUG: Error fetching recovery data: {e}, continuing with empty list")
            recovery_data = []
        
        # 4. Fetch Workouts
        await asyncio.sleep(0.5)
        try:
            workout_data = await whoop_client.get_workout_data(access_token, start_str, end_str)
            logger.info(f"DEBUG: Fetched {len(workout_data)} workouts")
        except Exception as e:
            logger.warning(f"DEBUG: Error fetching workout data: {e}, continuing with empty list")
            workout_data = []

        # Transform Data for Ingestion
        metrics_list = []
        
        # Index Recovery and Sleep by cycle_id for easy lookup
        recoveries_by_cycle = {r.get("cycle_id"): r for r in recovery_data}
        sleeps_by_cycle = {s.get("cycle_id"): s for s in sleep_data}
        
        # Infer global timezone offset from any cycle that has it
        # This helps if the latest cycle is missing it but others have it
        global_timezone_offset = None
        for cycle in cycles_data:
            if cycle.get("timezone_offset"):
                global_timezone_offset = cycle.get("timezone_offset")
                break
        
        if global_timezone_offset:
            logger.info(f"DEBUG: Inferred global timezone offset: {global_timezone_offset}")
        
        # Process Cycles
        for cycle in cycles_data:
            cycle_id = cycle.get("id")
            cycle_score = cycle.get("score") or {}
            
            # Date mapping: Whoop cycles have a start_time and end_time.
            # We use end_time (wake up time) to determine the date, as it consistently falls on the correct "Whoop Day"
            # (even if sleep started before midnight).
            cycle_end = cycle.get("end")
            if not cycle_end:
                # Fallback to start if end is missing (unlikely)
                cycle_end = cycle.get("start")
            
            if not cycle_end:
                continue
            
            # Parse time
            end_dt = datetime.fromisoformat(cycle_end.replace("Z", "+00:00"))
            
            # Apply timezone offset if available
            timezone_offset = cycle.get("timezone_offset") or global_timezone_offset
            
            # Get cycle start time for date determination
            cycle_start = cycle.get("start")
            start_dt = None
            if cycle_start:
                try:
                    start_dt = datetime.fromisoformat(cycle_start.replace("Z", "+00:00"))
                except:
                    pass
            
            if timezone_offset:
                try:
                    # timezone_offset format is usually "+HH:MM" or "-HH:MM"
                    sign = 1 if timezone_offset.startswith("+") else -1
                    parts = timezone_offset[1:].split(":")
                    hours = int(parts[0])
                    minutes = int(parts[1])
                    offset = timedelta(hours=hours, minutes=minutes) * sign
                    
                    # Adjust end time to local time
                    local_end_dt = end_dt + offset
                    
                    # For date assignment: Use the date when sleep STARTED (not wake-up date)
                    # This ensures that a cycle from Nov 28 night -> Nov 29 morning is assigned to Nov 28
                    if start_dt:
                        local_start_dt = start_dt + offset
                        date_val = local_start_dt.date()
                        logger.debug(f"Cycle {cycle_id}: Using sleep start date {date_val} (start: {local_start_dt}, end: {local_end_dt})")
                    else:
                        # Fallback to wake-up date if start time not available
                        date_val = local_end_dt.date()
                        logger.debug(f"Cycle {cycle_id}: Using wake-up date {date_val} (no start time available)")
                    
                    # Log date adjustments for debugging (latest cycle only)
                    # Note: recovery_score_data is defined later, so we'll log it after
                    if cycle_id == cycles_data[-1].get("id"):
                        logger.info(f"DEBUG: Latest cycle {cycle_id} - UTC start: {start_dt.date() if start_dt else 'N/A'}, UTC end: {end_dt.date()}, Local start: {local_start_dt.date() if start_dt else 'N/A'}, Local end: {local_end_dt.date()}, Assigned date: {date_val}, Offset: {timezone_offset}")
                except Exception as e:
                    logger.warning(f"Failed to parse timezone offset {timezone_offset}: {e}")
                    # Fallback: use start date if available, otherwise end date
                    date_val = start_dt.date() if start_dt else end_dt.date()
            else:
                # If no timezone offset, use sleep start date if available, otherwise wake-up date
                if start_dt:
                    date_val = start_dt.date()
                    logger.debug(f"Cycle {cycle_id}: Using UTC start date {date_val} (no timezone offset)")
                else:
                    date_val = end_dt.date()
                    logger.debug(f"Cycle {cycle_id}: Using UTC end date {date_val} (no timezone offset or start time)")
            
            # Get associated recovery and sleep
            recovery = recoveries_by_cycle.get(cycle_id, {})
            recovery_score_data = recovery.get("score") or {}
            
            # Log recovery score for latest cycle (after we have the data)
            if cycle_id == cycles_data[-1].get("id"):
                logger.info(f"DEBUG: Latest cycle {cycle_id} recovery score: {recovery_score_data.get('recovery_score')}")
            
            sleep = sleeps_by_cycle.get(cycle_id, {})
            sleep_score_data = sleep.get("score") or {}
            sleep_stage_summary = sleep_score_data.get("stage_summary", {})
            sleep_needed = sleep_score_data.get("sleep_needed", {})
            
            # Calculate sleep metrics
            # Sleep duration is in milliseconds
            duration_ms = sleep_stage_summary.get("total_in_bed_time_milli", 0)
            sleep_hours = duration_ms / (1000 * 60 * 60)
            
            need_ms = sleep_needed.get("baseline_milli", 0)
            sleep_debt = (need_ms - duration_ms) / (1000 * 60) if need_ms > duration_ms else 0
            
            metrics = {
                "date": date_val,
                "recovery_score": recovery_score_data.get("recovery_score"),
                "hrv": recovery_score_data.get("hrv_rmssd_milli"),
                "resting_hr": recovery_score_data.get("resting_heart_rate"),
                "strain_score": cycle_score.get("strain"), # Direct float in V2
                "sleep_hours": sleep_hours,
                "sleep_debt": sleep_debt,
                "consistency_score": sleep_score_data.get("sleep_consistency_percentage"),
                "extra": {
                    "spo2_percentage": recovery_score_data.get("spo2_percentage"),
                    "skin_temp_celsius": recovery_score_data.get("skin_temp_celsius"),
                    "respiratory_rate": sleep_score_data.get("respiratory_rate"),
                    "sleep_efficiency_percentage": sleep_score_data.get("sleep_efficiency_percentage"),
                    "sleep_performance_percentage": sleep_score_data.get("sleep_performance_percentage"),
                    "rem_sleep_min": sleep_stage_summary.get("total_rem_sleep_time_milli", 0) / (1000 * 60),
                    "deep_sleep_min": sleep_stage_summary.get("total_slow_wave_sleep_time_milli", 0) / (1000 * 60),
                    "light_sleep_min": sleep_stage_summary.get("total_light_sleep_time_milli", 0) / (1000 * 60),
                    "awake_time_min": sleep_stage_summary.get("total_awake_time_milli", 0) / (1000 * 60),
                    "calories": cycle_score.get("kilojoule", 0) * 0.239006,
                    "average_heart_rate": cycle_score.get("average_heart_rate"),
                    "max_heart_rate": cycle_score.get("max_heart_rate"),
                }
            }
            metrics_list.append(metrics)
            
        # Create a dictionary to handle potential duplicates (multiple cycles per day? unlikely but good to be safe)
        # We'll use the latest cycle for a given date
        metrics_by_date = {m["date"]: m for m in metrics_list}

        # Convert back to list
        final_metrics = list(metrics_by_date.values())
        metrics_df = pd.DataFrame(final_metrics)
        
        # Log date range of fetched data
        if not metrics_df.empty and "date" in metrics_df.columns:
            min_date = metrics_df["date"].min()
            max_date = metrics_df["date"].max()
            logger.info(f"DEBUG: Prepared {len(metrics_df)} rows for ingestion")
            logger.info(f"DEBUG: Date range in fetched data: {min_date} to {max_date}")
            logger.info(f"DEBUG: Latest recovery score: {metrics_df.loc[metrics_df['date'] == max_date, 'recovery_score'].iloc[0] if not metrics_df.loc[metrics_df['date'] == max_date, 'recovery_score'].empty else 'N/A'}")
        else:
            logger.info(f"DEBUG: Prepared {len(metrics_df)} rows for ingestion (no date column found)")
        
        # Clear existing data to avoid duplicates/conflicts
        # REMOVED: This is dangerous if fetch is partial. Upsert handles updates fine.
        # clear_existing_data(db, user_id)
        # logger.info("DEBUG: Cleared existing data")
        
        # Create Upload record to track data source
        from app.models.database import Upload, UploadStatus
        upload = Upload(
            id=str(uuid.uuid4()),
            user_id=user_id,
            file_path=None,  # No file for API data
            status=UploadStatus.COMPLETED,
            data_source="whoop_api",
            created_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
        )
        db.add(upload)
        db.commit()
        logger.info(f"DEBUG: Created Upload record {upload.id} for WHOOP API data")
        
        # Ingest Metrics
        upserted = upsert_daily_metrics(db, user_id, metrics_df)
        logger.info(f"DEBUG: Upserted {upserted} metrics")
        
        # Process Workouts
        workouts_list = []
        for workout in workout_data:
            score = workout.get("score") or {}
            start = workout.get("start")
            end = workout.get("end")
            if not start or not end:
                continue
                
            start_dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
            end_dt = datetime.fromisoformat(end.replace("Z", "+00:00"))
            
            duration_min = (end_dt - start_dt).total_seconds() / 60
            
            workouts_list.append({
                "workout_id": str(workout.get("id")),
                "date": start_dt.date(),
                "start_time": start_dt,
                "end_time": end_dt,
                "duration_minutes": duration_min,
                "sport_type": str(workout.get("sport_id", "unknown")), # Whoop returns IDs, we might need a map, but ID is fine for now
                "avg_hr": score.get("average_heart_rate"),
                "max_hr": score.get("max_heart_rate"),
                "strain": score.get("strain"),
                "calories": score.get("kilojoule", 0) * 0.239006, # Convert kJ to kcal
                "tags": None,
            })
            
        created, skipped = persist_workouts(db, user_id, workouts_list)
        logger.info(f"DEBUG: Workouts created: {created}, skipped: {skipped}")
        
        # Trigger ML
        try:
            recompute_daily_features(db, user_id)
            train_user_models(db, user_id)
        except Exception as e:
            logger.error(f"ML Error: {e}")

        # Invalidate caches
        from app.services.analysis.dashboard_service import analytics_cache, summary_cache
        analytics_cache.clear()
        summary_cache.clear()
        logger.info("DEBUG: Caches cleared")

        # Redirect to frontend dashboard
        settings = get_settings()
        frontend_url = settings.frontend_url.rstrip('/')
        redirect_url = f"{frontend_url}/dashboard?whoop_connected=true"
        logger.info(f"DEBUG: Redirecting to frontend: {redirect_url}")
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        logger.error(f"Failed to connect Whoop: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to connect Whoop: {str(e)}")


async def _fetch_and_ingest_whoop_data(
    access_token: str,
    user_id: str,
    db: Session,
    days_back: int = 30
) -> dict:
    """
    Helper function to fetch Whoop data and ingest it into the database.
    Returns a dict with stats about what was fetched.
    """
    from app.services.ingestion.whoop_ingestion import upsert_daily_metrics, persist_workouts
    from app.ml.feature_engineering.daily_features import recompute_daily_features
    from app.ml.models.trainer import train_user_models
    import pandas as pd
    from datetime import datetime, timedelta
    
    # Fetch recent data (last N days) to get latest recovery
    end_date = datetime.utcnow() - timedelta(minutes=1)  # 1 minute buffer for clock skew
    start_date = end_date - timedelta(days=days_back)
    start_date = start_date.replace(microsecond=0)
    end_date = end_date.replace(microsecond=0)
    
    start_str = start_date.isoformat() + "Z"
    end_str = end_date.isoformat() + "Z"
    
    logger.info(f"DEBUG: Fetching recent data from {start_str} to {end_str} (last {days_back} days)")
    
    # Fetch all data types
    cycles_data = await whoop_client.get_cycle_data(access_token, start_str, end_str)
    logger.info(f"DEBUG: Fetched {len(cycles_data)} cycles")
    
    await asyncio.sleep(0.5)
    try:
        sleep_data = await whoop_client.get_sleep_data(access_token, start_str, end_str)
        logger.info(f"DEBUG: Fetched {len(sleep_data)} sleep records")
    except Exception as e:
        logger.warning(f"DEBUG: Error fetching sleep data: {e}, continuing with empty list")
        sleep_data = []
    
    await asyncio.sleep(0.5)
    try:
        recovery_data = await whoop_client.get_recovery_data(access_token, start_str, end_str)
        logger.info(f"DEBUG: Fetched {len(recovery_data)} recovery records")
    except Exception as e:
        logger.warning(f"DEBUG: Error fetching recovery data: {e}, continuing with empty list")
        recovery_data = []
    
    await asyncio.sleep(0.5)
    try:
        workout_data = await whoop_client.get_workout_data(access_token, start_str, end_str)
        logger.info(f"DEBUG: Fetched {len(workout_data)} workouts")
    except Exception as e:
        logger.warning(f"DEBUG: Error fetching workout data: {e}, continuing with empty list")
        workout_data = []
    
    # Process cycles (same logic as callback)
    metrics_list = []
    recoveries_by_cycle = {r.get("cycle_id"): r for r in recovery_data}
    sleeps_by_cycle = {s.get("cycle_id"): s for s in sleep_data}
    
    global_timezone_offset = None
    for cycle in cycles_data:
        if cycle.get("timezone_offset"):
            global_timezone_offset = cycle.get("timezone_offset")
            break
    
    for cycle in cycles_data:
        cycle_id = cycle.get("id")
        cycle_score = cycle.get("score") or {}
        cycle_end = cycle.get("end") or cycle.get("start")
        if not cycle_end:
            continue
        
        end_dt = datetime.fromisoformat(cycle_end.replace("Z", "+00:00"))
        timezone_offset = cycle.get("timezone_offset") or global_timezone_offset
        
        # Get cycle start time for date determination
        cycle_start = cycle.get("start")
        start_dt = None
        if cycle_start:
            try:
                start_dt = datetime.fromisoformat(cycle_start.replace("Z", "+00:00"))
            except:
                pass
        
        if timezone_offset:
            try:
                sign = 1 if timezone_offset.startswith("+") else -1
                parts = timezone_offset[1:].split(":")
                hours = int(parts[0])
                minutes = int(parts[1])
                offset = timedelta(hours=hours, minutes=minutes) * sign
                
                # Adjust end time to local time
                local_end_dt = end_dt + offset
                
                # For date assignment: Use the date when sleep STARTED (not wake-up date)
                if start_dt:
                    local_start_dt = start_dt + offset
                    date_val = local_start_dt.date()
                else:
                    # Fallback to wake-up date if start time not available
                    date_val = local_end_dt.date()
            except Exception as e:
                logger.warning(f"Failed to parse timezone offset {timezone_offset}: {e}")
                # Fallback: use start date if available, otherwise end date
                date_val = start_dt.date() if start_dt else end_dt.date()
        else:
            # If no timezone offset, use sleep start date if available, otherwise wake-up date
            if start_dt:
                date_val = start_dt.date()
            else:
                date_val = end_dt.date()
        
        recovery = recoveries_by_cycle.get(cycle_id, {})
        recovery_score_data = recovery.get("score") or {}
        sleep = sleeps_by_cycle.get(cycle_id, {})
        sleep_score_data = sleep.get("score") or {}
        sleep_stage_summary = sleep_score_data.get("stage_summary", {})
        sleep_needed = sleep_score_data.get("sleep_needed", {})
        
        duration_ms = sleep_stage_summary.get("total_in_bed_time_milli", 0)
        sleep_hours = duration_ms / (1000 * 60 * 60)
        need_ms = sleep_needed.get("baseline_milli", 0)
        sleep_debt = (need_ms - duration_ms) / (1000 * 60) if need_ms > duration_ms else 0
        
        metrics = {
            "date": date_val,
            "recovery_score": recovery_score_data.get("recovery_score"),
            "hrv": recovery_score_data.get("hrv_rmssd_milli"),
            "resting_hr": recovery_score_data.get("resting_heart_rate"),
            "strain_score": cycle_score.get("strain"),
            "sleep_hours": sleep_hours,
            "sleep_debt": sleep_debt,
            "consistency_score": sleep_score_data.get("sleep_consistency_percentage"),
            "extra": {
                "spo2_percentage": recovery_score_data.get("spo2_percentage"),
                "skin_temp_celsius": recovery_score_data.get("skin_temp_celsius"),
                "respiratory_rate": sleep_score_data.get("respiratory_rate"),
                "sleep_efficiency_percentage": sleep_score_data.get("sleep_efficiency_percentage"),
                "sleep_performance_percentage": sleep_score_data.get("sleep_performance_percentage"),
                "rem_sleep_min": sleep_stage_summary.get("total_rem_sleep_time_milli", 0) / (1000 * 60),
                "deep_sleep_min": sleep_stage_summary.get("total_slow_wave_sleep_time_milli", 0) / (1000 * 60),
                "light_sleep_min": sleep_stage_summary.get("total_light_sleep_time_milli", 0) / (1000 * 60),
                "awake_time_min": sleep_stage_summary.get("total_awake_time_milli", 0) / (1000 * 60),
                "calories": cycle_score.get("kilojoule", 0) * 0.239006,
                "average_heart_rate": cycle_score.get("average_heart_rate"),
                "max_heart_rate": cycle_score.get("max_heart_rate"),
            }
        }
        metrics_list.append(metrics)
    
    metrics_by_date = {m["date"]: m for m in metrics_list}
    final_metrics = list(metrics_by_date.values())
    metrics_df = pd.DataFrame(final_metrics)
    
    if not metrics_df.empty and "date" in metrics_df.columns:
        min_date = metrics_df["date"].min()
        max_date = metrics_df["date"].max()
        latest_recovery = metrics_df.loc[metrics_df["date"] == max_date, "recovery_score"]
        latest_recovery_val = latest_recovery.iloc[0] if not latest_recovery.empty else None
        logger.info(f"DEBUG: Date range: {min_date} to {max_date}, Latest recovery: {latest_recovery_val}")
    
    upserted = upsert_daily_metrics(db, user_id, metrics_df)
    logger.info(f"DEBUG: Upserted {upserted} metrics")
    
    # Process workouts
    workouts_list = []
    for workout in workout_data:
        score = workout.get("score") or {}
        start = workout.get("start")
        end = workout.get("end")
        if not start or not end:
            continue
        
        start_dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(end.replace("Z", "+00:00"))
        duration_min = (end_dt - start_dt).total_seconds() / 60
        
        workouts_list.append({
            "workout_id": str(workout.get("id")),
            "date": start_dt.date(),
            "start_time": start_dt,
            "end_time": end_dt,
            "duration_minutes": duration_min,
            "sport_type": str(workout.get("sport_id", "unknown")),
            "avg_hr": score.get("average_heart_rate"),
            "max_hr": score.get("max_heart_rate"),
            "strain": score.get("strain"),
            "calories": score.get("kilojoule", 0) * 0.239006,
            "tags": None,
        })
    
    created, skipped = persist_workouts(db, user_id, workouts_list)
    logger.info(f"DEBUG: Workouts created: {created}, skipped: {skipped}")
    
    # Trigger ML
    try:
        recompute_daily_features(db, user_id)
        train_user_models(db, user_id)
    except Exception as e:
        logger.error(f"ML Error: {e}")
    
    # Invalidate caches
    from app.services.analysis.dashboard_service import analytics_cache, summary_cache
    analytics_cache.clear()
    summary_cache.clear()
    
    return {
        "metrics_upserted": upserted,
        "workouts_created": created,
        "date_range": {
            "min": str(min_date) if not metrics_df.empty and "date" in metrics_df.columns else None,
            "max": str(max_date) if not metrics_df.empty and "date" in metrics_df.columns else None,
        },
        "latest_recovery": latest_recovery_val if not metrics_df.empty else None,
    }


@router.post("/sync")
async def sync_whoop_data(user_id: str, db: Session = Depends(get_db)):
    """
    Manually sync Whoop data for an already-connected user.
    This endpoint fetches the last 30 days of data to get the latest recovery.
    Uses stored refresh tokens to get a new access token if needed.
    """
    try:
        from app.models.database import WhoopToken
        from datetime import datetime, timedelta
        
        # Get stored tokens
        whoop_token = db.query(WhoopToken).filter(WhoopToken.user_id == user_id).first()
        if not whoop_token:
            raise HTTPException(
                status_code=404,
                detail="No Whoop connection found. Please connect your Whoop account first."
            )
        
        # Check if access token is expired or about to expire (within 5 minutes)
        access_token = whoop_token.access_token
        if whoop_token.expires_at and whoop_token.expires_at <= datetime.utcnow() + timedelta(minutes=5):
            logger.info(f"DEBUG: Access token expired or expiring soon, refreshing...")
            try:
                # Refresh the access token
                token_data = await whoop_client.refresh_access_token(whoop_token.refresh_token)
                access_token = token_data["access_token"]
                
                # Update stored tokens
                expires_in = token_data.get("expires_in", 3600)
                expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
                whoop_token.access_token = access_token
                whoop_token.refresh_token = token_data.get("refresh_token", whoop_token.refresh_token)  # New refresh token if provided
                whoop_token.expires_at = expires_at
                whoop_token.updated_at = datetime.utcnow()
                db.commit()
                logger.info(f"DEBUG: Refreshed access token for user: {user_id}")
            except Exception as e:
                logger.error(f"DEBUG: Failed to refresh token: {e}")
                raise HTTPException(
                    status_code=401,
                    detail="Failed to refresh access token. Please reconnect your Whoop account."
                )
        
        # Fetch and ingest latest data (last 30 days)
        sync_result = await _fetch_and_ingest_whoop_data(
            access_token=access_token,
            user_id=user_id,
            db=db,
            days_back=30
        )
        
        # Update last_sync_at
        whoop_token.last_sync_at = datetime.utcnow()
        db.commit()
        
        return {
            "success": True,
            "message": "Data synced successfully",
            "metrics_upserted": sync_result.get("metrics_upserted", 0),
            "workouts_created": sync_result.get("workouts_created", 0),
            "latest_recovery": sync_result.get("latest_recovery"),
            "date_range": sync_result.get("date_range"),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to sync Whoop data: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to sync Whoop data: {str(e)}")
