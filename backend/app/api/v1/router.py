from fastapi import APIRouter
from app.api.v1.endpoints import upload, dashboard, blog, newsletter, images, admin, zenith, users, whoop, food, meals, webhook

api_router = APIRouter()
api_router.include_router(upload.router)
api_router.include_router(dashboard.router)
api_router.include_router(blog.router)
api_router.include_router(newsletter.router)
api_router.include_router(images.router)
api_router.include_router(admin.router)
api_router.include_router(zenith.router)
api_router.include_router(users.router)
api_router.include_router(whoop.router, prefix="/whoop", tags=["whoop"])
api_router.include_router(food.router, prefix="/food", tags=["food"])
api_router.include_router(meals.router, prefix="/meals", tags=["meals"])
api_router.include_router(webhook.router, prefix="/webhook", tags=["webhook"])
