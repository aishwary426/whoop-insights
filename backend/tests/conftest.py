import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.database import Base


@pytest.fixture
def temp_dirs(tmp_path, monkeypatch):
    raw = tmp_path / "raw"
    processed = tmp_path / "processed"
    models = tmp_path / "models"
    for d in (raw, processed, models):
        d.mkdir(parents=True, exist_ok=True)

    from app.core_config import get_settings
    settings = get_settings()
    # Override runtime paths for tests only
    settings.upload_dir = str(raw)
    settings.processed_dir = str(processed)
    settings.model_dir = str(models)

    from app.utils import zip_utils
    zip_utils.settings.upload_dir = str(raw)
    zip_utils.settings.processed_dir = str(processed)
    zip_utils.settings.model_dir = str(models)

    return settings


@pytest.fixture
def db_session(tmp_path):
    engine = create_engine(
        f"sqlite:///{tmp_path/'test.db'}",
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
