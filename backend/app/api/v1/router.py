from fastapi import APIRouter
from app.api.v1.endpoints import upload, dashboard, blog, newsletter, images

api_router = APIRouter()
api_router.include_router(upload.router)
api_router.include_router(dashboard.router)
api_router.include_router(blog.router)
api_router.include_router(newsletter.router)
api_router.include_router(images.router)
