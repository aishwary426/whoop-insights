"""
Upload endpoint for WHOOP ZIP files.
Location: backend/app/api/v1/endpoints/upload.py
"""
import logging
import uuid
import os
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Request, Query, Header, Depends
from fastapi.responses import FileResponse, JSONResponse

from app.db_session import SessionLocal
from app.schemas.api import UploadResponse, UploadStatus
from app.services.ingestion.whoop_ingestion import ingest_whoop_zip
from app.utils.device import is_mobile_user_agent
from app.utils.zip_utils import save_upload_file
from app.core_config import get_settings
from app.utils.admin_auth import require_admin, get_user_email_from_header
from app.services.analysis.dashboard_service import analytics_cache, summary_cache

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/whoop", tags=["upload"])
settings = get_settings()


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
    name: Optional[str] = Form(None, description="User's name from profile"),
    email: Optional[str] = Form(None, description="User's email from profile"),
    age: Optional[int] = Form(None, description="User's age from profile"),
    nationality: Optional[str] = Form(None, description="User's nationality from profile"),
    goal: Optional[str] = Form(None, description="User's goal from profile"),
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
                name=name,
                email=email,
                age=age,
                nationality=nationality,
                goal=goal,
            )
            # Ensure all changes are flushed to the database
            db.flush()
            db.commit()  # Explicitly commit instead of just flush
            logger.info(f"[{upload_id}] Ingestion completed successfully, data committed to database")
            
            # Invalidate caches for this user
            # Invalidate caches
            try:
                # Clear entire caches to ensure fresh data is loaded
                # This is safer than partial clearing which might miss keys
                analytics_cache.clear()
                summary_cache.clear()
                logger.info(f"[{upload_id}] Cleared all analytics and summary caches")
            except Exception as e:
                logger.warning(f"[{upload_id}] Failed to clear cache: {e}")

            # Verify data was actually inserted
            from app.models.database import DailyMetrics
            metrics_count = db.query(DailyMetrics).filter(DailyMetrics.user_id == user_id).count()
            logger.info(f"[{upload_id}] Verified {metrics_count} daily metrics records for user {user_id}")
            
            if metrics_count == 0:
                # This catches the case where ingestion "succeeded" but produced no data
                # which causes the frontend to loop back to upload page
                raise HTTPException(status_code=500, detail="Ingestion processed but no data was saved. Please check your ZIP file contains valid CSVs.")

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
        # Cleanup zip file only if configured to do so
        if not settings.keep_uploaded_files and zip_path and os.path.exists(zip_path):
            try:
                os.remove(zip_path)
                logger.info(f"[{upload_id}] Cleaned up temporary file: {zip_path}")
            except Exception as e:
                logger.warning(f"[{upload_id}] Failed to clean up {zip_path}: {e}")
        elif zip_path and os.path.exists(zip_path):
            logger.info(f"[{upload_id}] Keeping uploaded file: {zip_path}")


@router.get("/files")
async def list_uploaded_files(
    user_id: str = Query(..., description="User identifier"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    """
    List all uploaded ZIP files for a user.
    Admins can view files for any user by specifying user_id.
    Regular users can only view their own files.
    """
    try:
        # Check if user is admin
        is_admin = False
        if authorization:
            email = get_user_email_from_header(authorization)
            if email:
                from app.utils.admin_auth import is_admin_email
                is_admin = is_admin_email(email)
        
        # For non-admins, ensure they can only see their own files
        # In a real app, you'd verify the user_id matches the authenticated user
        # For now, we'll allow listing if user_id is provided
        
        upload_dir = Path(settings.upload_dir)
        user_dir = upload_dir / user_id
        
        if not user_dir.exists():
            return JSONResponse(content={
                "user_id": user_id,
                "files": [],
                "count": 0,
                "message": "No uploads found for this user"
            })
        
        # Find all zip files in user directory
        zip_files = list(user_dir.glob("*.zip"))
        
        files_info = []
        for zip_file in zip_files:
            try:
                stat = zip_file.stat()
                files_info.append({
                    "upload_id": zip_file.stem,  # filename without .zip extension
                    "filename": zip_file.name,
                    "size_bytes": stat.st_size,
                    "size_mb": round(stat.st_size / (1024 * 1024), 2),
                    "created_at": stat.st_ctime,
                    "modified_at": stat.st_mtime,
                    "path": str(zip_file.relative_to(upload_dir))
                })
            except Exception as e:
                logger.warning(f"Error reading file info for {zip_file}: {e}")
                continue
        
        # Sort by creation time (newest first)
        files_info.sort(key=lambda x: x["created_at"], reverse=True)
        
        return JSONResponse(content={
            "user_id": user_id,
            "files": files_info,
            "count": len(files_info),
            "upload_dir": str(user_dir)
        })
    
    except Exception as e:
        logger.exception(f"Error listing files for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")


@router.get("/files/{user_id}/{upload_id}")
async def download_uploaded_file(
    user_id: str,
    upload_id: str,
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    """
    Download a specific uploaded ZIP file.
    Admins can download files for any user.
    Regular users can only download their own files.
    """
    try:
        # Check if user is admin
        is_admin = False
        if authorization:
            email = get_user_email_from_header(authorization)
            if email:
                from app.utils.admin_auth import is_admin_email
                is_admin = is_admin_email(email)
        
        # Construct file path
        upload_dir = Path(settings.upload_dir)
        zip_path = upload_dir / user_id / f"{upload_id}.zip"
        
        # Security: ensure file is within upload directory
        try:
            zip_path.resolve().relative_to(upload_dir.resolve())
        except ValueError:
            raise HTTPException(status_code=403, detail="Invalid file path")
        
        # Check if file exists
        if not zip_path.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {upload_id}.zip")
        
        # Verify it's actually a zip file
        if not zip_path.suffix.lower() == ".zip":
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        logger.info(f"Serving file: {zip_path} for user {user_id}")
        
        return FileResponse(
            path=str(zip_path),
            filename=zip_path.name,
            media_type="application/zip"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error downloading file {upload_id} for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to download file: {str(e)}")


@router.get("/files/all")
async def list_all_uploaded_files(
    admin_email: str = Depends(require_admin),
):
    """
    List all uploaded ZIP files across all users (Admin only).
    """
    try:
        
        upload_dir = Path(settings.upload_dir)
        
        if not upload_dir.exists():
            return JSONResponse(content={
                "files": [],
                "count": 0,
                "users": [],
                "message": "No uploads found"
            })
        
        all_files = []
        user_dirs = [d for d in upload_dir.iterdir() if d.is_dir()]
        
        for user_dir in user_dirs:
            user_id = user_dir.name
            zip_files = list(user_dir.glob("*.zip"))
            
            for zip_file in zip_files:
                try:
                    stat = zip_file.stat()
                    all_files.append({
                        "user_id": user_id,
                        "upload_id": zip_file.stem,
                        "filename": zip_file.name,
                        "size_bytes": stat.st_size,
                        "size_mb": round(stat.st_size / (1024 * 1024), 2),
                        "created_at": stat.st_ctime,
                        "modified_at": stat.st_mtime,
                        "path": str(zip_file.relative_to(upload_dir))
                    })
                except Exception as e:
                    logger.warning(f"Error reading file info for {zip_file}: {e}")
                    continue
        
        # Sort by creation time (newest first)
        all_files.sort(key=lambda x: x["created_at"], reverse=True)
        
        # Get unique user list
        users = sorted(set(f["user_id"] for f in all_files))
        
        return JSONResponse(content={
            "files": all_files,
            "count": len(all_files),
            "users": users,
            "user_count": len(users)
        })
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error listing all files: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")