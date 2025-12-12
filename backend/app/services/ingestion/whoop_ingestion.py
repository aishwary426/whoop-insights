import logging
import os
import uuid
from datetime import datetime, date
from pathlib import Path
from typing import Callable, Dict, List, Tuple, Optional

import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.database import DailyMetrics, Upload, UploadStatus, User, Workout, Insight
from app.utils.zip_utils import save_upload_file, unzip_whoop_export

# Lazy import ML features to avoid loading heavy dependencies if not needed
def _get_ml_features():
    """Lazy import for ML feature engineering."""
    try:
        from app.ml.feature_engineering.daily_features import recompute_daily_features
        return recompute_daily_features
    except Exception as e:
        logger.warning(f"ML features not available: {e}")
        return None

def _get_ml_trainer():
    """Lazy import for ML model training."""
    try:
        from app.ml.models.trainer import train_user_models
        logger.info("ML trainer imported successfully")
        return train_user_models
    except Exception as e:
        logger.error(f"ML training not available: {e}", exc_info=True)
        return None

logger = logging.getLogger(__name__)


def ensure_user(db: Session, user_id: str, email: Optional[str] = None, name: Optional[str] = None, age: Optional[int] = None, nationality: Optional[str] = None, goal: Optional[str] = None) -> User:
    # Normalize name: treat "-", empty strings, and None as invalid
    if name:
        name = name.strip()
        if name == "-" or name == "":
            name = None
    
    user = db.query(User).filter(User.id == user_id).first()
    
    # If not found by ID, try finding by email to avoid Unique constraint violation
    if not user and email:
        user = db.query(User).filter(User.email == email).first()
        if user:
            logger.info(f"Found existing user by email {email} (ID: {user.id}) matching request ID {user_id}")
            # We use the existing user. 
            # Note: The user_id passed in might be different. 
            # In a strict system we might error, but here we want to link.
    
    if not user:
        # Only set default name if no valid name provided
        final_name = name if name else None  # Don't use default "User {id}" anymore
        user = User(
            id=user_id,
            email=email or f"{user_id}@auto.com",
            name=final_name,
            age=age,
            nationality=nationality,
            goal=goal,
        )
        db.add(user)
        db.commit()
        logger.info(f"Created new user: {user_id}")
    else:
        # Update user fields if provided (always update to keep in sync)
        updated = False
        # Only update name if a valid name is provided (not "-" or empty)
        if name and name != "-" and name.strip() != "":
            # Also clear existing "-" or default names
            if not user.name or user.name == "-" or user.name.startswith("User "):
                user.name = name
                updated = True
            elif user.name != name:
                user.name = name
                updated = True
        # If name is "-" or empty and user has "-", clear it
        elif (not name or name == "-") and user.name == "-":
            user.name = None
            updated = True
        if age is not None and (not user.age or user.age != age):
            user.age = age
            updated = True
        if nationality and (not user.nationality or user.nationality != nationality):
            user.nationality = nationality
            updated = True
        if goal and (not user.goal or user.goal != goal):
            user.goal = goal
            updated = True
        if email and (not user.email or user.email != email):
            user.email = email
            updated = True
        if updated:
            db.commit()
    return user


