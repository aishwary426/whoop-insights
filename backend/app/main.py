import logging
import os

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.exceptions import HTTPException as FastAPIHTTPException

from app.api.v1.router import api_router
from app.core_config import get_settings
from app.utils.logger import setup_logging
from app.db_session import engine
from app.models.database import Base, AdminEmail  # Import AdminEmail to register it

# Initialize logging (with error handling)
try:
    setup_logging()
    logger = logging.getLogger(__name__)
except Exception as e:
    # Fallback to basic logging if setup fails
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    logger.error(f"Failed to setup logging: {e}")

# Get settings (with error handling)
try:
    settings = get_settings()
except Exception as e:
    logger.error(f"Failed to get settings: {e}")
    # Use minimal defaults
    from app.core_config import Settings
    settings = Settings()

app = FastAPI(
    title="Data insights API",
    description="AI-powered fitness analytics for WHOOP athletes",
    version="1.0.0",
    debug=settings.debug
)

@app.on_event("startup")
async def startup_event():
    """Log critical startup information for debugging."""
    logger.info("=" * 60)
    logger.info("Data insights API Starting Up")
    logger.info("=" * 60)
    logger.info(f"Database URL: {settings.database_url[:30]}...")
    logger.info(f"Upload Directory: {settings.upload_dir}")
    logger.info(f"Debug Mode: {settings.debug}")
    logger.info(f"Environment Variables:")
    logger.info(f"  - VERCEL: {os.getenv('VERCEL')}")
    logger.info(f"  - RAILWAY_ENVIRONMENT: {os.getenv('RAILWAY_ENVIRONMENT')}")
    logger.info(f"  - RENDER: {os.getenv('RENDER')}")
    logger.info(f"  - RENDER_SERVICE_NAME: {os.getenv('RENDER_SERVICE_NAME')}")
    logger.info(f"  - RENDER_SERVICE_ID: {os.getenv('RENDER_SERVICE_ID')}")
    logger.info(f"  - DATABASE_URL: {'Set' if os.getenv('DATABASE_URL') else 'Not Set'}")
    logger.info(f"  - GROQ_API_KEY: {'Set' if os.getenv('GROQ_API_KEY') else 'NOT SET - Food analysis will fail!'}")
    logger.info(f"  - GOOGLE_API_KEY: {'Set' if os.getenv('GOOGLE_API_KEY') else 'Not Set'}")
    logger.info("=" * 60)
    
    # Test food analysis service initialization
    try:
        from app.services.analysis.food_analysis import food_analysis_service
        logger.info(f"Food Analysis Service initialized. Client available: {food_analysis_service.client is not None}")
        print(f"[STARTUP] Food Analysis Service OK. Groq client: {food_analysis_service.client is not None}")
    except Exception as e:
        logger.error(f"Failed to initialize Food Analysis Service: {e}")
        print(f"[STARTUP ERROR] Food Analysis Service failed: {e}")

# Create database tables (with error handling for serverless environments)
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully")
except Exception as e:
    logger.error(f"Failed to create database tables: {e}")
    # Don't fail completely - tables might already exist or be created on first use
    # This is especially important for serverless where the filesystem might be read-only initially

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log incoming requests (reduced verbosity to avoid Railway rate limits)."""
    # Only log the path, not full headers to reduce log volume
    logger.info(f"Request: {request.method} {request.url.path}")
    response = await call_next(request)
    return response

# Exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors."""
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": exc.errors(),
            "message": "Invalid request format. Please ensure you're sending a valid ZIP file with user_id."
        }
    )

# Exception handler for HTTP exceptions
@app.exception_handler(FastAPIHTTPException)
async def http_exception_handler(request: Request, exc: FastAPIHTTPException):
    """Handle HTTP exceptions to ensure proper JSON format."""
    logger.error(f"HTTP exception: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail if exc.detail else "An error occurred"
        }
    )

# Global exception handler for unhandled errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch any unhandled exceptions and return proper JSON response."""
    logger.exception(f"Unhandled exception: {exc}", exc_info=exc)
    error_type = type(exc).__name__
    error_msg = str(exc)
    
    # Always include error details for better debugging, but sanitize in production
    if settings.debug:
        detail = f"Internal server error ({error_type}): {error_msg}"
    else:
        # In production, still include error type and a sanitized message
        # This helps with debugging without exposing sensitive info
        detail = f"Internal server error: {error_type}"
        if error_msg and len(error_msg) < 200:  # Only include short, safe messages
            detail = f"Internal server error: {error_msg[:200]}"
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": detail
        }
    )

# Include API router
# Include API router with prefix (standard)
app.include_router(api_router, prefix=settings.api_v1_prefix)

# Include API router WITHOUT prefix (fallback for Vercel/Mangum stripping)
# This ensures /whoop/ingest works even if /api/v1 is stripped
app.include_router(api_router, prefix="")




@app.get("/healthz")
def healthz():
    """Health check endpoint."""
    return {"status": "ok", "version": "1.0.0"}

@app.get("/health")
def health():
    """Health check alias."""
    return {"status": "ok", "version": "1.0.0"}
