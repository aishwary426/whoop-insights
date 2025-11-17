<<<<<<< HEAD
"""
Dashboard endpoints for summaries, trends, and insights.
"""
import logging
from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db_session import get_db
from app.services.analysis.dashboard_service import build_dashboard
from app.services.analysis.insights_service import generate_insights_for_user
from app.schemas.api import (
    DashboardSummary,
    TrendsResponse,
    TrendPoint,
    InsightsFeed,
    InsightItem,
)
from app.models.database import DailyMetrics, Insight
=======
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db_session import get_db
from app.schemas.api import DashboardSummary, InsightsFeed, TrendsResponse
from app.services.analysis.dashboard_service import (
    generate_insights_for_user,
    get_dashboard_summary,
    get_trends,
)
>>>>>>> 57703a5 (Initial commit - Whoop Insights Pro)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/summary", response_model=DashboardSummary)
<<<<<<< HEAD
def get_dashboard_summary(
    user_id: str = Query(..., description="User identifier"),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive dashboard summary.
    
    Includes:
    - Today's metrics
    - Personalized recommendation
    - Tomorrow's recovery forecast
    - Health scores (consistency, burnout risk, sleep health)
    - Risk flags
    
    Returns:
        DashboardSummary
    """
    logger.info(f"Dashboard summary request for user {user_id}")
    
    try:
        return build_dashboard(db, user_id)
    except Exception as e:
        logger.error(f"Failed to build dashboard for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to build dashboard: {str(e)}"
        )


@router.get("/dashboard/trends", response_model=TrendsResponse)
def get_trends(
    user_id: str = Query(..., description="User identifier"),
    start_date: Optional[date] = Query(None, description="Start date (default: 30 days ago)"),
    end_date: Optional[date] = Query(None, description="End date (default: today)"),
    db: Session = Depends(get_db)
):
    """
    Get trend data for recovery, strain, sleep, and HRV.
    
    Args:
        user_id: User identifier
        start_date: Optional start date (defaults to 30 days ago)
        end_date: Optional end date (defaults to today)
    
    Returns:
        TrendsResponse with time series data
    """
    logger.info(f"Trends request for user {user_id}")
    
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    try:
        metrics = (
            db.query(DailyMetrics)
            .filter(DailyMetrics.user_id == user_id)
            .filter(DailyMetrics.date >= start_date)
            .filter(DailyMetrics.date <= end_date)
            .order_by(DailyMetrics.date.asc())
            .all()
        )
        
        recovery = [TrendPoint(date=m.date, value=m.recovery_score) for m in metrics]
        strain = [TrendPoint(date=m.date, value=m.strain_score) for m in metrics]
        sleep = [TrendPoint(date=m.date, value=m.sleep_hours) for m in metrics]
        hrv = [TrendPoint(date=m.date, value=m.hrv) for m in metrics]
        
        return TrendsResponse(
            recovery=recovery,
            strain=strain,
            sleep=sleep,
            hrv=hrv,
        )
        
    except Exception as e:
        logger.error(f"Failed to get trends for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get trends: {str(e)}"
        )


@router.get("/dashboard/insights", response_model=InsightsFeed)
def get_insights(
    user_id: str = Query(..., description="User identifier"),
    regenerate: bool = Query(False, description="Regenerate insights"),
    db: Session = Depends(get_db)
):
    """
    Get insights feed for a user.
    
    - Generates insights if none exist or if regenerate=true
    - Returns actionable insights based on data patterns
    
    Returns:
        InsightsFeed with list of insights
    """
    logger.info(f"Insights request for user {user_id}, regenerate={regenerate}")
    
    try:
        # Generate insights if needed
        existing_count = db.query(Insight).filter(Insight.user_id == user_id).count()
        
        if regenerate or existing_count == 0:
            generate_insights_for_user(db, user_id)
        
        # Get insights
        insights = (
            db.query(Insight)
            .filter(Insight.user_id == user_id)
            .order_by(Insight.created_at.desc())
            .limit(20)
            .all()
        )
        
        insight_items = [
            InsightItem(
                id=insight.id,
                insight_type=insight.insight_type.value,
                title=insight.title,
                description=insight.description,
                confidence=insight.confidence,
                period_start=insight.period_start,
                period_end=insight.period_end,
                data=insight.data,
            )
            for insight in insights
        ]
        
        return InsightsFeed(insights=insight_items)
        
    except Exception as e:
        logger.error(f"Failed to get insights for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get insights: {str(e)}"
        )
=======
def summary(user_id: str, db: Session = Depends(get_db)):
    return get_dashboard_summary(db, user_id)


@router.get("/dashboard/trends", response_model=TrendsResponse)
def trends(user_id: str, start_date: date | None = None, end_date: date | None = None, db: Session = Depends(get_db)):
    return get_trends(db, user_id, start_date, end_date)


@router.get("/dashboard/insights", response_model=InsightsFeed)
def insights(user_id: str, db: Session = Depends(get_db)):
    return generate_insights_for_user(db, user_id)
>>>>>>> 57703a5 (Initial commit - Whoop Insights Pro)
