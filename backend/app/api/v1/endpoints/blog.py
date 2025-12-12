from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
import re
import threading
from datetime import datetime

from app.db_session import get_db
from app.models.database import BlogPost, NewsletterSubscriber
from app.schemas.api import BlogPost as BlogPostSchema, BlogPostCreate, BlogPostUpdate, BlogPostList
from app.utils.admin_auth import require_admin
from app.utils.email_service import send_bulk_blog_post_notifications

logger = logging.getLogger(__name__)

router = APIRouter()


def generate_slug(title: str) -> str:
    """Generate URL-friendly slug from title."""
    slug = title.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug


def _notify_subscribers_worker(
    blog_title: str,
    blog_preview: str,
    blog_slug: str,
    blog_category: str,
    reading_time: Optional[str] = None
):
    """
    Worker function that runs in a background thread to notify subscribers.
    Creates its own database session since the original session may be closed.
    """
    try:
        from app.db_session import SessionLocal
        
        # Create a new database session for this thread
        db = SessionLocal()
        
        try:
            # Get all active subscribers
            subscribers = db.query(NewsletterSubscriber).filter(
                NewsletterSubscriber.subscribed == 1
            ).all()
            
            if not subscribers:
                logger.info("No active newsletter subscribers to notify")
                return
            
            subscriber_emails = [sub.email for sub in subscribers]
            logger.info(f"Notifying {len(subscriber_emails)} subscribers about blog post: {blog_title}")
            
            # Send notifications
            result = send_bulk_blog_post_notifications(
                subscriber_emails=subscriber_emails,
                blog_title=blog_title,
                blog_preview=blog_preview,
                blog_slug=blog_slug,
                blog_category=blog_category,
                reading_time=reading_time
            )
            
            logger.info(
                f"Blog post notification results: {result['success_count']} successful, "
                f"{result['failure_count']} failed out of {result['total']} subscribers"
            )
        finally:
            db.close()
        
    except Exception as e:
        # Don't fail the blog post creation if notification fails
        logger.error(f"Error notifying subscribers about blog post: {e}", exc_info=True)


def notify_subscribers_about_blog_post(
    db: Session,
    blog_title: str,
    blog_preview: str,
    blog_slug: str,
    blog_category: str,
    reading_time: Optional[str] = None
):
    """
    Notify all subscribed newsletter subscribers about a new blog post.
    This function runs in a background thread to avoid blocking the API response.
    """
    # Start background thread
    thread = threading.Thread(
        target=_notify_subscribers_worker,
        args=(
            blog_title,
            blog_preview,
            blog_slug,
            blog_category,
            reading_time
        ),
        daemon=True  # Thread will exit when main process exits
    )
    thread.start()
    logger.info(f"Started background thread to notify subscribers about blog post: {blog_title}")


@router.get("/blog", response_model=BlogPostList)
async def list_blog_posts(
    published_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all blog posts. By default, only returns published posts."""
    try:
        query = db.query(BlogPost)
        if published_only:
            query = query.filter(BlogPost.published == 1)
        posts = query.order_by(BlogPost.created_at.desc()).all()
        
        return BlogPostList(posts=[BlogPostSchema.model_validate(post) for post in posts])
    except Exception as e:
        logger.error(f"Error fetching blog posts: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch blog posts")


@router.get("/blog/{post_id}", response_model=BlogPostSchema)
async def get_blog_post(
    post_id: int,
    db: Session = Depends(get_db)
):
    """Get a single blog post by ID."""
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return BlogPostSchema.model_validate(post)


@router.get("/blog/slug/{slug}", response_model=BlogPostSchema)
async def get_blog_post_by_slug(
    slug: str,
    db: Session = Depends(get_db)
):
    """Get a blog post by slug."""
    post = db.query(BlogPost).filter(BlogPost.slug == slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return BlogPostSchema.model_validate(post)


@router.post("/blog", response_model=BlogPostSchema, status_code=status.HTTP_201_CREATED)
async def create_blog_post(
    post: BlogPostCreate,
    db: Session = Depends(get_db),
    admin_email: str = Depends(require_admin)
):
    """Create a new blog post. Admin endpoint."""
    try:
        # Generate slug if not provided
        if not post.slug:
            post.slug = generate_slug(post.title)
        
        # Check if slug already exists
        existing = db.query(BlogPost).filter(BlogPost.slug == post.slug).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Blog post with slug '{post.slug}' already exists")
        
        db_post = BlogPost(
            title=post.title,
            category=post.category,
            reading_time=post.reading_time,
            preview=post.preview,
            content=post.content,
            slug=post.slug,
            published=post.published
        )
        
        db.add(db_post)
        db.commit()
        db.refresh(db_post)
        
        logger.info(f"Created blog post: {db_post.title} (ID: {db_post.id})")
        
        # Notify subscribers if the post is published
        if db_post.published == 1:
            try:
                notify_subscribers_about_blog_post(
                    db=db,
                    blog_title=db_post.title,
                    blog_preview=db_post.preview,
                    blog_slug=db_post.slug,
                    blog_category=db_post.category,
                    reading_time=db_post.reading_time
                )
            except Exception as e:
                # Log error but don't fail the request
                logger.error(f"Failed to send blog post notifications: {e}", exc_info=True)
        
        return BlogPostSchema.model_validate(db_post)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating blog post: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create blog post: {str(e)}")


@router.put("/blog/{post_id}", response_model=BlogPostSchema)
async def update_blog_post(
    post_id: int,
    post_update: BlogPostUpdate,
    db: Session = Depends(get_db),
    admin_email: str = Depends(require_admin)
):
    """Update a blog post. Admin endpoint."""
    db_post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    try:
        # Track if post is being published for the first time
        was_published = db_post.published == 1
        is_being_published = False
        
        # Update fields if provided
        update_data = post_update.model_dump(exclude_unset=True)
        
        # Check if post is being published (was draft, now published)
        if 'published' in update_data:
            is_being_published = update_data['published'] == 1 and not was_published
        
        # Handle slug generation if title changed
        if 'title' in update_data and not update_data.get('slug'):
            new_slug = generate_slug(update_data['title'])
            # Check if new slug conflicts with existing post
            existing = db.query(BlogPost).filter(
                BlogPost.slug == new_slug,
                BlogPost.id != post_id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail=f"Blog post with slug '{new_slug}' already exists")
            update_data['slug'] = new_slug
        
        for field, value in update_data.items():
            setattr(db_post, field, value)
        
        db_post.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_post)
        
        logger.info(f"Updated blog post: {db_post.title} (ID: {db_post.id})")
        
        # Notify subscribers if the post is being published for the first time
        if is_being_published:
            try:
                notify_subscribers_about_blog_post(
                    db=db,
                    blog_title=db_post.title,
                    blog_preview=db_post.preview,
                    blog_slug=db_post.slug,
                    blog_category=db_post.category,
                    reading_time=db_post.reading_time
                )
            except Exception as e:
                # Log error but don't fail the request
                logger.error(f"Failed to send blog post notifications: {e}", exc_info=True)
        
        return BlogPostSchema.model_validate(db_post)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating blog post: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update blog post: {str(e)}")


@router.delete("/blog/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_blog_post(
    post_id: int,
    db: Session = Depends(get_db),
    admin_email: str = Depends(require_admin)
):
    """Delete a blog post. Admin endpoint."""
    db_post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    try:
        db.delete(db_post)
        db.commit()
        logger.info(f"Deleted blog post: {db_post.title} (ID: {db_post.id})")
        return None
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting blog post: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete blog post: {str(e)}")

