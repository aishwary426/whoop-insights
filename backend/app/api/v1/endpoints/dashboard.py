import logging
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db_session import get_db
from app.schemas.api import DashboardSummary, InsightsFeed, TrendsResponse, CalorieAnalysis, InsightItem
from app.services.analysis.dashboard_service import (
    generate_insights_for_user,
    get_dashboard_summary,
    get_trends,
    get_calorie_analysis,
    get_journal_insights,
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
