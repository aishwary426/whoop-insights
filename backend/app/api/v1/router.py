from fastapi import APIRouter
from app.api.v1.endpoints import upload, dashboard

api_router = APIRouter()
api_router.include_router(upload.router)
api_router.include_router(dashboard.router)
