from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db_session import get_db
from app.services.ingestion.whoop_ingestion import ingest_whoop_zip
from app.schemas.api import UploadResponse, UploadStatus

router = APIRouter(tags=["upload"])

@router.post("/whoop/upload", response_model=UploadResponse)
def upload(user_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(400, "Only ZIP supported")

    up = ingest_whoop_zip(db, user_id, file.file)

    return UploadResponse(
        upload_id=up.id,
        status=UploadStatus(up.status.value),
        message="Upload processed"
    )
