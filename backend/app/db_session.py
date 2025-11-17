<<<<<<< HEAD
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.engine import Engine
from typing import Generator
import logging
=======
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from typing import Generator
>>>>>>> 57703a5 (Initial commit - Whoop Insights Pro)

from app.core_config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

<<<<<<< HEAD
# SQLite-specific optimizations
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

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency for database sessions.
    Usage:
        @router.get("/endpoint")
        def endpoint(db: Session = Depends(get_db)):
            ...
    """
=======
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db() -> Generator:
    """FastAPI dependency for DB sessions."""
>>>>>>> 57703a5 (Initial commit - Whoop Insights Pro)
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()
