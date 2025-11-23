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
def upload_whoop_data(
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
        logger.info(f"[{upload_id}] File: {file.filename}, Content-Type: {file.content_type}")
        
        # Check if we're on Render (which has 30s timeout on free tier)
        is_render = bool(os.getenv("RENDER") or os.getenv("RENDER_SERVICE_NAME"))
        if is_render:
            logger.warning(f"[{upload_id}] Running on Render - note: free tier has 30s request timeout limit")
        
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        if not file.filename.lower().endswith(".zip"):
            raise HTTPException(status_code=400, detail="Only ZIP files are supported")
        
        # Check file size (Vercel limit is 4.5MB, but Render allows larger)
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
            error_detail = f"Failed to save uploaded file: {str(exc)}"
            logger.error(f"[{upload_id}] Save error detail: {error_detail}")
            raise HTTPException(status_code=500, detail=error_detail)
        
        # Run ingestion synchronously
        db = SessionLocal()
        try:
            # Test database connection first
            try:
                from sqlalchemy import text
                db.execute(text("SELECT 1"))
                db.commit()
                logger.info(f"[{upload_id}] Database connection verified")
            except Exception as db_test_error:
                logger.error(f"[{upload_id}] Database connection test failed: {db_test_error}")
                db.rollback()
                raise HTTPException(status_code=500, detail=f"Database connection failed: {str(db_test_error)}")
            
            logger.info(f"[{upload_id}] Starting synchronous ingestion with zip_path: {zip_path}")
            logger.info(f"[{upload_id}] Zip file exists: {os.path.exists(zip_path) if zip_path else 'N/A'}")
            
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
            db.commit()  # Explicitly commit instead of just flush
            logger.info(f"[{upload_id}] Ingestion completed successfully, data committed to database")
            
            return UploadResponse(
                upload_id=upload_id,
                status=UploadStatus.COMPLETED,
                message="Upload and ingestion completed successfully.",
            )
        except Exception as exc:
            logger.exception(f"Ingestion failed for {upload_id}: {exc}")
            error_msg = str(exc)
            # Provide more helpful error messages
            if "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
                error_msg = "Processing timed out. This may happen on Render's free tier (30s limit). Consider upgrading or reducing file size."
            elif "database" in error_msg.lower() or "connection" in error_msg.lower():
                error_msg = f"Database error: {error_msg}. Please check your database configuration."
            elif "no csv files found" in error_msg.lower() or "no valid data found" in error_msg.lower():
                error_msg = f"Invalid WHOOP export: {error_msg}. Please ensure you're uploading a valid WHOOP export ZIP file."
            elif "failed to parse" in error_msg.lower() or "failed to read" in error_msg.lower():
                error_msg = f"CSV parsing error: {error_msg}. Please check that your WHOOP export files are not corrupted."
            elif "invalid zip" in error_msg.lower() or "badzipfile" in error_msg.lower():
                error_msg = "Invalid ZIP file format. Please ensure you're uploading a valid WHOOP export ZIP file."
            raise HTTPException(status_code=500, detail=f"Ingestion failed: {error_msg}")
        finally:
            db.close()
            
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"Unexpected error in upload endpoint {upload_id}: {exc}")
        error_msg = str(exc)
        error_type = type(exc).__name__
        
        # Check for common issues
        if "timeout" in error_msg.lower():
            error_msg = "Request timed out. On Render's free tier, requests must complete within 30 seconds. Consider upgrading or processing smaller files."
        elif "permission" in error_msg.lower() or "permission denied" in error_msg.lower():
            error_msg = f"File system permission error: {error_msg}. Please check that /tmp directory is writable."
        elif "database" in error_msg.lower() or "sql" in error_msg.lower():
            error_msg = f"Database error: {error_msg}. Please check your database connection."
        elif "no such file" in error_msg.lower() or "file not found" in error_msg.lower():
            error_msg = f"File not found error: {error_msg}. The uploaded file may have been lost."
        elif "no csv files found" in error_msg.lower() or "no valid data found" in error_msg.lower():
            error_msg = f"Invalid WHOOP export: {error_msg}. Please ensure you're uploading a valid WHOOP export ZIP file."
        elif "failed to parse" in error_msg.lower() or "failed to read" in error_msg.lower():
            error_msg = f"CSV parsing error: {error_msg}. Please check that your WHOOP export files are not corrupted."
        elif "invalid zip" in error_msg.lower() or "badzipfile" in error_msg.lower():
            error_msg = "Invalid ZIP file format. Please ensure you're uploading a valid WHOOP export ZIP file."
        else:
            # Include the actual error type and message for debugging
            error_msg = f"Unexpected error ({error_type}): {error_msg}"
        
        logger.error(f"[{upload_id}] Final error message: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)
    finally:
        # Cleanup zip file
        if zip_path and os.path.exists(zip_path):
            try:
                os.remove(zip_path)
                logger.info(f"[{upload_id}] Cleaned up temporary file: {zip_path}")
            except Exception as e:
                logger.warning(f"[{upload_id}] Failed to clean up {zip_path}: {e}")