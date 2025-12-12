#!/usr/bin/env python3
"""
Migration script to add data_source column to Upload table.
Sets default to 'zip' for existing records.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from app.db_session import get_db

def migrate():
    """Add data_source column to Upload table if it doesn't exist."""
    db = next(get_db())
    try:
        # Check if column exists
        result = db.execute(text("""
            SELECT COUNT(*) as count 
            FROM pragma_table_info('uploads') 
            WHERE name = 'data_source'
        """))
        count = result.fetchone()[0]
        
        if count == 0:
            print("Adding data_source column to uploads table...")
            # Add column with default value
            db.execute(text("""
                ALTER TABLE uploads 
                ADD COLUMN data_source TEXT DEFAULT 'zip'
            """))
            # Update existing records to 'zip' (they're all ZIP uploads)
            db.execute(text("""
                UPDATE uploads 
                SET data_source = 'zip' 
                WHERE data_source IS NULL
            """))
            db.commit()
            print("✅ Migration completed successfully")
        else:
            print("✅ Column data_source already exists")
    except Exception as e:
        db.rollback()
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate()





