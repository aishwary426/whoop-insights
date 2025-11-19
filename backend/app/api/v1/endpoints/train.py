import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db_session import get_db
from app.ml.models.trainer import train_user_models
from app.schemas.api import TrainingSummary

logger = logging.getLogger(__name__)
router = APIRouter(tags=["train"])


@router.post("/train", response_model=TrainingSummary)
def train(user_id: str, db: Session = Depends(get_db)):
    summary = train_user_models(db, user_id)
    if not summary:
        raise HTTPException(status_code=404, detail="No data found for training.")
    return summary
