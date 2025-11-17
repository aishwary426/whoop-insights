"""
Comprehensive WHOOP data ingestion service.
Orchestrates ZIP extraction, CSV parsing, and database population.
"""
import uuid
import logging
from datetime import datetime, date
from pathlib import Path
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import pandas as pd

from app.models.database import (
    User, Upload, UploadStatus, DailyMetrics, Workout
)
from app.utils.zip_utils import (
    save_upload_file, unzip_whoop_export, discover_csv_files
)
from app.services.ingestion.csv_parsers import (
    parse_sleep_csv, parse_recovery_csv, parse_strain_csv, parse_workout_csv
)
from app.core_config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def ensure_user(db: Session, user_id: str, email: Optional[str] = None, name: Optional[str] = None) -> User:
    """Ensure user exists in database, create if not."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(
            id=user_id,
            email=email or f"{user_id}@auto.com",
            name=name or f"User {user_id}",
        )
        db.add(user)
        db.commit()
        logger.info(f"Created new user: {user_id}")
    return user


def ingest_whoop_zip(
    db: Session,
    user_id: str,
    file_obj,
    email: Optional[str] = None,
    name: Optional[str] = None
) -> Upload:
    """
    Main ingestion orchestrator.
    
    Flow:
    1. Ensure user exists
    2. Save ZIP file
    3. Create Upload record
    4. Extract ZIP
    5. Discover CSVs
    6. Parse CSVs
    7. Write to database (DailyMetrics, Workout)
    8. Update Upload status
    
    Args:
        db: Database session
        user_id: User identifier
        file_obj: File-like object (from FastAPI UploadFile)
        email: Optional user email
        name: Optional user name
    
    Returns:
        Upload record
    """
    logger.info(f"Starting ingestion for user {user_id}")
    
    # Step 1: Ensure user exists
    ensure_user(db, user_id, email, name)
    
    # Step 2: Save ZIP file
    upload_id = str(uuid.uuid4())
    zip_path = save_upload_file(user_id=user_id, upload_id=upload_id, file_obj=file_obj)

    # Step 3: Create Upload record
    upload = Upload(
        id=upload_id,
        user_id=user_id,
        file_path=zip_path,
        status=UploadStatus.PROCESSING,
        created_at=datetime.utcnow(),
    )
    db.add(upload)
    db.commit()
    logger.info(f"Created upload record: {upload_id}")
    
    try:
        # Step 4: Extract ZIP
        processed_dir = Path(settings.processed_dir) / user_id / upload_id
        processed_dir.mkdir(parents=True, exist_ok=True)
        
        extracted_dir = unzip_whoop_export(zip_path, extract_to=str(processed_dir))
        
        # Step 5: Discover CSVs
        csv_files = discover_csv_files(extracted_dir)
        
        if not csv_files:
            raise ValueError("No recognized CSV files found in ZIP")
        
        logger.info(f"Discovered CSV files: {list(csv_files.keys())}")
        
        # Step 6: Parse CSVs
        parsed_data = {}
        
        if 'sleep' in csv_files:
            try:
                parsed_data['sleep'] = parse_sleep_csv(csv_files['sleep'])
            except Exception as e:
                logger.warning(f"Failed to parse sleep CSV: {e}")
        
        if 'recovery' in csv_files:
            try:
                parsed_data['recovery'] = parse_recovery_csv(csv_files['recovery'])
            except Exception as e:
                logger.warning(f"Failed to parse recovery CSV: {e}")
        
        if 'strain' in csv_files:
            try:
                parsed_data['strain'] = parse_strain_csv(csv_files['strain'])
            except Exception as e:
                logger.warning(f"Failed to parse strain CSV: {e}")
        
        if 'workout' in csv_files:
            try:
                parsed_data['workout'] = parse_workout_csv(csv_files['workout'])
            except Exception as e:
                logger.warning(f"Failed to parse workout CSV: {e}")
        
        # Step 7: Write to database
        # Merge all daily data into DailyMetrics
        daily_data = {}
        
        # Collect data from all sources
        for source_type, df in parsed_data.items():
            if df is None or df.empty:
                continue

                    for _, row in df.iterrows():
                row_date = pd.to_datetime(row['date']).date()
                
                if row_date not in daily_data:
                    daily_data[row_date] = {
                        'date': row_date,
                        'user_id': user_id,
                    }
                
                # Merge fields
                if source_type == 'sleep' and 'sleep_hours' in row:
                    daily_data[row_date]['sleep_hours'] = row['sleep_hours']
                
                elif source_type == 'recovery':
                    if 'recovery_score' in row and pd.notna(row['recovery_score']):
                        daily_data[row_date]['recovery_score'] = row['recovery_score']
                    if 'hrv' in row and pd.notna(row['hrv']):
                        daily_data[row_date]['hrv'] = row['hrv']
                    if 'resting_hr' in row and pd.notna(row['resting_hr']):
                        daily_data[row_date]['resting_hr'] = row['resting_hr']
                
                elif source_type == 'strain' and 'strain_score' in row:
                    daily_data[row_date]['strain_score'] = row['strain_score']
        
        # Write DailyMetrics
        daily_count = 0
        for day_data in daily_data.values():
            try:
                # Use merge to handle duplicates
                existing = db.query(DailyMetrics).filter(
                    DailyMetrics.user_id == user_id,
                    DailyMetrics.date == day_data['date']
                ).first()
                
                if existing:
                    # Update existing record
                    for key, value in day_data.items():
                        if key not in ['date', 'user_id'] and value is not None:
                            setattr(existing, key, value)
                    existing.updated_at = datetime.utcnow()
                else:
                    # Create new record
                    dm = DailyMetrics(**day_data)
            db.add(dm)
                
                daily_count += 1
            except Exception as e:
                logger.warning(f"Error writing daily metric for {day_data['date']}: {e}")
                continue
        
        db.commit()
        logger.info(f"Wrote {daily_count} daily metrics records")
        
        # Write Workouts
        workout_count = 0
        if 'workout' in parsed_data and not parsed_data['workout'].empty:
            for _, row in parsed_data['workout'].iterrows():
                try:
                    workout_date = pd.to_datetime(row['date']).date()
                    
                    workout = Workout(
                        user_id=user_id,
                        workout_id=str(uuid.uuid4()),
                        date=workout_date,
                        start_time=pd.to_datetime(row.get('start_time')) if 'start_time' in row and pd.notna(row.get('start_time')) else None,
                        end_time=pd.to_datetime(row.get('end_time')) if 'end_time' in row and pd.notna(row.get('end_time')) else None,
                        duration_minutes=float(row.get('duration_minutes', 0)) if pd.notna(row.get('duration_minutes')) else None,
                        sport_type=str(row.get('sport_type', 'unknown')) if pd.notna(row.get('sport_type')) else 'unknown',
                        avg_hr=float(row.get('avg_hr')) if 'avg_hr' in row and pd.notna(row.get('avg_hr')) else None,
                        max_hr=float(row.get('max_hr')) if 'max_hr' in row and pd.notna(row.get('max_hr')) else None,
                        strain=float(row.get('strain')) if 'strain' in row and pd.notna(row.get('strain')) else None,
                        calories=float(row.get('calories')) if 'calories' in row and pd.notna(row.get('calories')) else None,
                    )
                    db.add(workout)
                    workout_count += 1
                except Exception as e:
                    logger.warning(f"Error writing workout: {e}")
                    continue
            
            db.commit()
            logger.info(f"Wrote {workout_count} workout records")
        
        # Update workout counts in DailyMetrics
        from app.ml.feature_engineering.daily_features import recompute_daily_features
        recompute_daily_features(db, user_id)
        
        # Step 8: Mark upload as completed
        upload.status = UploadStatus.COMPLETED
        upload.completed_at = datetime.utcnow()
        db.commit()

        logger.info(f"Ingestion completed successfully for upload {upload_id}")
        return upload
        
    except Exception as e:
        logger.error(f"Ingestion failed for upload {upload_id}: {e}", exc_info=True)
        upload.status = UploadStatus.FAILED
        upload.error_message = str(e)
        db.commit()
        raise
