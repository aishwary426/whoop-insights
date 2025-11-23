from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import logging
import re
from datetime import datetime

from app.db_session import get_db
from app.models.database import NewsletterSubscriber
from app.schemas.api import NewsletterSubscribe, NewsletterResponse, SubscriberList, SubscriberInfo
from app.utils.admin_auth import require_admin

logger = logging.getLogger(__name__)

router = APIRouter()


def validate_email(email: str) -> bool:
    """Simple email validation."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


@router.post("/newsletter/subscribe", response_model=NewsletterResponse)
async def subscribe_newsletter(
    subscription: NewsletterSubscribe,
    db: Session = Depends(get_db)
):
    """Subscribe an email address to the newsletter."""
    email = subscription.email.strip().lower()
    
    # Validate email format
    if not validate_email(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email address format"
        )
    
    try:
        # Check if email already exists
        existing = db.query(NewsletterSubscriber).filter(
            NewsletterSubscriber.email == email
        ).first()
        
        if existing:
            if existing.subscribed == 1:
                return NewsletterResponse(
                    success=True,
                    message="Email is already subscribed to the newsletter"
                )
            else:
                # Resubscribe previously unsubscribed email
                existing.subscribed = 1
                existing.subscribed_at = datetime.utcnow()
                existing.unsubscribed_at = None
                db.commit()
                logger.info(f"Resubscribed email: {email}")
                return NewsletterResponse(
                    success=True,
                    message="Successfully resubscribed to the newsletter"
                )
        
        # Create new subscription
        subscriber = NewsletterSubscriber(
            email=email,
            subscribed=1,
            subscribed_at=datetime.utcnow()
        )
        
        db.add(subscriber)
        db.commit()
        db.refresh(subscriber)
        
        logger.info(f"New newsletter subscription: {email}")
        return NewsletterResponse(
            success=True,
            message="Successfully subscribed to the newsletter"
        )
    
    except IntegrityError:
        db.rollback()
        # Handle race condition where email was added between check and insert
        return NewsletterResponse(
            success=True,
            message="Email is already subscribed to the newsletter"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error subscribing email {email}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to subscribe. Please try again later."
        )


@router.post("/newsletter/unsubscribe", response_model=NewsletterResponse)
async def unsubscribe_newsletter(
    subscription: NewsletterSubscribe,
    db: Session = Depends(get_db)
):
    """Unsubscribe an email address from the newsletter."""
    email = subscription.email.strip().lower()
    
    try:
        subscriber = db.query(NewsletterSubscriber).filter(
            NewsletterSubscriber.email == email
        ).first()
        
        if not subscriber:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email not found in newsletter subscribers"
            )
        
        if subscriber.subscribed == 0:
            return NewsletterResponse(
                success=True,
                message="Email is already unsubscribed"
            )
        
        subscriber.subscribed = 0
        subscriber.unsubscribed_at = datetime.utcnow()
        db.commit()
        
        logger.info(f"Unsubscribed email: {email}")
        return NewsletterResponse(
            success=True,
            message="Successfully unsubscribed from the newsletter"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error unsubscribing email {email}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unsubscribe. Please try again later."
        )


@router.get("/newsletter/subscribers", response_model=SubscriberList)
async def list_subscribers(
    active_only: bool = False,
    db: Session = Depends(get_db),
    admin_email: str = Depends(require_admin)
):
    """
    List all newsletter subscribers. Admin endpoint.
    
    Args:
        active_only: If True, only return active subscribers (subscribed=1)
    """
    try:
        query = db.query(NewsletterSubscriber)
        
        if active_only:
            query = query.filter(NewsletterSubscriber.subscribed == 1)
        
        subscribers = query.order_by(NewsletterSubscriber.subscribed_at.desc()).all()
        
        active_count = sum(1 for s in subscribers if s.subscribed == 1)
        inactive_count = len(subscribers) - active_count
        
        return SubscriberList(
            total=len(subscribers),
            active_count=active_count,
            inactive_count=inactive_count,
            subscribers=[SubscriberInfo.model_validate(sub) for sub in subscribers]
        )
    except Exception as e:
        logger.error(f"Error fetching subscribers: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch subscribers"
        )

