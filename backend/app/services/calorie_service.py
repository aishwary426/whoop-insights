"""
Service for managing daily calorie summaries and archiving.
"""
import logging
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.database import Meal, DailyCalorieSummary

logger = logging.getLogger(__name__)


def archive_previous_day_calories(db: Session, user_id: str, target_date: date = None) -> bool:
    """
    Archive calories for a specific date (defaults to yesterday).
    Calculates totals and saves to DailyCalorieSummary, then removes meals for that date.
    
    Args:
        db: Database session
        user_id: User ID
        target_date: Date to archive (defaults to yesterday)
    
    Returns:
        True if archived successfully, False otherwise
    """
    if target_date is None:
        target_date = datetime.utcnow().date() - timedelta(days=1)
    
    try:
        # Check if summary already exists
        existing_summary = db.query(DailyCalorieSummary).filter(
            DailyCalorieSummary.user_id == user_id,
            DailyCalorieSummary.date == target_date
        ).first()
        
        if existing_summary:
            logger.info(f"Summary already exists for user {user_id} on {target_date}")
            return True
        
        # Calculate totals for the target date
        start_of_day = datetime.combine(target_date, datetime.min.time())
        end_of_day = datetime.combine(target_date, datetime.max.time())
        
        meals = db.query(Meal).filter(
            Meal.user_id == user_id,
            Meal.timestamp >= start_of_day,
            Meal.timestamp <= end_of_day
        ).all()
        
        if not meals:
            logger.info(f"No meals found for user {user_id} on {target_date}")
            # Still create a summary with zeros
            summary = DailyCalorieSummary(
                user_id=user_id,
                date=target_date,
                total_calories=0,
                total_protein=0,
                total_carbs=0,
                total_fats=0,
                meals_count=0
            )
            db.add(summary)
            db.commit()
            return True
        
        # Calculate totals
        total_calories = sum(meal.calories for meal in meals)
        total_protein = sum(meal.protein or 0 for meal in meals)
        total_carbs = sum(meal.carbs or 0 for meal in meals)
        total_fats = sum(meal.fats or 0 for meal in meals)
        meals_count = len(meals)
        
        # Create summary
        summary = DailyCalorieSummary(
            user_id=user_id,
            date=target_date,
            total_calories=total_calories,
            total_protein=total_protein,
            total_carbs=total_carbs,
            total_fats=total_fats,
            meals_count=meals_count
        )
        db.add(summary)
        
        # DO NOT Delete meals for that date. We want to keep history.
        # db.query(Meal).filter(
        #     Meal.user_id == user_id,
        #     Meal.timestamp >= start_of_day,
        #     Meal.timestamp <= end_of_day
        # ).delete()
        
        db.commit()
        logger.info(f"Archived {meals_count} meals for user {user_id} on {target_date}: {total_calories} calories")
        return True
        
    except Exception as e:
        logger.error(f"Error archiving calories for user {user_id} on {target_date}: {e}", exc_info=True)
        db.rollback()
        return False


def ensure_today_meals_only(db: Session, user_id: str) -> None:
    """
    Ensures that only today's meals are active.
    Archives any meals from previous days.
    This should be called when fetching meals to ensure clean state.
    """
    today = datetime.utcnow().date()
    yesterday = today - timedelta(days=1)
    
    # Archive yesterday's meals if not already archived
    archive_previous_day_calories(db, user_id, yesterday)
    
    # Also check for any older meals that might not be archived
    # Archive meals from 2+ days ago
    two_days_ago = today - timedelta(days=2)
    start_of_two_days_ago = datetime.combine(two_days_ago, datetime.min.time())
    
    old_meals = db.query(Meal).filter(
        Meal.user_id == user_id,
        Meal.timestamp < start_of_two_days_ago
    ).all()
    
    if old_meals:
        # Group by date and archive each day
        meals_by_date = {}
        for meal in old_meals:
            meal_date = meal.timestamp.date()
            if meal_date not in meals_by_date:
                meals_by_date[meal_date] = []
            meals_by_date[meal_date].append(meal)
        
        for meal_date, meals_list in meals_by_date.items():
            archive_previous_day_calories(db, user_id, meal_date)


def get_daily_calorie_summaries(db: Session, user_id: str, start_date: date = None, end_date: date = None) -> list:
    """
    Get daily calorie summaries for a user within a date range.
    
    Args:
        db: Database session
        user_id: User ID
        start_date: Start date (inclusive)
        end_date: End date (inclusive)
    
    Returns:
        List of DailyCalorieSummary objects
    """
    query = db.query(DailyCalorieSummary).filter(DailyCalorieSummary.user_id == user_id)
    
    if start_date:
        query = query.filter(DailyCalorieSummary.date >= start_date)
    if end_date:
        query = query.filter(DailyCalorieSummary.date <= end_date)
    
    return query.order_by(DailyCalorieSummary.date.desc()).all()


