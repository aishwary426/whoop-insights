from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db_session import get_db
from app.services.analysis.dashboard_service import build_dashboard
from app.schemas.api import DashboardSummary

router = APIRouter(tags=["dashboard"])

@router.get("/dashboard/summary", response_model=DashboardSummary)
def summary(user_id: str, db: Session = Depends(get_db)):
    return build_dashboard(db, user_id)
