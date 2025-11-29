"""
Image upload endpoint for blog posts.
"""
import logging
import uuid
import os
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import Optional

from app.core_config import get_settings
from app.utils.admin_auth import require_admin

logger = logging.getLogger(__name__)
router = APIRouter()


ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/images/upload")
async def upload_blog_image(
    file: UploadFile = File(...),
    admin_email: str = Depends(require_admin)
):
    """
    Upload an image for blog posts. Admin only.
    Returns the URL/path to the uploaded image.
    """
    try:
        settings = get_settings()
        
        # Validate file type
        file_ext = Path(file.filename or "").suffix.lower()
        if file_ext not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
            )
        
        # Read file content
        content = await file.read()
        
        # Check file size
        if len(content) > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size is {MAX_IMAGE_SIZE / 1024 / 1024}MB"
            )
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = f"{file_id}{file_ext}"
        
        # Save file
        images_dir = Path(settings.images_dir)
        images_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = images_dir / filename
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Generate URL/path
        # For local dev, return relative path that can be served
        # For production, you might want to upload to S3/Cloudinary/etc.
        image_url = f"/api/v1/images/{filename}"
        
        logger.info(f"Image uploaded: {filename} by admin {admin_email}")
        
        return JSONResponse(content={
            "success": True,
            "image_url": image_url,
            "filename": filename,
            "message": "Image uploaded successfully"
        })
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading image: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload image: {str(e)}"
        )


@router.get("/images/{filename}")
async def get_image(filename: str):
    """
    Serve uploaded images.
    """
    from fastapi.responses import FileResponse
    
    try:
        settings = get_settings()
        images_dir = Path(settings.images_dir)
        file_path = images_dir / filename
        
        # Security: ensure file exists and is in images directory
        if not file_path.exists() or not file_path.is_relative_to(images_dir):
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Determine content type
        ext = file_path.suffix.lower()
        media_type_map = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp"
        }
        media_type = media_type_map.get(ext, "image/jpeg")
        
        return FileResponse(
            path=str(file_path),
            media_type=media_type
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving image: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to serve image")























