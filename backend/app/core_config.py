from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    database_url: str = "postgresql://user:password@localhost:5432/whoop_insights"
    redis_url: str = "redis://localhost:6379/0"

    upload_dir: str = "./data/raw"
    processed_dir: str = "./data/processed"
    model_dir: str = "./data/models"

    api_v1_prefix: str = "/api/v1"
    secret_key: str = "change-me"
    debug: bool = True

    model_version: str = "1.0.0"
    enable_forecasting: bool = True

    # 🔥 Fix protected namespace warning
    model_config = {
        "protected_namespaces": ("settings_",)
    }

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
