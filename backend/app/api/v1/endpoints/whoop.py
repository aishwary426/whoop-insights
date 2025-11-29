from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
import logging
import asyncio
from sqlalchemy.orm import Session
from typing import Optional

from app.db_session import get_db
from app.services.whoop_client import whoop_client

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
        
        # Fetch Profile
        profile = await whoop_client.get_profile(access_token)
        logger.info(f"DEBUG: Fetched profile for: {profile.get('email')}")
        
        # Update User Profile in DB
        from app.services.ingestion.whoop_ingestion import ensure_user, clear_existing_data, upsert_daily_metrics, persist_workouts
        from app.ml.feature_engineering.daily_features import recompute_daily_features
        from app.ml.models.trainer import train_user_models
        import pandas as pd
        from datetime import datetime, timedelta

        # Map profile data
        ensure_user(
            db, 
            user_id, 
            email=profile.get("email"), 
            name=f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip(),
        )

        # Fetch Data - Use a reasonable date range (last 2 years)
        # Whoop API may have limits on date range, so we'll fetch in chunks if needed
        end_date = datetime.utcnow() - timedelta(minutes=5)
        # Start from 2 years ago, or account creation date if available
        # Most users won't have data older than 2 years anyway
        start_date = end_date - timedelta(days=730)  # ~2 years
        # Strip microseconds to avoid 400 Bad Request from Whoop API
        start_date = start_date.replace(microsecond=0)
        end_date = end_date.replace(microsecond=0)
        
        start_str = start_date.isoformat() + "Z"
        end_str = end_date.isoformat() + "Z"

        logger.info(f"DEBUG: Fetching data from {start_str} to {end_str}")

        # 1. Fetch Cycles (Recovery, Strain)
        # Try 2 years first, fall back to 1 year if API rejects it
        try:
            cycles_data = await whoop_client.get_cycle_data(access_token, start_str, end_str)
            logger.info(f"DEBUG: Fetched {len(cycles_data)} cycles")
        except Exception as e:
            error_msg = str(e)
            logger.error(f"DEBUG: Error fetching cycles: {error_msg}")
            # If date range is too large, try a smaller range (last 1 year)
            if "400" in error_msg or "Bad Request" in error_msg:
                logger.info("DEBUG: Date range too large, trying last 1 year instead")
                start_date = end_date - timedelta(days=365)
                start_date = start_date.replace(microsecond=0)
                start_str = start_date.isoformat() + "Z"
                try:
                    cycles_data = await whoop_client.get_cycle_data(access_token, start_str, end_str)
                    logger.info(f"DEBUG: Fetched {len(cycles_data)} cycles with 1-year range")
                except Exception as e2:
                    logger.error(f"DEBUG: Still failed with 1-year range: {e2}")
                    # Last resort: try last 90 days
                    start_date = end_date - timedelta(days=90)
                    start_date = start_date.replace(microsecond=0)
                    start_str = start_date.isoformat() + "Z"
                    cycles_data = await whoop_client.get_cycle_data(access_token, start_str, end_str)
                    logger.info(f"DEBUG: Fetched {len(cycles_data)} cycles with 90-day range")
            else:
                raise
        
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
            timezone_offset = cycle.get("timezone_offset")
            if timezone_offset:
                try:
                    # timezone_offset format is usually "+HH:MM" or "-HH:MM"
                    sign = 1 if timezone_offset.startswith("+") else -1
                    parts = timezone_offset[1:].split(":")
                    hours = int(parts[0])
                    minutes = int(parts[1])
                    offset = timedelta(hours=hours, minutes=minutes) * sign
                    
                    # Adjust to local time
                    local_dt = end_dt + offset
                    date_val = local_dt.date()
                    logger.info(f"DEBUG: Adjusted cycle {cycle_id} date from {end_dt.date()} (UTC) to {date_val} (Local) using offset {timezone_offset}")
                except Exception as e:
                    logger.warning(f"Failed to parse timezone offset {timezone_offset}: {e}")
                    date_val = end_dt.date()
            else:
                # If no timezone offset, use UTC end time.
                # This is a better heuristic than UTC start time because wake up time (e.g. 7 AM IST = 1:30 AM UTC)
                # is usually on the correct day in UTC as well, whereas start time (11 PM IST = 5:30 PM UTC) is often previous day.
                date_val = end_dt.date()
            
            # Get associated recovery and sleep
            recovery = recoveries_by_cycle.get(cycle_id, {})
            recovery_score_data = recovery.get("score") or {}
            
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
        logger.info(f"DEBUG: Prepared {len(metrics_df)} rows for ingestion")
        
        # Clear existing data to avoid duplicates/conflicts
        # REMOVED: This is dangerous if fetch is partial. Upsert handles updates fine.
        # clear_existing_data(db, user_id)
        # logger.info("DEBUG: Cleared existing data")
        
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
        return RedirectResponse(url="/dashboard?whoop_connected=true")
        
    except Exception as e:
        logger.error(f"Failed to connect Whoop: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to connect Whoop: {str(e)}")
