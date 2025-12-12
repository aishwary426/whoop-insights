#!/usr/bin/env python3
"""
Migration script to add DailyCalorieSummary table and update existing meals with date field.
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.models.database import Base, Meal, DailyCalorieSummary
from app.core_config import get_settings
from datetime import datetime, date

def migrate():
    """Run the migration."""
    settings = get_settings()
    engine = create_engine(settings.database_url)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        print("Creating DailyCalorieSummary table...")
        DailyCalorieSummary.__table__.create(engine, checkfirst=True)
        print("✓ DailyCalorieSummary table created")
        
        # Update existing meals to have date field populated
        print("Updating existing meals with date field...")
        meals = db.query(Meal).filter(Meal.date == None).all()
        
        updated_count = 0
        for meal in meals:
            if meal.timestamp:
                meal.date = meal.timestamp.date()
                updated_count += 1
        
        db.commit()
        print(f"✓ Updated {updated_count} meals with date field")
        
        # Archive any meals from previous days
        print("Archiving previous days' meals...")
        from app.services.calorie_service import archive_previous_day_calories
        
        # Get all unique dates from meals (excluding today)
        today = date.today()
        unique_dates = db.query(Meal.date).filter(
            Meal.date != None,
            Meal.date < today
        ).distinct().all()
        
        archived_count = 0
        for (meal_date,) in unique_dates:
            if meal_date:
                # Get user_ids for this date
                user_ids = db.query(Meal.user_id).filter(
                    Meal.date == meal_date
                ).distinct().all()
                
                for (user_id,) in user_ids:
                    if archive_previous_day_calories(db, user_id, meal_date):
                        archived_count += 1
        
        print(f"✓ Archived meals from {archived_count} user-days")
        
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate()


