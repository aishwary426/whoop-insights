import logging
import sys
import os
from pathlib import Path
from app.core_config import get_settings

settings = get_settings()


def setup_logging():
    """
    Configure application-wide logging.
    On Vercel/serverless, only use stdout (logs are captured by platform).
    On local/dev, also write to file.
    """
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"
    
    # Check if we're on Vercel or similar serverless platform
    is_vercel = os.getenv("VERCEL") or os.getenv("VERCEL_ENV") or "/var/task" in os.getcwd()
    
    handlers = [logging.StreamHandler(sys.stdout)]
    
    # Only add file handler if not on Vercel (filesystem is read-only except /tmp)
    if not is_vercel:
        try:
            # Create logs directory if it doesn't exist
            log_dir = Path("./logs")
            log_dir.mkdir(exist_ok=True)
            handlers.append(logging.FileHandler(log_dir / "app.log"))
        except (OSError, PermissionError):
            # If we can't create logs directory, just use stdout
            pass
    else:
        # On Vercel, try to use /tmp if we really need file logging
        # But usually stdout is sufficient as Vercel captures it
        try:
            log_dir = Path("/tmp/logs")
            log_dir.mkdir(exist_ok=True)
            handlers.append(logging.FileHandler(log_dir / "app.log"))
        except (OSError, PermissionError):
            # If /tmp also fails, just use stdout (which is fine for Vercel)
            pass
    
    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
        format=log_format,
        datefmt=date_format,
        handlers=handlers,
    )
    
    # Set specific loggers - ALWAYS use WARNING for SQLAlchemy to avoid log spam
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)  # Reduce log spam
    
    return logging.getLogger(__name__)


logger = setup_logging()