def clear_existing_data(db: Session, user_id: str) -> Tuple[int, int, int]:
    """
    Clear all existing data for a user before ingesting new data.
    This ensures that new uploads replace old data completely.
    
    Returns:
        Tuple of (deleted_metrics_count, deleted_workouts_count, deleted_insights_count)
    """
    logger.info(f"Clearing existing data for user {user_id}")
    
    # Delete all daily metrics
    deleted_metrics = db.query(DailyMetrics).filter(DailyMetrics.user_id == user_id).delete()
    
    # Delete all workouts
    deleted_workouts = db.query(Workout).filter(Workout.user_id == user_id).delete()
    
    # Delete all insights (they'll be regenerated from new data)
    deleted_insights = db.query(Insight).filter(Insight.user_id == user_id).delete()
    
    # db.commit()  # REMOVED: Keep transaction open so we can rollback if ingestion fails
    
    logger.info(f"Cleared {deleted_metrics} daily metrics, {deleted_workouts} workouts, and {deleted_insights} insights for user {user_id}")
    
    return deleted_metrics, deleted_workouts, deleted_insights


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize column names: lowercase, strip, replace spaces with underscores."""
    if df.empty or len(df.columns) == 0:
        return df
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
    return df


def _read_csv_safe(path: str) -> pd.DataFrame:
    """Read CSV file with encoding fallback handling."""
    try:
        # Try UTF-8 first (most common)
        return pd.read_csv(path, encoding='utf-8')
    except UnicodeDecodeError:
        try:
            # Try Latin-1 (handles most Western European characters)
            return pd.read_csv(path, encoding='latin-1')
        except Exception:
            # Fallback: ignore encoding errors
            return pd.read_csv(path, encoding='utf-8', errors='ignore')


def discover_whoop_csvs(extracted_dir: str) -> Dict[str, List[str]]:
    """Return a map of domain -> list of CSV files found in the unzip folder."""
    domain_hits = {"sleep": [], "recovery": [], "strain": [], "workouts": [], "physiological_cycles": [], "journal": []}
    for root, _, files in os.walk(extracted_dir):
        for fname in files:
            if not fname.lower().endswith(".csv"):
                continue
            lower = fname.lower()
            full_path = str(Path(root) / fname)
            
            if "physiological_cycles" in lower:
                domain_hits["physiological_cycles"].append(full_path)
            elif "sleep" in lower:
                domain_hits["sleep"].append(full_path)
            elif "recovery" in lower:
                domain_hits["recovery"].append(full_path)
            elif "strain" in lower:
                domain_hits["strain"].append(full_path)
            elif "workout" in lower:
                domain_hits["workouts"].append(full_path)
            elif "journal" in lower or "entries" in lower:
                domain_hits["journal"].append(full_path)
    return domain_hits


def parse_physiological_cycles(paths: List[str]) -> pd.DataFrame:
    """Parse the consolidated physiological cycles file."""
    frames = []
    for path in paths:
        if not os.path.exists(path):
            logger.warning(f"CSV file not found: {path}")
            continue
        try:
            df = _read_csv_safe(path)
            if df.empty:
                logger.warning(f"CSV file {path} is empty")
                continue
            df = _normalize_columns(df)
        except Exception as e:
            logger.error(f"Error reading CSV file {path}: {e}", exc_info=True)
            raise ValueError(f"Failed to read physiological_cycles.csv: {str(e)}")
        
        # Map columns
        # Cycle start time -> date
        date_col = next((c for c in df.columns if "cycle_start" in c), None)
        if not date_col:
            logger.warning(f"No 'cycle_start' column found in {path}")
            continue
            
        # Timezone handling
        tz_col = next((c for c in df.columns if "timezone_offset" in c), None)
        
        def _get_local_date(row):
            try:
                # Parse start time
                start_str = str(row[date_col])
                if not start_str or pd.isna(start_str):
                    return pd.NA
                
                # Handle ISO format with Z
                start_dt = pd.to_datetime(start_str).to_pydatetime()
                if start_dt.tzinfo is None:
                    # Assume UTC if no tz info
                    import pytz
                    start_dt = start_dt.replace(tzinfo=pytz.UTC)
                
                # Apply offset if available
                if tz_col and pd.notna(row.get(tz_col)):
                    offset_str = str(row[tz_col])
                    # Parse offset like "+05:30" or "-04:00"
                    sign = 1 if offset_str.startswith("+") else -1
                    parts = offset_str[1:].split(":")
                    if len(parts) >= 2:
                        hours = int(parts[0])
                        minutes = int(parts[1])
                        from datetime import timedelta
                        offset = timedelta(hours=hours, minutes=minutes) * sign
                        start_dt = start_dt + offset
                
                return start_dt.date()
            except Exception as e:
                # Fallback
                return pd.to_datetime(row[date_col]).date()

        df["date"] = df.apply(_get_local_date, axis=1)
        
        # Recovery
        rec_col = next((c for c in df.columns if "recovery_score" in c), None)
        df["recovery_score"] = df[rec_col] if rec_col else pd.NA
        
        # Strain
        strain_col = next((c for c in df.columns if "day_strain" in c), None)
        df["strain_score"] = df[strain_col] if strain_col else pd.NA
        
        # HRV
        hrv_col = next((c for c in df.columns if "heart_rate_variability" in c), None)
        df["hrv"] = df[hrv_col] if hrv_col else pd.NA
        
        # RHR
        rhr_col = next((c for c in df.columns if "resting_heart_rate" in c), None)
        df["resting_hr"] = df[rhr_col] if rhr_col else pd.NA
        
        # Sleep Hours (Asleep duration is usually in minutes)
        sleep_dur_col = next((c for c in df.columns if "asleep_duration" in c), None)
        if sleep_dur_col:
            df["sleep_hours"] = df[sleep_dur_col] / 60.0
        else:
            df["sleep_hours"] = pd.NA
            
        # Sleep Debt (minutes)
        debt_col = next((c for c in df.columns if "sleep_debt" in c), None)
        if debt_col:
            df["sleep_debt"] = df[debt_col] / 60.0
        else:
            df["sleep_debt"] = pd.NA
            
        # Sleep Consistency
        const_col = next((c for c in df.columns if "sleep_consistency" in c), None)
        df["consistency_score"] = df[const_col] if const_col else pd.NA

        # Capture Journal/Extra Data
        # Exclude columns we've already mapped or are standard identifiers
        mapped_cols = {
            date_col, rec_col, strain_col, hrv_col, rhr_col, 
            sleep_dur_col, debt_col, const_col, 
            "cycle_id", "user_id", "created_at", "updated_at", "date"
        }
        
        def _extract_journal(row):
            data = {}
            for col in df.columns:
                if col not in mapped_cols and pd.notna(row[col]):
                    val = row[col]
                    # Ensure JSON serializability
                    if isinstance(val, (datetime, date)):
                        val = val.isoformat()
                    data[col] = val
            return data

        df["extra"] = df.apply(_extract_journal, axis=1)

        frames.append(df[[
            "date", "recovery_score", "strain_score", "hrv", "resting_hr", 
            "sleep_hours", "sleep_debt", "consistency_score", "extra"
        ]].copy())
        
    if not frames:
        return pd.DataFrame()
        
    combined_df = pd.concat(frames)
    
    # Deduplicate by date, keeping the one with the highest recovery score (primary cycle)
    # If recovery score is same or null, we'll just take the first one after sorting
    combined_df = combined_df.sort_values("recovery_score", ascending=False)
    combined_df = combined_df.drop_duplicates(subset=["date"], keep="first")
    
    return combined_df


def parse_sleep(paths: List[str]) -> pd.DataFrame:
    frames = []
    for path in paths:
        if not os.path.exists(path):
            logger.warning(f"CSV file not found: {path}")
            continue
        try:
            df = _read_csv_safe(path)
            if df.empty:
                logger.warning(f"CSV file {path} is empty")
                continue
            df = _normalize_columns(df)
        except Exception as e:
            logger.error(f"Error reading sleep CSV file {path}: {e}", exc_info=True)
            continue  # Continue with other files
        date_col = "date" if "date" in df.columns else "day"
        if date_col not in df.columns:
            continue
        df["date"] = pd.to_datetime(df[date_col]).dt.date
        sleep_col = next(
            (c for c in ["sleep_hours", "hours_slept", "total_sleep_time_hours", "sleep_performance_%"] if c in df.columns),
            None,
        )
        df["sleep_hours"] = df[sleep_col] if sleep_col else pd.NA
        frames.append(df[["date", "sleep_hours"]].copy())
    return pd.concat(frames) if frames else pd.DataFrame(columns=["date", "sleep_hours"])


def parse_recovery(paths: List[str]) -> pd.DataFrame:
    frames = []
    for path in paths:
        if not os.path.exists(path):
            logger.warning(f"CSV file not found: {path}")
            continue
        try:
            df = _read_csv_safe(path)
            if df.empty:
                logger.warning(f"CSV file {path} is empty")
                continue
            df = _normalize_columns(df)
        except Exception as e:
            logger.error(f"Error reading recovery CSV file {path}: {e}", exc_info=True)
            continue  # Continue with other files
        date_col = "date" if "date" in df.columns else "day"
        if date_col not in df.columns:
            continue
        df["date"] = pd.to_datetime(df[date_col]).dt.date
        recovery_col = (
            "recovery_score"
            if "recovery_score" in df.columns
            else "recovery"
            if "recovery" in df.columns
            else None
        )
        hrv_col = (
            "hrv"
            if "hrv" in df.columns
            else "heart_rate_variability_(rmssd)"
            if "heart_rate_variability_(rmssd)" in df.columns
            else None
        )
        rhr_col = "resting_heart_rate" if "resting_heart_rate" in df.columns else "rhr" if "rhr" in df.columns else None
        df["recovery_score"] = df[recovery_col] if recovery_col else pd.NA
        df["hrv"] = df[hrv_col] if hrv_col else pd.NA
        df["resting_hr"] = df[rhr_col] if rhr_col else pd.NA
        frames.append(df[["date", "recovery_score", "hrv", "resting_hr"]].copy())
    return pd.concat(frames) if frames else pd.DataFrame(columns=["date", "recovery_score", "hrv", "resting_hr"])


def parse_strain(paths: List[str]) -> pd.DataFrame:
    frames = []
    for path in paths:
        if not os.path.exists(path):
            logger.warning(f"CSV file not found: {path}")
            continue
        try:
            df = _read_csv_safe(path)
            if df.empty:
                logger.warning(f"CSV file {path} is empty")
                continue
            df = _normalize_columns(df)
        except Exception as e:
            logger.error(f"Error reading strain CSV file {path}: {e}", exc_info=True)
            continue  # Continue with other files
        if "date" not in df.columns and "day" not in df.columns:
            continue
        date_series = df["date"] if "date" in df.columns else df["day"]
        df["date"] = pd.to_datetime(date_series).dt.date
        strain_col = "strain" if "strain" in df.columns else "strain_score" if "strain_score" in df.columns else None
        df["strain_score"] = df[strain_col] if strain_col else pd.NA
        frames.append(df[["date", "strain_score"]].copy())
    return pd.concat(frames) if frames else pd.DataFrame(columns=["date", "strain_score"])


def parse_workouts(paths: List[str]) -> List[dict]:
    workouts: List[dict] = []
    for path in paths:
        if not os.path.exists(path):
            logger.warning(f"CSV file not found: {path}")
            continue
        try:
            df = _read_csv_safe(path)
            if df.empty:
                logger.warning(f"CSV file {path} is empty")
                continue
            df = _normalize_columns(df)
        except Exception as e:
            logger.error(f"Error reading workouts CSV file {path}: {e}", exc_info=True)
            continue  # Continue with other files
        date_col = "date" if "date" in df.columns else "day"
        if date_col not in df.columns:
            continue
        for _, row in df.iterrows():
            start_time = pd.to_datetime(row.get("start", row.get("start_time", row[date_col]))).to_pydatetime()
            end_time = pd.to_datetime(row.get("end", row.get("end_time", start_time))).to_pydatetime()
            workouts.append(
                {
                    "workout_id": str(uuid.uuid4()),
                    "date": start_time.date(),
                    "start_time": start_time,
                    "end_time": end_time,
                    "duration_minutes": float(row.get("duration", row.get("duration_minutes", 0)) or 0),
                    "sport_type": str(row.get("sport", row.get("activity_name", "unknown")) or "unknown"),
                    "avg_hr": _safe_float(row.get("average_heart_rate") or row.get("avg_hr")),
                    "max_hr": _safe_float(row.get("max_heart_rate") or row.get("max_hr")),
                    "strain": _safe_float(row.get("strain")),
                    "calories": _safe_float(row.get("calories")),
                    "tags": None,
                }
            )
    return workouts


def parse_journal(paths: List[str]) -> pd.DataFrame:
    frames = []
    for path in paths:
        if not os.path.exists(path):
            logger.warning(f"CSV file not found: {path}")
            continue
        try:
            df = _read_csv_safe(path)
            if df.empty:
                logger.warning(f"CSV file {path} is empty")
                continue
            df = _normalize_columns(df)
        except Exception as e:
            logger.error(f"Error reading journal CSV file {path}: {e}", exc_info=True)
            continue  # Continue with other files
        date_col = "date" if "date" in df.columns else "day"
        if date_col not in df.columns:
            continue
        df["date"] = pd.to_datetime(df[date_col]).dt.date
        
        def _extract_journal(row):
            data = {}
            for col in df.columns:
                if col != "date" and col != date_col and pd.notna(row[col]):
                    val = row[col]
                    if isinstance(val, (datetime, date)):
                        val = val.isoformat()
                    data[col] = val
            return data

        df["extra"] = df.apply(_extract_journal, axis=1)
        frames.append(df[["date", "extra"]].copy())
        
    return pd.concat(frames) if frames else pd.DataFrame(columns=["date", "extra"])


def _safe_float(val):
    try:
        if isinstance(val, str):
            val = val.replace(",", "").strip()
        return float(val)
    except Exception:
        return None


def _merge_daily_metrics(sleep_df: pd.DataFrame, recovery_df: pd.DataFrame, strain_df: pd.DataFrame, journal_df: pd.DataFrame = None) -> pd.DataFrame:
    if sleep_df.empty and recovery_df.empty and strain_df.empty and (journal_df is None or journal_df.empty):
        return pd.DataFrame(columns=["date", "sleep_hours", "recovery_score", "hrv", "resting_hr", "strain_score"])

    df = None
    # Only include candidates that have a "date" column
    candidates = [
        c for c in [sleep_df, recovery_df, strain_df, journal_df] 
        if c is not None and not c.empty and "date" in c.columns
    ]
    
    if not candidates:
        logger.warning("No valid dataframes with 'date' column to merge")
        return pd.DataFrame(columns=["date", "sleep_hours", "recovery_score", "hrv", "resting_hr", "strain_score"])
    
    for candidate in candidates:
        if df is None:
            df = candidate.copy()
        else:
            try:
                df = df.merge(candidate, on="date", how="outer")
            except Exception as e:
                logger.error(f"Error merging dataframes: {e}")
                # Continue with next candidate
                continue
            
    if df is None:
        return pd.DataFrame()
        
    # If we have multiple 'extra' columns (e.g. extra_x, extra_y) from merges, combine them
    extra_cols = [c for c in df.columns if "extra" in c]
    if extra_cols:
        def _combine_extras(row):
            combined = {}
            for col in extra_cols:
                val = row[col]
                if isinstance(val, dict):
                    combined.update(val)
            return combined if combined else None
            
        df["extra"] = df.apply(_combine_extras, axis=1)
        # Drop original extra columns if they were renamed
        for col in extra_cols:
            if col != "extra":
                df = df.drop(columns=[col])

    df = df.sort_values("date")
    return df


def persist_workouts(db: Session, user_id: str, workouts: List[dict]) -> Tuple[int, int]:
    created, skipped = 0, 0
    for w in workouts:
        existing = (
            db.query(Workout)
            .filter(
                Workout.user_id == user_id,
                Workout.start_time == w["start_time"],
                Workout.duration_minutes == w["duration_minutes"],
                Workout.sport_type == w["sport_type"],
            )
            .first()
        )
        if existing:
            skipped += 1
            continue

        db.add(Workout(user_id=user_id, **w))
        created += 1
    db.commit()
    return created, skipped


def upsert_daily_metrics(db: Session, user_id: str, df: pd.DataFrame) -> int:
    if df.empty:
        return 0
    upserted = 0
    for _, row in df.iterrows():
        if pd.isna(row.get("date")):
            continue
        date_val = row["date"]
        dm = (
            db.query(DailyMetrics)
            .filter(DailyMetrics.user_id == user_id, DailyMetrics.date == date_val)
            .first()
        )
        payload = {
            "sleep_hours": _safe_float(row.get("sleep_hours")),
            "recovery_score": _safe_float(row.get("recovery_score")),
            "hrv": _safe_float(row.get("hrv")),
            "resting_hr": _safe_float(row.get("resting_hr")),
            "strain_score": _safe_float(row.get("strain_score")),
            "sleep_debt": _safe_float(row.get("sleep_debt")),
            "consistency_score": _safe_float(row.get("consistency_score")),
            "extra": row.get("extra"),
        }
        if dm:
            for k, v in payload.items():
                if v is not None:
                    setattr(dm, k, v)
        else:
            dm = DailyMetrics(user_id=user_id, date=date_val, **payload)
            db.add(dm)
        upserted += 1
    db.commit()
    return upserted


def ingest_whoop_zip(
    db: Session,
    user_id: str,
    file_obj,
    email: Optional[str] = None,
    name: Optional[str] = None,
    age: Optional[int] = None,
    nationality: Optional[str] = None,
    goal: Optional[str] = None,
    upload_id: Optional[str] = None,
    progress_callback: Optional[Callable[[str, int, str, str, Optional[str]], None]] = None,
    zip_path: Optional[str] = None,
    is_mobile: bool = False,
) -> Upload:
    """
    Main ingestion orchestrator.
    """
    logger.info(f"Starting ingestion for user {user_id}")
    upload_id = upload_id or str(uuid.uuid4())
    
    # Step 1: Ensure user exists
    ensure_user(db, user_id, email, name, age, nationality, goal)
    
    # Step 2: Clear existing data to ensure fresh start with new upload
    # This ensures that new ZIP files replace old data completely
    if progress_callback:
        progress_callback(upload_id, 2, "Clearing existing data...", "processing", "clearing")
    deleted_metrics, deleted_workouts, deleted_insights = clear_existing_data(db, user_id)
    logger.info(f"Cleared {deleted_metrics} metrics, {deleted_workouts} workouts, and {deleted_insights} insights before new ingestion")
    
    # Step 3: Save ZIP file (unless provided)
    zip_path = zip_path or save_upload_file(user_id=user_id, upload_id=upload_id, file_obj=file_obj)

    # Step 4: Create Upload record
    upload = Upload(
        id=upload_id,
        user_id=user_id,
        file_path=zip_path,
        status=UploadStatus.PROCESSING,
        data_source="zip",
        created_at=datetime.utcnow(),
    )
    db.add(upload)
    db.commit()
    logger.info(f"Created upload record: {upload_id}")
    if progress_callback:
        progress_callback(upload_id, 5, "Upload received", "processing", "received")
    
    try:
        logger.info("Ingestion started", extra={"user_id": user_id, "upload_id": upload_id})
        if progress_callback:
            progress_callback(upload_id, 15, "Unpacking WHOOP export...", "processing", "unzip")
        extracted = unzip_whoop_export(zip_path)
        csv_map = discover_whoop_csvs(extracted)
        
        # Validate that we found at least some CSV files
        total_csvs = sum(len(paths) for paths in csv_map.values())
        if total_csvs == 0:
            raise ValueError(
                "No CSV files found in the ZIP archive. "
                "Please ensure you're uploading a valid WHOOP export ZIP file. "
                "The ZIP should contain CSV files like sleep.csv, recovery.csv, strain.csv, or physiological_cycles.csv"
            )
        
        logger.info(f"Found CSV files: {dict((k, len(v)) for k, v in csv_map.items())}")
        
        if progress_callback:
            progress_callback(upload_id, 92, "Parsing CSV files... (92%)", "processing", "parsing")

        # Check for physiological_cycles.csv (consolidated format)
        try:
            journal_df = parse_journal(csv_map["journal"])
        except Exception as e:
            logger.warning(f"Error parsing journal CSV: {e}")
            journal_df = pd.DataFrame(columns=["date", "extra"])
        
        if csv_map["physiological_cycles"]:
            logger.info("Found physiological_cycles.csv, using consolidated parsing")
            try:
                metrics_df = parse_physiological_cycles(csv_map["physiological_cycles"])
                
                if metrics_df.empty:
                    raise ValueError(
                        "physiological_cycles.csv was found but could not be parsed. "
                        "Please check that the file format is correct."
                    )
                
                # Merge journal_df if it exists
                if not journal_df.empty and "date" in journal_df.columns and "date" in metrics_df.columns:
                    try:
                        # If metrics_df already has 'extra', merge will create extra_x, extra_y
                        metrics_df = metrics_df.merge(journal_df, on="date", how="outer")
                        
                        # Combine extras logic (duplicated from _merge_daily_metrics but necessary here)
                        extra_cols = [c for c in metrics_df.columns if "extra" in c]
                        if extra_cols:
                            def _combine_extras(row):
                                combined = {}
                                for col in extra_cols:
                                    val = row[col]
                                    if isinstance(val, dict):
                                        combined.update(val)
                                return combined if combined else None
                                
                            metrics_df["extra"] = metrics_df.apply(_combine_extras, axis=1)
                            for col in extra_cols:
                                if col != "extra":
                                    metrics_df = metrics_df.drop(columns=[col])
                    except Exception as e:
                        logger.warning(f"Error merging journal data: {e}")
                        # Continue without journal data
            except Exception as e:
                logger.error(f"Error parsing physiological_cycles.csv: {e}", exc_info=True)
                raise ValueError(
                    f"Failed to parse physiological_cycles.csv: {str(e)}. "
                    "Please ensure the file is a valid WHOOP export CSV."
                )
                            
        else:
            logger.info("Using legacy separate CSV parsing")
            try:
                sleep_df = parse_sleep(csv_map["sleep"])
                recovery_df = parse_recovery(csv_map["recovery"])
                strain_df = parse_strain(csv_map["strain"])
                metrics_df = _merge_daily_metrics(sleep_df, recovery_df, strain_df, journal_df)
                
                if metrics_df.empty:
                    raise ValueError(
                        "No valid data found in CSV files. "
                        "Please check that your WHOOP export contains sleep.csv, recovery.csv, and/or strain.csv files with valid data."
                    )
            except Exception as e:
                logger.error(f"Error parsing legacy CSV files: {e}", exc_info=True)
                if isinstance(e, ValueError):
                    raise
                raise ValueError(
                    f"Failed to parse CSV files: {str(e)}. "
                    "Please ensure your WHOOP export contains valid CSV files."
                )

        try:
            workouts = parse_workouts(csv_map["workouts"])
        except Exception as e:
            logger.warning(f"Error parsing workouts CSV: {e}")
            workouts = []

        # Validate that we have some data to insert
        if metrics_df.empty:
            raise ValueError(
                "No valid data found after parsing CSV files. "
                "Please check that your WHOOP export contains valid data in sleep.csv, recovery.csv, strain.csv, or physiological_cycles.csv"
            )
        
        logger.info(f"Parsed {len(metrics_df)} daily metrics rows and {len(workouts)} workouts")

        upsert_count = upsert_daily_metrics(db, user_id, metrics_df)
        created_workouts, skipped_workouts = persist_workouts(db, user_id, workouts)

        # Ensure aggregated counts and features are refreshed
        # Compute features (optional - requires ML dependencies)
        recompute_features_fn = _get_ml_features()
        if recompute_features_fn:
            if progress_callback:
                progress_callback(upload_id, 94, "Computing features... (94%)", "processing", "features")
            recompute_features_fn(db, user_id)
        else:
            logger.warning("ML features not available, skipping feature recomputation")

        # Train per-user models on newly ingested data (optional - requires ML dependencies)
        train_models_fn = _get_ml_trainer()
        training_summary = None
        if train_models_fn:
            if progress_callback:
                progress_callback(upload_id, 96, "Training models... (96%)", "processing", "training")
            logger.info(f"Starting model training for user {user_id} (mobile: {is_mobile})")
            try:
                training_summary = train_models_fn(db, user_id, is_mobile=is_mobile)
                if training_summary:
                    trained_models = training_summary.get('trained_models', [])
                    status = training_summary.get('status', 'unknown')
                    logger.info(f"Model training completed with status '{status}'. Trained models: {trained_models}")
                    if status == "not_enough_data":
                        days = training_summary.get('days_used', 0)
                        logger.warning(f"Training skipped: Need at least 10 days of data, but only have {days} days")
                    elif status == "skipped_no_ml_libs":
                        logger.error("Training skipped: ML libraries (joblib/scikit-learn) not available!")
                    if 'calorie_gps' in trained_models:
                        logger.info("✅ Calorie GPS model trained successfully!")
                    elif trained_models:
                        logger.info("⚠️ Calorie GPS model not trained (may need more workout data with calories and duration)")
                else:
                    logger.warning("Model training returned None (no summary)")
            except Exception as e:
                logger.error(f"Error during model training: {e}", exc_info=True)
        else:
            logger.error("ML training function not available - _get_ml_trainer() returned None. Check if joblib/scikit-learn are installed.")

        upload.status = UploadStatus.COMPLETED
        upload.completed_at = datetime.utcnow()
        db.commit()
        logger.info(
            "Ingestion completed",
            extra={
                "user_id": user_id,
                "upload_id": upload_id,
                "daily_rows": upsert_count,
                "workouts_created": created_workouts,
                "workouts_skipped": skipped_workouts,
                "training_status": training_summary.get("status") if training_summary else "skipped",
            },
        )
        if progress_callback:
            progress_callback(upload_id, 100, "Upload complete", "completed", "completed")
        return upload

    except Exception as exc:  # noqa: BLE001
        db.rollback()
        upload.status = UploadStatus.FAILED
        upload.error_message = str(exc)
        db.commit()
        if progress_callback:
            progress_callback(upload_id, 100, f"Upload failed: {exc}", "failed", "failed")
        logger.exception("Ingestion failed", extra={"user_id": user_id, "upload_id": upload_id})
        raise
