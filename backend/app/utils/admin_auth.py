"""
Admin authentication utilities.
Checks if a user has admin privileges based on their email.
"""
from fastapi import HTTPException, status, Header, Depends
from typing import Optional
import logging
from functools import lru_cache
from datetime import datetime, timedelta

from app.core_config import get_settings

logger = logging.getLogger(__name__)

# Cache admin emails for 5 minutes to reduce database queries
_admin_cache = {"emails": [], "expires_at": None}
_cache_duration = timedelta(minutes=5)


def get_user_email_from_header(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """
    Extract user email from Authorization header.
    Expected format: "Bearer email:user@example.com" or just the email
    """
    if not authorization:
        return None
    
    # Remove "Bearer " prefix if present
    token = authorization.replace("Bearer ", "").strip()
    
    # Support format: "email:user@example.com"
    if token.startswith("email:"):
        return token.replace("email:", "").strip()
    
    # Support direct email format
    if "@" in token:
        return token.strip()
    
    return None


def _get_admin_emails_from_db(db_session=None) -> list:
    """Get admin emails from database. Returns cached list if available."""
    global _admin_cache
    
    # Check cache
    if _admin_cache["expires_at"] and datetime.utcnow() < _admin_cache["expires_at"]:
        return _admin_cache["emails"]
    
    # If no db session provided, return empty list (will fall back to env/config)
    if db_session is None:
        return []
    
    try:
        from app.models.database import AdminEmail
        admin_records = db_session.query(AdminEmail).all()
        emails = [record.email.lower() for record in admin_records]
        
        # Update cache
        _admin_cache["emails"] = emails
        _admin_cache["expires_at"] = datetime.utcnow() + _cache_duration
        
        return emails
    except Exception as e:
        logger.warning(f"Failed to get admin emails from database: {e}")
        return []


def is_admin_email(email: str, db_session=None) -> bool:
    """Check if an email is in the admin list. Checks both database and environment variable."""
    email_lower = email.lower()
    
    # Always allow ctaishwary@gmail.com (super admin)
    if email_lower == "ctaishwary@gmail.com":
        return True
    
    # Check database first (if db_session provided)
    db_admin_emails = _get_admin_emails_from_db(db_session)
    if email_lower in db_admin_emails:
        return True
    
    # Fall back to environment variable/config
    settings = get_settings()
    config_admin_emails = settings.admin_emails if hasattr(settings, 'admin_emails') else ["ctaishwary@gmail.com"]
    return email_lower in [admin.lower() for admin in config_admin_emails]


def invalidate_admin_cache():
    """Invalidate the admin email cache. Call this after adding/removing admins."""
    global _admin_cache
    _admin_cache["emails"] = []
    _admin_cache["expires_at"] = None


async def require_admin(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: "Session" = None  # Will be injected via Depends in routes
) -> str:
    """
    FastAPI dependency that requires admin privileges.
    Raises 403 if user is not an admin.
    """
    email = get_user_email_from_header(authorization)
    
    if not email:
        logger.warning("Admin check failed: No authorization header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization required. Please provide your email in the Authorization header."
        )
    
    # Check admin status (will use db if available)
    if not is_admin_email(email, db):
        logger.warning(f"Admin check failed: {email} is not an admin")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. User {email} does not have admin privileges."
        )
    
    logger.info(f"Admin access granted for: {email}")
    return email


def require_super_admin(email: str) -> bool:
    """Check if email is the super admin (ctaishwary@gmail.com). Only super admin can manage other admins."""
    return email.lower() == "ctaishwary@gmail.com"




