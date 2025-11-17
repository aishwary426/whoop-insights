from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from pathlib import Path
import os


class Settings(BaseSettings):
    # Database - defaults to SQLite for dev, easy to switch to Postgres
    database_url: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./whoop.db"
    )
    
    # Redis (optional, for future task queues)
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Data directories
    upload_dir: str = "./data/raw"
    processed_dir: str = "./data/processed"
    model_dir: str = "./data/models"

    # API config
    api_v1_prefix: str = "/api/v1"
    secret_key: str = os.getenv("SECRET_KEY", "change-me-in-production")
    debug: bool = os.getenv("DEBUG", "True").lower() == "true"

    # ML config
    model_version: str = "1.0.0"
    enable_forecasting: bool = True
    min_days_for_training: int = 14  # Minimum days needed to train models
    
    # Logging
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        protected_namespaces=("settings_",),
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Ensure directories exist
        for dir_path in [self.upload_dir, self.processed_dir, self.model_dir]:
            Path(dir_path).mkdir(parents=True, exist_ok=True)


@lru_cache
def get_settings() -> Settings:
    return Settings()
