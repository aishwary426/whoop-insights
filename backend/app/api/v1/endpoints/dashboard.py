import logging
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db_session import get_db
from app.schemas.api import DashboardSummary, InsightsFeed, TrendsResponse, CalorieAnalysis, InsightItem, CalorieGPSResponse
from app.services.analysis.dashboard_service import (
    generate_insights_for_user,
    get_dashboard_summary,
    get_trends,
    get_calorie_analysis,
    get_journal_insights,
    get_personalization_insights,
    get_calorie_gps_recommendations,
    get_all_model_metrics,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/summary", response_model=DashboardSummary)
def summary(user_id: str, db: Session = Depends(get_db)):
    return get_dashboard_summary(db, user_id)


from typing import Optional

@router.get("/dashboard/trends", response_model=TrendsResponse)
def trends(user_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None, db: Session = Depends(get_db)):
    return get_trends(db, user_id, start_date, end_date)


@router.get("/dashboard/insights", response_model=InsightsFeed)
def insights(user_id: str, db: Session = Depends(get_db)):
    return generate_insights_for_user(db, user_id)


@router.get("/dashboard/calorie-analysis", response_model=CalorieAnalysis)
def calorie_analysis(user_id: str, db: Session = Depends(get_db)):
    return get_calorie_analysis(db, user_id)


@router.get("/dashboard/journal-insights", response_model=list[InsightItem])
def journal_insights(user_id: str, db: Session = Depends(get_db)):
    return get_journal_insights(db, user_id)


@router.get("/dashboard/personalization-insights", response_model=list[InsightItem])
def personalization_insights(user_id: str, db: Session = Depends(get_db)):
    """Get personalized ML insights: optimal sleep windows, workout timing, and strain tolerance."""
    return get_personalization_insights(db, user_id)


@router.get("/calorie-gps/recommendations", response_model=CalorieGPSResponse)
def calorie_gps_recommendations(
    user_id: str,
    recovery_score: float,
    target_calories: float,
    strain_score: Optional[float] = None,
    sleep_hours: Optional[float] = None,
    hrv: Optional[float] = None,
    resting_hr: Optional[float] = None,
    acute_chronic_ratio: Optional[float] = None,
    sleep_debt: Optional[float] = None,
    consistency_score: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """Get hyper-personalized calorie GPS workout recommendations using ML model."""
    return get_calorie_gps_recommendations(
        db=db,
        user_id=user_id,
        recovery_score=recovery_score,
        target_calories=target_calories,
        strain_score=strain_score,
        sleep_hours=sleep_hours,
        hrv=hrv,
        resting_hr=resting_hr,
        acute_chronic_ratio=acute_chronic_ratio,
        sleep_debt=sleep_debt,
        consistency_score=consistency_score
    )


@router.get("/model-metrics")
def model_metrics(user_id: str, db: Session = Depends(get_db)):
    """Get all trained model metrics for a user."""
    import logging
    from pathlib import Path
    from app.core_config import get_settings
    
    logger = logging.getLogger(__name__)
    settings = get_settings()
    
    # Log model directory for debugging
    model_dir = Path(settings.model_dir) / user_id
    logger.info(f"Checking for models in: {model_dir}")
    logger.info(f"Model directory exists: {model_dir.exists()}")
    
    if model_dir.exists():
        version_dirs = [d for d in model_dir.iterdir() if d.is_dir()]
        logger.info(f"Found {len(version_dirs)} version directories: {[str(d.name) for d in version_dirs]}")
    
    metrics = get_all_model_metrics(user_id)
    logger.info(f"Returning {len(metrics)} model metrics for user {user_id}: {list(metrics.keys())}")
    
    return metrics
