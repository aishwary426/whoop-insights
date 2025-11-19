import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core_config import get_settings
from app.utils.logger import setup_logging
from app.db_session import engine
from app.models.database import Base

# Initialize logging
setup_logging()

settings = get_settings()

app = FastAPI(
    title="Whoop Insights Pro API",
    description="AI-powered fitness analytics for WHOOP athletes",
    version="1.0.0",
    debug=settings.debug
)

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
