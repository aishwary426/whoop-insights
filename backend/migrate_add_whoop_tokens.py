#!/usr/bin/env python3
"""
Migration script to add WhoopToken table for storing Whoop OAuth tokens.
This enables automatic syncing of Whoop data without re-authentication.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text, inspect
from app.db_session import get_db, engine
from app.models.database import Base, WhoopToken

def migrate():
    """Create WhoopToken table if it doesn't exist."""
    db = next(get_db())
    try:
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        if 'whoop_tokens' not in existing_tables:
            print("Creating whoop_tokens table...")
            # Use SQLAlchemy to create the table
            WhoopToken.__table__.create(bind=engine, checkfirst=True)
            db.commit()
            print("✅ Migration completed successfully - whoop_tokens table created")
        else:
            print("✅ whoop_tokens table already exists")
            
            # Check if all required columns exist
            columns = [col['name'] for col in inspector.get_columns('whoop_tokens')]
            required_columns = ['id', 'user_id', 'access_token', 'refresh_token', 'expires_at', 'token_type', 'created_at', 'updated_at', 'last_sync_at']
            missing_columns = [col for col in required_columns if col not in columns]
            
            if missing_columns:
                print(f"⚠️  Missing columns: {missing_columns}")
                print("   Consider recreating the table or adding these columns manually")
            else:
                print("✅ All required columns exist")
                
    except Exception as e:
        db.rollback()
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate()





