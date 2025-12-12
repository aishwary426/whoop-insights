import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.db_session import engine
from app.models.database import Base

def init_db():
    print("Initializing database...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"❌ Failed to create database tables: {e}")
        sys.exit(1)

if __name__ == "__main__":
    init_db()
