from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db_session import get_db
from app.ml.models.trainer import train_user_models

router = APIRouter(tags=["train"])

@router.post("/train")
def train(user_id: str, db: Session = Depends(get_db)):
    res = train_user_models(db, user_id)
    if not res:
        return {"status": "not_enough_data"}
    return res
