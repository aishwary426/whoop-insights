from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.models.database import Base
from app.db_session import engine
from app.core_config import get_settings

settings = get_settings()

app = FastAPI(title="Whoop Insights Pro API", debug=settings.debug)

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)

@app.get("/healthz")
def health():
    return {"status": "ok"}
