"""
Upload endpoint for WHOOP ZIP files.
Location: backend/app/api/v1/endpoints/upload.py
"""
import logging
import uuid
import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Request

from app.db_session import SessionLocal
from app.schemas.api import UploadResponse, UploadStatus
from app.services.ingestion.whoop_ingestion import ingest_whoop_zip
from app.utils.device import is_mobile_user_agent
from app.utils.zip_utils import save_upload_file

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/whoop", tags=["upload"])


@router.get("/ingest")
async def check_upload_endpoint():
    """
    Debug endpoint to verify routing.
    """
    return {"status": "reachable", "message": "Upload endpoint is accessible via GET"}


@router.post("/ingest", response_model=UploadResponse)
async def upload_whoop_data(
    request: Request,
    user_id: str = Form(..., description="User identifier"),
    file: UploadFile = File(..., description="WHOOP export ZIP file"),
    is_mobile: bool = Form(False, description="Client hint for mobile uploads"),
):
    """
    Upload and process WHOOP export ZIP file synchronously.
    """
    logger.info(f"DEBUG: Upload endpoint called. Method: {request.method}, URL: {request.url}")
    logger.info(f"DEBUG: Headers: {dict(request.headers)}")
    
    upload_id = str(uuid.uuid4())
    zip_path = None  # Initialize before try block to avoid scope issues
    
    try:
        logger.info(f"[{upload_id}] Upload request received - user: {user_id}")
        
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        if not file.filename.lower().endswith(".zip"):
            raise HTTPException(status_code=400, detail="Only ZIP files are supported")
        
        # Check file size (Vercel limit is 4.5MB)
        MAX_FILE_SIZE = 4.5 * 1024 * 1024  # 4.5MB
        
        is_mobile_client = is_mobile or is_mobile_user_agent(request.headers.get("user-agent"))
        
        # Save file
        try:
            # Ensure file stream is at the beginning (FastAPI UploadFile.seek is sync)
            file.file.seek(0)
            zip_path = save_upload_file(
                user_id=user_id, 
                upload_id=upload_id, 
                file_obj=file.file, 
                max_size=MAX_FILE_SIZE
            )
        except ValueError as exc:
            logger.error(f"Upload {upload_id} failed: {exc}")
            raise HTTPException(status_code=413, detail=str(exc))
        except Exception as exc:
            logger.exception(f"Failed to save upload {upload_id}: {exc}")
            raise HTTPException(status_code=500, detail="Failed to save uploaded file")
        
        # Run ingestion synchronously
        db = SessionLocal()
        try:
            logger.info(f"[{upload_id}] Starting synchronous ingestion")
            ingest_whoop_zip(
                db=db,
                user_id=user_id,
                file_obj=None,
                upload_id=upload_id,
                progress_callback=None,  # No progress callback for sync
                zip_path=zip_path,
                is_mobile=is_mobile_client,
            )
            # Ensure all changes are flushed to the database
            db.flush()
            logger.info(f"[{upload_id}] Ingestion completed successfully, data flushed to database")
            
            return UploadResponse(
                upload_id=upload_id,
                status=UploadStatus.COMPLETED,
                message="Upload and ingestion completed successfully.",
            )
        except Exception as exc:
            logger.exception(f"Ingestion failed for {upload_id}")
            raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(exc)}")
        finally:
            db.close()
            
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"Unexpected error in upload endpoint {upload_id}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(exc)}")
    finally:
        # Cleanup zip file
        if zip_path and os.path.exists(zip_path):
            try:
                os.remove(zip_path)
                logger.info(f"[{upload_id}] Cleaned up temporary file: {zip_path}")
            except Exception as e:
                logger.warning(f"[{upload_id}] Failed to clean up {zip_path}: {e}")