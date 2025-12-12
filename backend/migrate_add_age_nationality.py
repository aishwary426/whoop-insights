"""
Migration script to add age and nationality columns to users table.
Run this script once to update existing databases.
"""
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from app.db_session import SessionLocal
from app.models.database import Base, User
from app.core_config import get_settings

def migrate():
    """Add age and nationality columns to users table if they don't exist."""
    settings = get_settings()
    db = SessionLocal()
    
    try:
        # Check if columns exist (SQLite specific)
        if 'sqlite' in settings.database_url.lower():
            # For SQLite, we need to check if columns exist
            result = db.execute(text("PRAGMA table_info(users)"))
            columns = [row[1] for row in result]
            
            if 'age' not in columns:
                print("Adding 'age' column to users table...")
                db.execute(text("ALTER TABLE users ADD COLUMN age INTEGER"))
                db.commit()
                print("✅ Added 'age' column")
            else:
                print("✅ 'age' column already exists")
            
            if 'nationality' not in columns:
                print("Adding 'nationality' column to users table...")
                db.execute(text("ALTER TABLE users ADD COLUMN nationality VARCHAR"))
                db.commit()
                print("✅ Added 'nationality' column")
            else:
                print("✅ 'nationality' column already exists")
        else:
            # For PostgreSQL, use IF NOT EXISTS equivalent
            try:
                db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER"))
                db.commit()
                print("✅ Added 'age' column (or already exists)")
            except Exception as e:
                if 'duplicate column' not in str(e).lower() and 'already exists' not in str(e).lower():
                    raise
                print("✅ 'age' column already exists")
            
            try:
                db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS nationality VARCHAR"))
                db.commit()
                print("✅ Added 'nationality' column (or already exists)")
            except Exception as e:
                if 'duplicate column' not in str(e).lower() and 'already exists' not in str(e).lower():
                    raise
                print("✅ 'nationality' column already exists")
        
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("Running migration to add age and nationality columns...")
    migrate()




















