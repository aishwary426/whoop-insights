"""
Admin endpoints for managing users and viewing their data.
"""
import logging
import os
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db_session import get_db
from app.models.database import User, DailyMetrics, Upload, Workout, Insight, DailyPrediction
from app.core_config import get_settings
from app.utils.admin_auth import require_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])
settings = get_settings()


@router.get("/users")
async def get_all_users(
    admin_email: str = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Get all users with their data, uploads, and zip file information.
    Admin only.
    """
    try:
        # Get all users
        users = db.query(User).all()
        
        # Get upload directory
        upload_dir = Path(settings.upload_dir)
        
        users_data = []
        for user in users:
            # Get user's uploads from database
            uploads = db.query(Upload).filter(Upload.user_id == user.id).all()
            
            # Get zip files from filesystem
            user_dir = upload_dir / user.id
            zip_files = []
            if user_dir.exists():
                zip_files = [
                    {
                        "upload_id": f.stem,
                        "filename": f.name,
                        "size_bytes": f.stat().st_size,
                        "size_mb": round(f.stat().st_size / (1024 * 1024), 2),
                        "created_at": f.stat().st_ctime,
                    }
                    for f in user_dir.glob("*.zip")
                ]
            
            # Get metrics count
            metrics_count = db.query(DailyMetrics).filter(DailyMetrics.user_id == user.id).count()
            
            # Get latest metrics date
            latest_metric = db.query(DailyMetrics).filter(
                DailyMetrics.user_id == user.id
            ).order_by(DailyMetrics.date.desc()).first()
            
            users_data.append({
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "age": user.age,
                "nationality": user.nationality,
                "goal": user.goal,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "uploads_count": len(uploads),
                "zip_files": zip_files,
                "zip_files_count": len(zip_files),
                "metrics_count": metrics_count,
                "latest_metric_date": latest_metric.date.isoformat() if latest_metric else None,
            })
        
        # Sort by created_at (newest first)
        users_data.sort(key=lambda x: x["created_at"] or "", reverse=True)
        
        return JSONResponse(content={
            "users": users_data,
            "total": len(users_data),
        })
    
    except Exception as e:
        logger.exception(f"Error getting all users: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get users: {str(e)}")


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin_email: str = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Delete a user and all their associated data.
    This will delete:
    - User record from database (cascade deletes related records)
    - User's ZIP files from filesystem
    - User's model files (if any)
    Admin only.
    """
    try:
        # Get user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail=f"User {user_id} not found")
        
        logger.info(f"Admin {admin_email} deleting user {user_id} ({user.email})")
        
        # Delete user's ZIP files from filesystem
        upload_dir = Path(settings.upload_dir)
        user_dir = upload_dir / user_id
        if user_dir.exists():
            try:
                shutil.rmtree(user_dir)
                logger.info(f"Deleted user directory: {user_dir}")
            except Exception as e:
                logger.warning(f"Failed to delete user directory {user_dir}: {e}")
        
        # Delete user's model files
        model_dir = Path(settings.model_dir) / user_id
        if model_dir.exists():
            try:
                shutil.rmtree(model_dir)
                logger.info(f"Deleted user model directory: {model_dir}")
            except Exception as e:
                logger.warning(f"Failed to delete user model directory {model_dir}: {e}")
        
        # Delete user's processed data directory
        processed_dir = Path(settings.processed_dir) / user_id
        if processed_dir.exists():
            try:
                shutil.rmtree(processed_dir)
                logger.info(f"Deleted user processed directory: {processed_dir}")
            except Exception as e:
                logger.warning(f"Failed to delete user processed directory {processed_dir}: {e}")
        
        # Delete user from database (cascade will handle related records)
        # But let's also explicitly delete related records to be safe
        db.query(Insight).filter(Insight.user_id == user_id).delete()
        db.query(DailyPrediction).filter(DailyPrediction.user_id == user_id).delete()
        db.query(Workout).filter(Workout.user_id == user_id).delete()
        db.query(DailyMetrics).filter(DailyMetrics.user_id == user_id).delete()
        db.query(Upload).filter(Upload.user_id == user_id).delete()
        
        # Finally delete the user
        db.delete(user)
        db.commit()
        
        logger.info(f"Successfully deleted user {user_id} and all associated data")
        
        return JSONResponse(content={
            "success": True,
            "message": f"User {user_id} ({user.email}) deleted successfully",
            "deleted_user_id": user_id,
        })
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error deleting user {user_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")

