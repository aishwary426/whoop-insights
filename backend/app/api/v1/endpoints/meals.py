from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db_session import get_db
from app.models.database import Meal, User, DailyCalorieSummary
from app.services.calorie_service import ensure_today_meals_only, get_daily_calorie_summaries
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date, timedelta

router = APIRouter()

class MealCreate(BaseModel):
    user_id: str
    name: str
    calories: int
    protein: Optional[int] = 0
    carbs: Optional[int] = 0
    fats: Optional[int] = 0
    image_url: Optional[str] = None
    timestamp: Optional[datetime] = None

class MealResponse(BaseModel):
    id: int
    user_id: str
    name: str
    calories: int
    protein: Optional[int]
    carbs: Optional[int]
    fats: Optional[int]
    timestamp: datetime

    class Config:
        from_attributes = True

@router.post("/", response_model=MealResponse)
@router.post("", response_model=MealResponse, include_in_schema=False)
def create_meal(
    meal: MealCreate,
    db: Session = Depends(get_db)
):
    # Verify user exists (optional but good)
    user = db.query(User).filter(User.id == meal.user_id).first()
    if not user:
        # If user doesn't exist, we might create it or fail.
        # For now, let's fail if strict, or just allow it (since we hardcoded fallback).
        # Given the "single user" fallback in webhook, let's just proceed.
        pass

    # Ensure previous days are archived before adding new meal
    ensure_today_meals_only(db, meal.user_id)
    
    # Create meal with provided timestamp or current time
    meal_time = meal.timestamp if meal.timestamp else datetime.utcnow()
    
    new_meal = Meal(
        user_id=meal.user_id,
        name=meal.name,
        calories=meal.calories,
        protein=meal.protein,
        carbs=meal.carbs,
        fats=meal.fats,
        image_url=meal.image_url,
        timestamp=meal_time,
        date=meal_time.date()  # Set the date field from the timestamp
    )
    db.add(new_meal)
    db.commit()
    db.refresh(new_meal)
    return new_meal

@router.get("/", response_model=List[MealResponse])
@router.get("", response_model=List[MealResponse], include_in_schema=False)
def get_meals(
    user_id: str,
    date_filter: Optional[date] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    # Ensure previous days are archived (only returns today's meals by default)
    # Note: If we are querying a historical date range, this check might be redundant or side-effecty,
    # but strictly speaking, ensure_today_meals_only is about archiving YESTERDAY if today is active.
    # It's generally safe to keep called.
    ensure_today_meals_only(db, user_id)
    
    query = db.query(Meal).filter(Meal.user_id == user_id)
    
    if start_time and end_time:
        # Precision filtering (used by frontend to handle timezone correct days)
        query = query.filter(Meal.timestamp >= start_time, Meal.timestamp <= end_time)
        
    elif date_filter:
        # Legacy/Simple Day filtering (UTC Day)
        start_of_day = datetime.combine(date_filter, datetime.min.time())
        end_of_day = datetime.combine(date_filter, datetime.max.time())
        query = query.filter(Meal.timestamp >= start_of_day, Meal.timestamp <= end_of_day)
    else:
        # Default to today (UTC)
        today = date.today()
        start_of_day = datetime.combine(today, datetime.min.time())
        end_of_day = datetime.combine(today, datetime.max.time())
        query = query.filter(Meal.timestamp >= start_of_day, Meal.timestamp <= end_of_day)
    
    return query.all()
    

@router.delete("/{meal_id}")
def delete_meal(
    meal_id: int,
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a specific meal by ID.
    Enforces that the meal belongs to the requesting user.
    """
    meal = db.query(Meal).filter(Meal.id == meal_id, Meal.user_id == user_id).first()
    
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
        
    db.delete(meal)
    db.commit()
    
    return {"message": "Meal deleted successfully", "id": meal_id}


@router.delete("/reset")
def reset_meals(
    user_id: str,
    date_filter: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """
    Delete all meals for a user on a specific date.
    """
    # Default to today if no date_filter specified
    if date_filter is None:
        date_filter = date.today()
    
    start_of_day = datetime.combine(date_filter, datetime.min.time())
    end_of_day = datetime.combine(date_filter, datetime.max.time())
    
    # Delete meals in the range
    result = db.query(Meal).filter(
        Meal.user_id == user_id,
        Meal.timestamp >= start_of_day, 
        Meal.timestamp <= end_of_day
    ).delete(synchronize_session=False)
    
    db.commit()
    
    return {"message": f"Deleted {result} meals for {date_filter}", "count": result}


class DailyCalorieSummaryResponse(BaseModel):
    id: int
    user_id: str
    date: date
    total_calories: int
    total_protein: Optional[int]
    total_carbs: Optional[int]
    total_fats: Optional[int]
    meals_count: int
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/summaries", response_model=List[DailyCalorieSummaryResponse])
def get_calorie_summaries(
    user_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """
    Get daily calorie summaries for historical review.
    Returns archived daily calorie totals.
    """
    summaries = get_daily_calorie_summaries(db, user_id, start_date, end_date)
    return summaries


@router.post("/archive-daily")
def archive_daily_calories(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Manually trigger archiving of previous day's calories.
    This can be called by a scheduled task or manually.
    """
    from app.services.calorie_service import archive_previous_day_calories
    
    yesterday = date.today() - timedelta(days=1)
    success = archive_previous_day_calories(db, user_id, yesterday)
    
    if success:
        return {"status": "success", "message": f"Archived calories for {yesterday}"}
    else:
        raise HTTPException(status_code=500, detail="Failed to archive calories")
