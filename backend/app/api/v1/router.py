from fastapi import APIRouter
from app.api.v1.endpoints import upload, dashboard, train

api_router = APIRouter()
api_router.include_router(upload.router)
api_router.include_router(dashboard.router)
api_router.include_router(train.router)
