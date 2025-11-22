import threading
from datetime import datetime
from typing import Dict, Optional


class ProgressTracker:
    """
    Lightweight in-memory progress tracker for streaming upload/training updates.
    Uses simple version counters so SSE listeners can poll efficiently without locks.
    """

    def __init__(self):
        self._states: Dict[str, Dict] = {}
        self._versions: Dict[str, int] = {}
        self._lock = threading.Lock()

    def _bump_version(self, upload_id: str) -> int:
        with self._lock:
            next_version = self._versions.get(upload_id, 0) + 1
            self._versions[upload_id] = next_version
            return next_version

    def update(
        self,
        upload_id: str,
        progress: int,
        message: str,
        status: str = "processing",
        stage: Optional[str] = None,
    ) -> Dict:
        """
        Store the latest progress snapshot for an upload.
        """
        version = self._bump_version(upload_id)
        payload = {
            "upload_id": upload_id,
            "progress": int(progress),
            "message": message,
            "status": status,
            "stage": stage or "processing",
            "version": version,
            "timestamp": datetime.utcnow().isoformat(),
        }
        with self._lock:
            self._states[upload_id] = payload
        return payload

    def get(self, upload_id: str) -> Optional[Dict]:
        with self._lock:
            return self._states.get(upload_id)

    def version(self, upload_id: str) -> int:
        with self._lock:
            return self._versions.get(upload_id, 0)


progress_tracker = ProgressTracker()
