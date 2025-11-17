"""
Training endpoint for ML models.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db_session import get_db
from app.ml.models.trainer import train_user_models
from app.schemas.api import TrainingSummary
from app.core_config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(tags=["train"])
settings = get_settings()


@router.post("/train", response_model=TrainingSummary)
def train_models(
    user_id: str = Query(..., description="User identifier"),
    db: Session = Depends(get_db)
):
    """
    Train ML models for a user.
    
    - Requires at least 14 days of data (configurable)
    - Trains recovery predictor, burnout classifier, sleep classifier
    - Returns training summary with metrics
    
    Returns:
        TrainingSummary with model version, metrics, and data summary
    """
    logger.info(f"Training request for user {user_id}")
    
    try:
        result = train_user_models(db, user_id)
        
        if not result:
            return TrainingSummary(
                status="not_enough_data",
                trained_models=[],
                metrics={},
                data_summary={},
            )
        
        return TrainingSummary(**result)
        
    except Exception as e:
        logger.error(f"Training failed for user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Training failed: {str(e)}"
        )
