import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core_config import settings
from app.models.database import DailyMetrics, User

def debug_db():
    engine = create_engine(settings.database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        print("--- Users ---")
        users = db.query(User).all()
        for u in users:
            print(f"User: {u.id}, Name: {u.name}, Email: {u.email}")

        print("\n--- Latest Daily Metrics ---")
        metrics = db.query(DailyMetrics).order_by(DailyMetrics.date.desc()).limit(5).all()
        for m in metrics:
            print(f"Date: {m.date}, User: {m.user_id}, Recovery: {m.recovery_score}, Sleep: {m.sleep_hours}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_db()
