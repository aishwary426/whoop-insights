from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.engine import Engine
from typing import Generator
import logging

from app.core_config import get_settings

logger = logging.getLogger(__name__)

# Get settings with error handling
try:
    settings = get_settings()
except Exception as e:
    logger.error(f"Failed to get settings: {e}")
    # Use minimal defaults
    from app.core_config import Settings
    settings = Settings()

# Create database engine with error handling
try:
    if settings.database_url.startswith("sqlite"):
        # Enable foreign keys for SQLite
        engine = create_engine(
            settings.database_url,
            connect_args={"check_same_thread": False},  # Needed for SQLite
            pool_pre_ping=True,
            echo=settings.debug,  # Log SQL queries in debug mode
        )
        
        @event.listens_for(Engine, "connect")
        def set_sqlite_pragma(dbapi_conn, connection_record):
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
    else:
        # PostgreSQL or other databases
        engine = create_engine(
            settings.database_url,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
            echo=settings.debug,
        )
    logger.info(f"Database engine created successfully: {settings.database_url}")
except Exception as e:
    logger.error(f"Failed to create database engine: {e}")
    # Create a minimal in-memory SQLite engine as fallback
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    logger.warning("Using in-memory SQLite database as fallback")

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency for database sessions.
    Usage:
        @router.get("/endpoint")
        def endpoint(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()
