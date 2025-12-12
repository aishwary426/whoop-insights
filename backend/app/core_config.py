from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, Field
from functools import lru_cache
from pathlib import Path
import os


def _is_cloud_platform():
    """Detect if running on a cloud platform (Vercel, Railway, Render)."""
    return bool(
        os.getenv("VERCEL") or 
        os.getenv("VERCEL_ENV") or 
        os.getenv("RAILWAY_ENVIRONMENT") or 
        os.getenv("RENDER") or 
        os.getenv("RENDER_SERVICE_NAME") or 
        os.getenv("RENDER_SERVICE_ID")
    )


def _get_default_database_url():
    """Get default database URL, preferring SQLite on serverless platforms."""
    import logging
    logger = logging.getLogger(__name__)

    # Check if we're on Vercel or similar serverless platform
    is_vercel = os.getenv("VERCEL") or os.getenv("VERCEL_ENV") or "/var/task" in os.getcwd()

    if is_vercel:
        logger.info("Detected Vercel environment, using SQLite in /tmp")
        return "sqlite:////tmp/whoop.db"

    # Check if DATABASE_URL is set
    db_url = os.getenv("DATABASE_URL", "")

    if db_url:
        # If PostgreSQL, verify psycopg2 is available
        if db_url.startswith("postgresql://") or db_url.startswith("postgres://"):
            try:
                import psycopg2  # noqa: F401
                logger.info("✅ PostgreSQL driver (psycopg2) is available")
                logger.info(f"Using configured DATABASE_URL: {db_url.split('@')[-1]}") # Log only host/db part for security
                return db_url
            except ImportError:
                logger.error("❌ PostgreSQL URL set but psycopg2 not installed - falling back to SQLite")
                # Use absolute path for local SQLite
                backend_dir = Path(__file__).parent.parent
                db_path = backend_dir / "whoop.db"
                return f"sqlite:///{str(db_path.absolute())}"
        
        logger.info(f"Using configured DATABASE_URL: {db_url}")
        return db_url

    # Default to SQLite for local development - use absolute path to avoid confusion
    logger.warning("⚠️  No DATABASE_URL set, using local SQLite. Data will NOT persist on Railway/Render!")
    # Get the backend directory (parent of app directory)
    backend_dir = Path(__file__).parent.parent
    db_path = backend_dir / "whoop.db"
    abs_path = str(db_path.absolute())
    logger.info(f"Using SQLite database at: {abs_path}")
    return f"sqlite:///{abs_path}"


class Settings(BaseSettings):
    # Database - defaults to SQLite for dev, easy to switch to Postgres
    # On Vercel/serverless, always use SQLite in /tmp since we don't have persistent storage
    # and PostgreSQL requires additional setup
    database_url: str = Field(default_factory=_get_default_database_url)
    
    @field_validator('database_url', mode='before')
    @classmethod
    def force_sqlite_on_vercel(cls, v):
        """Force SQLite on Vercel/serverless even if DATABASE_URL is set to PostgreSQL."""
        # Check if we're on Vercel or similar serverless platform
        is_vercel = os.getenv("VERCEL") or os.getenv("VERCEL_ENV") or "/var/task" in os.getcwd()
        
        if is_vercel:
            # On Vercel, always use SQLite in /tmp
            if not str(v).startswith("sqlite"):
                return "sqlite:////tmp/whoop.db"
        elif str(v).startswith(("postgresql://", "postgres://")):
            # Check if psycopg2 is available for PostgreSQL
            try:
                import psycopg2  # noqa: F401
            except ImportError:
                # PostgreSQL URL set but psycopg2 not installed - use SQLite
                # Use absolute path for local SQLite
                backend_dir = Path(__file__).parent.parent
                db_path = backend_dir / "whoop.db"
                return f"sqlite:///{db_path.absolute()}"
        
        return v
    
    # Redis (optional, for future task queues)
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Data directories
    # Use /tmp for cloud platforms (Vercel, Railway, Render) since local dirs may not be writable
    # These will be computed at runtime in __init__
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
    
    # Upload config
    keep_uploaded_files: bool = os.getenv("KEEP_UPLOADED_FILES", "True").lower() == "true"  # Keep uploaded ZIP files after processing
    
    # Admin config
    # Read from ADMIN_EMAILS environment variable (comma-separated) or use default
    admin_emails: list = ["ctaishwary@gmail.com"]  # Default admin email
    
    @field_validator('admin_emails', mode='before')
    @classmethod
    def parse_admin_emails(cls, v):
        """Parse admin emails from environment variable or use provided value."""
        # If it's already a list, return it
        if isinstance(v, list):
            return [email.strip().lower() for email in v]
        
        # Try to get from environment variable
        env_value = os.getenv("ADMIN_EMAILS")
        if env_value:
            # Split by comma and clean up
            emails = [email.strip().lower() for email in env_value.split(",") if email.strip()]
            return emails if emails else ["ctaishwary@gmail.com"]
        
        # Use default if provided value is not a list
        if isinstance(v, str):
            return [v.strip().lower()]
        
        return ["ctaishwary@gmail.com"]
    
    # Image upload config
    images_dir: str = "./data/images"
    
    # Logging
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Email configuration
    smtp_host: str = os.getenv("SMTP_HOST", "")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_user: str = os.getenv("SMTP_USER", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    smtp_from_email: str = os.getenv("SMTP_FROM_EMAIL", "noreply@whoop-insights.com")
    smtp_from_name: str = os.getenv("SMTP_FROM_NAME", "Whoop Insights")
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    enable_email_notifications: bool = os.getenv("ENABLE_EMAIL_NOTIFICATIONS", "True").lower() == "true"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        protected_namespaces=("settings_",),
        extra="ignore"
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        import logging
        logger = logging.getLogger(__name__)

        # Detect cloud platform and set directories accordingly
        is_cloud = _is_cloud_platform()
        is_render = bool(os.getenv("RENDER") or os.getenv("RENDER_SERVICE_NAME") or os.getenv("RENDER_SERVICE_ID"))
        is_vercel = bool(os.getenv("VERCEL") or os.getenv("VERCEL_ENV"))
        is_railway = bool(os.getenv("RAILWAY_ENVIRONMENT"))
        
        if is_cloud:
            # Override with /tmp paths for cloud platforms
            self.upload_dir = "/tmp/data/raw"
            self.processed_dir = "/tmp/data/processed"
            self.model_dir = "/tmp/data/models"
            self.images_dir = "/tmp/data/images"

        logger.info(f"Initializing settings with database: {self.database_url[:30]}...")
        logger.info(f"Upload directory: {self.upload_dir}")
        logger.info(f"Environment: VERCEL={os.getenv('VERCEL')}, RAILWAY={os.getenv('RAILWAY_ENVIRONMENT')}, RENDER={os.getenv('RENDER') or os.getenv('RENDER_SERVICE_NAME')}")
        logger.info(f"Cloud platform detected: Render={is_render}, Vercel={is_vercel}, Railway={is_railway}, Cloud={is_cloud}")

        # Ensure directories exist (with error handling for serverless)
        for dir_path in [self.upload_dir, self.processed_dir, self.model_dir, self.images_dir]:
            try:
                Path(dir_path).mkdir(parents=True, exist_ok=True)
                logger.info(f"Created directory: {dir_path}")
            except (OSError, PermissionError) as e:
                # On serverless, directories might be created on-demand
                # Log warning but don't fail initialization
                logger.warning(f"Could not create directory {dir_path}: {e}")


@lru_cache
def get_settings() -> Settings:
    return Settings()
