import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db_session import get_db
from app.ml.models.trainer import train_user_models
from app.schemas.api import TrainingSummary
from app.utils.device import is_mobile_user_agent

logger = logging.getLogger(__name__)
router = APIRouter(tags=["train"])


@router.post("/train", response_model=TrainingSummary)
def train(user_id: str, request: Request, db: Session = Depends(get_db)):
    is_mobile = is_mobile_user_agent(request.headers.get("user-agent"))
    summary = train_user_models(db, user_id, is_mobile=is_mobile)
    if not summary:
        raise HTTPException(status_code=404, detail="No data found for training.")
    return summary
