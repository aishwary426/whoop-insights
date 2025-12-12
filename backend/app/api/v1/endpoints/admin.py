"""
Admin endpoints for managing admin emails.
"""
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Header, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.db_session import get_db
from app.models.database import AdminEmail
from app.core_config import get_settings
from app.utils.admin_auth import require_super_admin, invalidate_admin_cache

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])
settings = get_settings()


def _get_admin_email_with_db(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
) -> str:
    """Helper to get admin email with database session."""
    from app.utils.admin_auth import get_user_email_from_header, is_admin_email
    email = get_user_email_from_header(authorization)
    if not email:
        raise HTTPException(status_code=401, detail="Authorization required")
    if not is_admin_email(email, db):
        raise HTTPException(status_code=403, detail="Access denied")
    return email


@router.get("/admins")
async def get_admin_emails(
    admin_email: str = Depends(_get_admin_email_with_db),
    db: Session = Depends(get_db),
):
    """
    Get list of all admin emails.
    Only accessible by super admin (ctaishwary@gmail.com).
    """
    try:
        # Check if user is super admin
        if not require_super_admin(admin_email):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only super admin can view admin emails"
            )
        
        # Get admin emails from database
        admin_records = db.query(AdminEmail).order_by(AdminEmail.added_at.desc()).all()
        
        # Also include emails from config/env
        settings = get_settings()
        config_admins = settings.admin_emails if hasattr(settings, 'admin_emails') else []
        
        # Combine and deduplicate
        all_admins = []
        seen = set()
        
        # Add super admin first
        all_admins.append({
            "email": "ctaishwary@gmail.com",
            "added_by": "system",
            "added_at": None,
            "is_super_admin": True,
            "source": "system"
        })
        seen.add("ctaishwary@gmail.com")
        
        # Add config admins
        for email in config_admins:
            email_lower = email.lower()
            if email_lower not in seen:
                all_admins.append({
                    "email": email_lower,
                    "added_by": "config",
                    "added_at": None,
                    "is_super_admin": False,
                    "source": "config"
                })
                seen.add(email_lower)
        
        # Add database admins
        for record in admin_records:
            email_lower = record.email.lower()
            if email_lower not in seen:
                all_admins.append({
                    "email": email_lower,
                    "added_by": record.added_by,
                    "added_at": record.added_at.isoformat() if record.added_at else None,
                    "is_super_admin": False,
                    "source": "database"
                })
                seen.add(email_lower)
        
        return JSONResponse(content={
            "admins": all_admins,
            "total": len(all_admins)
        })
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting admin emails: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get admin emails: {str(e)}")


@router.post("/admins")
async def add_admin_email(
    email: str,
    admin_email: str = Depends(_get_admin_email_with_db),
    db: Session = Depends(get_db),
):
    """
    Add an email to the admin list.
    Only accessible by super admin (ctaishwary@gmail.com).
    """
    try:
        # Check if user is super admin
        if not require_super_admin(admin_email):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only super admin can add admin emails"
            )
        
        email = email.strip().lower()
        
        # Validate email
        if not email or "@" not in email:
            raise HTTPException(status_code=400, detail="Invalid email address")
        
        # Don't allow adding super admin
        if email == "ctaishwary@gmail.com":
            raise HTTPException(status_code=400, detail="Cannot modify super admin")
        
        # Check if already exists in database
        existing = db.query(AdminEmail).filter(AdminEmail.email == email).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Email {email} is already an admin")
        
        # Add to database
        admin_record = AdminEmail(
            email=email,
            added_by=admin_email
        )
        db.add(admin_record)
        db.commit()
        
        # Invalidate cache
        invalidate_admin_cache()
        
        logger.info(f"Super admin {admin_email} added {email} as admin")
        
        return JSONResponse(content={
            "success": True,
            "message": f"Added {email} as admin",
            "email": email
        })
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error adding admin email: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add admin email: {str(e)}")


@router.delete("/admins/{email}")
async def remove_admin_email(
    email: str,
    admin_email: str = Depends(_get_admin_email_with_db),
    db: Session = Depends(get_db),
):
    """
    Remove an email from the admin list.
    Only accessible by super admin (ctaishwary@gmail.com).
    """
    try:
        # Check if user is super admin
        if not require_super_admin(admin_email):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only super admin can remove admin emails"
            )
        
        email = email.strip().lower()
        
        # Don't allow removing super admin
        if email == "ctaishwary@gmail.com":
            raise HTTPException(status_code=400, detail="Cannot remove super admin")
        
        # Find and delete from database
        admin_record = db.query(AdminEmail).filter(AdminEmail.email == email).first()
        if not admin_record:
            raise HTTPException(status_code=404, detail=f"Email {email} is not in the admin list")
        
        db.delete(admin_record)
        db.commit()
        
        # Invalidate cache
        invalidate_admin_cache()
        
        logger.info(f"Super admin {admin_email} removed {email} from admins")
        
        return JSONResponse(content={
            "success": True,
            "message": f"Removed {email} from admins",
            "email": email
        })
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error removing admin email: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to remove admin email: {str(e)}")

