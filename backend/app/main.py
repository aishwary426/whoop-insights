import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core_config import get_settings
<<<<<<< HEAD
from app.utils.logger import setup_logging

# Initialize logging
setup_logging()

settings = get_settings()

app = FastAPI(
    title="Whoop Insights Pro API",
    description="AI-powered fitness analytics for WHOOP athletes",
    version="1.0.0",
    debug=settings.debug
)
=======
from app.db_session import engine
from app.models.database import Base

settings = get_settings()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)

app = FastAPI(title="Whoop Insights Pro API", debug=settings.debug)
>>>>>>> 57703a5 (Initial commit - Whoop Insights Pro)

# Create database tables
Base.metadata.create_all(bind=engine)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/healthz")
def health():
    """Health check endpoint."""
    return {"status": "ok", "version": "1.0.0"}
