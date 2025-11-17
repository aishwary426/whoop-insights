"""
Upload endpoint for WHOOP ZIP files.
"""
import logging
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db_session import get_db
from app.services.ingestion.whoop_ingestion import ingest_whoop_zip
from app.schemas.api import UploadResponse, UploadStatus
from app.ml.feature_engineering.daily_features import recompute_daily_features

logger = logging.getLogger(__name__)
router = APIRouter(tags=["upload"])


@router.post("/whoop/upload", response_model=UploadResponse)
def upload_whoop_data(
    user_id: str = Query(..., description="User identifier"),
    file: UploadFile = File(..., description="WHOOP export ZIP file"),
    db: Session = Depends(get_db)
):
    """
    Upload and process WHOOP export ZIP file.
    
    - Validates file format
    - Extracts and parses CSVs
    - Populates database with daily metrics and workouts
    - Triggers feature engineering
    
    Returns:
        UploadResponse with upload_id, status, and message
    """
    logger.info(f"Upload request from user {user_id}, filename: {file.filename}")
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(
            status_code=400,
            detail="Only ZIP files are supported. Please upload a WHOOP export ZIP file."
        )
    
    try:
        # Process upload
        upload = ingest_whoop_zip(
            db=db,
            user_id=user_id,
            file_obj=file.file,
        )
        
        # Trigger feature engineering
        try:
            recompute_daily_features(db, user_id)
            logger.info(f"Feature engineering completed for user {user_id}")
        except Exception as e:
            logger.warning(f"Feature engineering failed (non-fatal): {e}")
        
        return UploadResponse(
            upload_id=upload.id,
            status=UploadStatus(upload.status.value),
            message=f"Upload processed successfully. Status: {upload.status.value}"
        )
        
    except ValueError as e:
        logger.error(f"Validation error during upload: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Upload processing failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process upload: {str(e)}"
        )
