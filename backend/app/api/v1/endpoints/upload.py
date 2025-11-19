"""
Upload endpoint for WHOOP ZIP files.
"""
import asyncio
import json
import logging
import threading
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Request
from fastapi.responses import StreamingResponse

from app.db_session import SessionLocal
from app.schemas.api import UploadResponse, UploadStatus
from app.services.ingestion.whoop_ingestion import ingest_whoop_zip
from app.utils.device import is_mobile_user_agent
from app.utils.progress import progress_tracker
from app.utils.zip_utils import save_upload_file

logger = logging.getLogger(__name__)
router = APIRouter(tags=["upload"])


def _progress_callback_factory(upload_id: str):
    def _emit(cb_upload_id: str, progress: int, message: str, status: str = "processing", stage: str | None = None):
        progress_tracker.update(cb_upload_id, progress, message, status=status, stage=stage)
    return _emit


def _run_ingestion_background(upload_id: str, user_id: str, zip_path: str, is_mobile: bool):
    """
    Execute ingestion in a background thread so the upload request can return immediately.
    """
    db = SessionLocal()
    try:
        ingest_whoop_zip(
            db=db,
            user_id=user_id,
            file_obj=None,
            upload_id=upload_id,
            progress_callback=_progress_callback_factory(upload_id),
            zip_path=zip_path,
            is_mobile=is_mobile,
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("Background ingestion failed", extra={"upload_id": upload_id, "user_id": user_id})
        progress_tracker.update(upload_id, 100, f"Upload failed: {exc}", status="failed", stage="failed")
    finally:
        db.close()


@router.post("/whoop/upload", response_model=UploadResponse)
async def upload_whoop_data(
    request: Request,
    user_id: str = Form(..., description="User identifier"),
    file: UploadFile = File(..., description="WHOOP export ZIP file"),
    is_mobile: bool = Form(False, description="Client hint for mobile uploads"),
):
    """
    Upload and process WHOOP export ZIP file in the background.
    Returns immediately with an upload_id; progress can be streamed via SSE.
    """
    logger.info(f"Upload request from user {user_id}, filename: {file.filename}")

    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(
            status_code=400,
            detail="Only ZIP files are supported. Please upload a WHOOP export ZIP file."
        )

    is_mobile_client = is_mobile or is_mobile_user_agent(request.headers.get("user-agent"))

    upload_id = str(uuid.uuid4())
    progress_tracker.update(upload_id, 1, "Upload received", status="processing", stage="queued")

    try:
        zip_path = save_upload_file(user_id=user_id, upload_id=upload_id, file_obj=file.file)
        progress_tracker.update(upload_id, 10, "File persisted, starting ingestion...", status="processing", stage="saved")
    except Exception as exc:  # noqa: BLE001
        logger.error(f"Failed to persist upload {upload_id}: {exc}")
        progress_tracker.update(upload_id, 100, "Upload failed while saving file", status="failed", stage="failed")
        raise HTTPException(status_code=500, detail="Failed to persist uploaded file")

    thread = threading.Thread(
        target=_run_ingestion_background,
        args=(upload_id, user_id, zip_path, is_mobile_client),
        daemon=True,
    )
    thread.start()

    return UploadResponse(
        upload_id=upload_id,
        status=UploadStatus.PROCESSING,
        message="Upload queued. Subscribe to /whoop/upload/progress/{upload_id} for streaming updates.",
    )


@router.get("/whoop/upload/progress/{upload_id}")
async def stream_upload_progress(upload_id: str, request: Request):
    """
    Server-Sent Events stream to provide live ingestion progress.
    """
    if not progress_tracker.get(upload_id):
        progress_tracker.update(upload_id, 0, "Waiting to start...", status="processing", stage="queued")

    async def event_stream():
        last_version = -1
        while True:
            if await request.is_disconnected():
                break
            version = progress_tracker.version(upload_id)
            snapshot = progress_tracker.get(upload_id)
            if snapshot and version != last_version:
                yield f"data: {json.dumps(snapshot)}\n\n"
                last_version = version
                if snapshot.get("status") in ("completed", "failed"):
                    break
            await asyncio.sleep(0.4)

    return StreamingResponse(event_stream(), media_type="text/event-stream")
