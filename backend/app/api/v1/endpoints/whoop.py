from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
import logging
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
    # Pass user_id as state to ensure we know who to sync data for in the callback
    auth_url = whoop_client.get_authorization_url(state=user_id)
    logger.info(f"DEBUG: Generated Auth URL: {auth_url}")
    return {"url": auth_url}

@router.get("/callback")
async def whoop_callback(code: str, state: str, user_id: str = None, db: Session = Depends(get_db)):
    """
    Handles the callback from Whoop, exchanges code for token, and syncs data.
    """
    try:
        logger.info(f"DEBUG: Callback received for user_id: {user_id}")
        
        # If user_id is not provided in query, try to get it from the state or assume single user mode for now
        # In this app, the frontend sends user_id as a query param to this endpoint
        # If user_id is not provided in query, try to get it from the state
        if not user_id and state:
            logger.info(f"DEBUG: Using state as user_id: {state}")
            user_id = state
            
        if not user_id:
            logger.info("DEBUG: No user_id provided and no state, using default_user")
            user_id = "default_user" 

        token_data = await whoop_client.get_access_token(code)
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

        # Fetch Data (Last 90 days to be safe)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=90)
        start_str = start_date.isoformat() + "Z"
        end_str = end_date.isoformat() + "Z"

        logger.info(f"DEBUG: Fetching data from {start_str} to {end_str}")

        # 1. Fetch Cycles (Recovery, Strain)
        cycles_data = await whoop_client.get_cycle_data(access_token, start_str, end_str)
        logger.info(f"DEBUG: Fetched {len(cycles_data)} cycles")
        
        # 2. Fetch Sleep
        sleep_data = await whoop_client.get_sleep_data(access_token, start_str, end_str)
        logger.info(f"DEBUG: Fetched {len(sleep_data)} sleep records")
        
        # 3. Fetch Recovery (New for V2)
        recovery_data = await whoop_client.get_recovery_data(access_token, start_str, end_str)
        logger.info(f"DEBUG: Fetched {len(recovery_data)} recovery records")
        
        # 4. Fetch Workouts
        workout_data = await whoop_client.get_workout_data(access_token, start_str, end_str)
        logger.info(f"DEBUG: Fetched {len(workout_data)} workouts")

        # Transform Data for Ingestion
        metrics_list = []
        
        # Index Recovery and Sleep by cycle_id for easy lookup
        recoveries_by_cycle = {r.get("cycle_id"): r for r in recovery_data}
        sleeps_by_cycle = {s.get("cycle_id"): s for s in sleep_data}
        
        # Process Cycles
        for cycle in cycles_data:
            cycle_id = cycle.get("id")
            cycle_score = cycle.get("score", {})
            
            # Date mapping: Whoop cycles have a start_time. We use that date.
            cycle_start = cycle.get("start")
            if not cycle_start:
                continue
            date_val = datetime.fromisoformat(cycle_start.replace("Z", "+00:00")).date()
            
            # Get associated recovery and sleep
            recovery = recoveries_by_cycle.get(cycle_id, {})
            recovery_score_data = recovery.get("score", {})
            
            sleep = sleeps_by_cycle.get(cycle_id, {})
            sleep_score_data = sleep.get("score", {})
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
                "consistency_score": sleep_score_data.get("sleep_consistency_percentage")
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
        clear_existing_data(db, user_id)
        logger.info("DEBUG: Cleared existing data")
        
        # Ingest Metrics
        upserted = upsert_daily_metrics(db, user_id, metrics_df)
        logger.info(f"DEBUG: Upserted {upserted} metrics")
        
        # Process Workouts
        workouts_list = []
        for workout in workout_data:
            score = workout.get("score", {})
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

        return {
            "status": "success", 
            "message": "Whoop connected and data synced successfully", 
            "user": profile,
        }
        
    except Exception as e:
        logger.error(f"Failed to connect Whoop: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to connect Whoop: {str(e)}")
