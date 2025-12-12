#!/usr/bin/env python3
"""
Migration script to add image_url column to blog_posts table.
Run this once to update existing database.
"""

import sys
import os
from sqlalchemy import text

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db_session import SessionLocal, engine
from app.models.database import Base
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate_add_image_url():
    """Add image_url column to blog_posts table if it doesn't exist."""
    db = SessionLocal()
    
    try:
        # Check if column already exists (SQLite specific)
        result = db.execute(text("""
            SELECT COUNT(*) as count
            FROM pragma_table_info('blog_posts')
            WHERE name='image_url'
        """))
        
        exists = result.fetchone().count > 0
        
        if exists:
            logger.info("✅ image_url column already exists in blog_posts table")
            return
        
        # Add the column
        logger.info("Adding image_url column to blog_posts table...")
        db.execute(text("""
            ALTER TABLE blog_posts
            ADD COLUMN image_url TEXT
        """))
        
        db.commit()
        logger.info("✅ Successfully added image_url column to blog_posts table")
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error adding image_url column: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    logger.info("=" * 50)
    logger.info("Migration: Add image_url to blog_posts")
    logger.info("=" * 50)
    
    try:
        migrate_add_image_url()
        logger.info("=" * 50)
        logger.info("✨ Migration completed successfully!")
        logger.info("=" * 50)
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)























