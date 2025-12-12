#!/usr/bin/env python3
"""Check what date range is stored in the database"""
import sys
import os
from datetime import datetime, timedelta

sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.core_config import get_settings
from app.models.database import DailyMetrics, User
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

def check_date_range():
    settings = get_settings()
    engine = create_engine(settings.database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Get all users
        users = db.query(User).all()
        print(f"Found {len(users)} user(s)\n")
        
        for user in users:
            print(f"User: {user.id} ({user.email})")
            
            # Get date range for this user
            metrics = db.query(DailyMetrics).filter(DailyMetrics.user_id == user.id).order_by(DailyMetrics.date.asc()).all()
            
            if not metrics:
                print("  No metrics found\n")
                continue
            
            min_date = metrics[0].date
            max_date = metrics[-1].date
            days_span = (max_date - min_date).days
            total_records = len(metrics)
            
            print(f"  Total records: {total_records}")
            print(f"  Date range: {min_date} to {max_date}")
            print(f"  Span: {days_span} days")
            
            # Check if 25 days ago is in the data
            today = datetime.utcnow().date()
            date_25_days_ago = today - timedelta(days=25)
            
            print(f"\n  Today: {today}")
            print(f"  25 days ago: {date_25_days_ago}")
            
            # Find closest record to 25 days ago
            closest = None
            min_diff = None
            for m in metrics:
                diff = abs((m.date - date_25_days_ago).days)
                if min_diff is None or diff < min_diff:
                    min_diff = diff
                    closest = m
            
            if closest:
                print(f"  Closest record to 25 days ago: {closest.date} (diff: {min_diff} days)")
                if closest.date == date_25_days_ago:
                    print(f"  ✅ Data exists for 25 days ago!")
                else:
                    print(f"  ⚠️  No exact match for 25 days ago (closest is {min_diff} days away)")
            
            # Show recent dates
            print(f"\n  Recent dates (last 10):")
            for m in metrics[-10:]:
                print(f"    {m.date} - Recovery: {m.recovery_score}, Strain: {m.strain_score}")
            
            print()
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    check_date_range()

