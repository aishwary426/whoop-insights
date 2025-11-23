"""
Admin authentication utilities.
Checks if a user has admin privileges based on their email.
"""
from fastapi import HTTPException, status, Header, Depends
from typing import Optional
import logging

from app.core_config import get_settings

logger = logging.getLogger(__name__)


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


def is_admin_email(email: str) -> bool:
    """Check if an email is in the admin list."""
    settings = get_settings()
    admin_emails = settings.admin_emails if hasattr(settings, 'admin_emails') else ["ctaishwary@gmail.com"]
    return email.lower() in [admin.lower() for admin in admin_emails]


async def require_admin(
    authorization: Optional[str] = Header(None, alias="Authorization")
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
    
    if not is_admin_email(email):
        logger.warning(f"Admin check failed: {email} is not an admin")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. User {email} does not have admin privileges."
        )
    
    logger.info(f"Admin access granted for: {email}")
    return email


