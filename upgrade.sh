#!/bin/bash

echo ""
echo "========================================================="
echo "   🚀 Installing Complete WHOOP INSIGHTS PRO Backend     "
echo "========================================================="
echo ""

###############################################################################
# 0. Ensure backend folder exists
###############################################################################

mkdir -p backend
cd backend || exit 1

echo "📁 backend directory ready"

###############################################################################
# 1. Create directory structure
###############################################################################

echo "📁 Creating folder structure..."

mkdir -p app/{api,models,services,ml,utils,schemas}
mkdir -p app/api/v1/endpoints
mkdir -p app/services/{ingestion,analysis,predictions}
mkdir -p app/ml/{feature_engineering,models,forecasting}
mkdir -p data/{raw,processed,models}
mkdir -p tests

# __init__.py
find app -type d -exec sh -c 'touch "$1/__init__.py"' _ {} \;

echo "✅ Folder structure created"


###############################################################################
# 2. Create requirements.txt
###############################################################################

echo "📦 Creating requirements.txt..."

cat > requirements.txt << 'REQS'
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
pydantic==2.5.0
pydantic-settings==2.1.0

sqlalchemy==2.0.23
psycopg2-binary==2.9.9
alembic==1.13.0

redis==5.0.1
rq==1.15.1

pandas==2.1.3
numpy==1.26.2

scikit-learn==1.3.2
xgboost==2.0.3
lightgbm==4.1.0
prophet==1.1.5
statsmodels==0.14.0

python-dotenv==1.0.0
pytz==2023.3
zipfile36==0.1.3

pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
REQS

echo "✅ requirements.txt created"


###############################################################################
# 3. .env.example
###############################################################################

echo "🔑 Creating env example..."

cat > .env.example << 'ENV'
DATABASE_URL=postgresql://user:password@localhost:5432/whoop_insights

REDIS_URL=redis://localhost:6379/0

UPLOAD_DIR=./data/raw
PROCESSED_DIR=./data/processed
MODEL_DIR=./data/models

API_V1_PREFIX=/api/v1
SECRET_KEY=dev-secret-key
DEBUG=True

MODEL_VERSION=1.0.0
ENABLE_FORECASTING=True
ENV

echo "✅ .env.example created"


###############################################################################
# 4. core_config.py
###############################################################################

echo "⚙️ Creating core_config..."

cat > app/core_config.py << 'CORECFG'
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

    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache
def get_settings() -> Settings:
    return Settings()
CORECFG

echo "✅ core_config.py created"


###############################################################################
# 5. db_session.py
###############################################################################

echo "🗄 Creating DB session..."

cat > app/db_session.py << 'DBSESSION'
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager

from app.core_config import get_settings

settings = get_settings()

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
DBSESSION

echo "✅ db_session.py created"


###############################################################################
# 6. Database Models
###############################################################################

echo "📘 Creating database models..."

cat > app/models/database.py << 'DBMODELS'
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, JSON, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import enum

Base = declarative_base()

class UploadStatus(str, enum.Enum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class IntensityLevel(str, enum.Enum):
    REST = "rest"
    LIGHT = "light"
    MODERATE = "moderate"
    HIGH = "high"

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    email = Column(String, unique=True)
    name = Column(String)
    goal = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    uploads = relationship("Upload", back_populates="user")
    daily_metrics = relationship("DailyMetrics", back_populates="user")
    workouts = relationship("Workout", back_populates="user")

class Upload(Base):
    __tablename__ = "uploads"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    file_path = Column(String)
    status = Column(Enum(UploadStatus))
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    error_message = Column(Text)

    user = relationship("User", back_populates="uploads")

class DailyMetrics(Base):
    __tablename__ = "daily_metrics"

    id = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    date = Column(Date)

    recovery_score = Column(Float)
    strain_score = Column(Float)
    sleep_hours = Column(Float)
    hrv = Column(Float)
    resting_hr = Column(Float)
    workouts_count = Column(Integer)

    strain_baseline_7d = Column(Float)
    strain_baseline_30d = Column(Float)
    acute_chronic_ratio = Column(Float)

    extra = Column(JSON)

    user = relationship("User", back_populates="daily_metrics")

class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    workout_id = Column(String)
    date = Column(Date)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    duration_minutes = Column(Float)
    sport_type = Column(String)
    avg_hr = Column(Float)
    max_hr = Column(Float)
    strain = Column(Float)
    calories = Column(Float)
    tags = Column(JSON)

    user = relationship("User", back_populates="workouts")

class PredictionRun(Base):
    __tablename__ = "prediction_runs"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    upload_id = Column(String)
    model_version = Column(String)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class DailyPrediction(Base):
    __tablename__ = "daily_predictions"

    id = Column(Integer, primary_key=True)
    user_id = Column(String)
    date = Column(Date)
    prediction_run_id = Column(String)

    intensity_level = Column(Enum(IntensityLevel))
    focus_recommendation = Column(String)
    notes = Column(Text)
    predicted_recovery_tomorrow = Column(Float)
    burnout_risk_score = Column(Float)
    sleep_health_score = Column(Float)
DBMODELS

echo "✅ database models created"


###############################################################################
# 7. Schemas
###############################################################################

echo "📄 Creating Pydantic schemas..."

cat > app/schemas/api.py << 'SCHEMAS'
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from enum import Enum

class UploadStatus(str, Enum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class IntensityLevel(str, Enum):
    REST = "rest"
    LIGHT = "light"
    MODERATE = "moderate"
    HIGH = "high"

class UploadResponse(BaseModel):
    upload_id: str
    status: UploadStatus
    message: str

class TodayMetrics(BaseModel):
    date: date
    recovery_score: Optional[float]
    strain_score: Optional[float]
    sleep_hours: Optional[float]
    hrv: Optional[float]
    workouts_count: int

class TodayRecommendation(BaseModel):
    intensity_level: IntensityLevel
    focus: str
    workout_type: str
    notes: str

class TomorrowPrediction(BaseModel):
    recovery_forecast: float
    confidence: float

class HealthScores(BaseModel):
    consistency: float
    burnout_risk: float
    sleep_health: float

class DashboardSummary(BaseModel):
    today: TodayMetrics
    recommendation: TodayRecommendation
    tomorrow: TomorrowPrediction
    scores: HealthScores
SCHEMAS

echo "✅ schemas created"


###############################################################################
# 8. ZIP Ingestion
###############################################################################

echo "📦 Creating ZIP ingestion services..."

cat > app/utils/zip_utils.py << 'ZIPUTILS'
import os
import zipfile
from pathlib import Path

from app.core_config import get_settings

settings = get_settings()

def save_upload_file(user_id: str, upload_id: str, file_obj) -> str:
    folder = Path(settings.upload_dir) / user_id / upload_id
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / "whoop_export.zip"

    with open(path, "wb") as f:
        while True:
            chunk = file_obj.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)

    return str(path)

def unzip_whoop_export(path: str) -> str:
    extract_dir = str(Path(path).parent / "unzipped")
    os.makedirs(extract_dir, exist_ok=True)

    with zipfile.ZipFile(path, "r") as z:
        z.extractall(extract_dir)

    return extract_dir
ZIPUTILS

echo "✅ ZIP utils created"


###############################################################################
# 9. Ingestion Service
###############################################################################

echo "📥 Writing ingestion service..."

cat > app/services/ingestion/whoop_ingestion.py << 'INGEST'
import uuid
from datetime import datetime
import pandas as pd
from sqlalchemy.orm import Session

from app.models.database import Upload, UploadStatus, User, Workout, DailyMetrics
from app.utils.zip_utils import save_upload_file, unzip_whoop_export

def ensure_user(db: Session, user_id: str, email=None, name=None):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(id=user_id, email=email or f"{user_id}@auto.com", name=name)
        db.add(user)
        db.commit()
    return user

def ingest_whoop_zip(db: Session, user_id: str, file_obj):
    ensure_user(db, user_id)

    upload_id = str(uuid.uuid4())
    zip_path = save_upload_file(user_id=user_id, upload_id=upload_id, file_obj=file_obj)

    upload = Upload(
        id=upload_id,
        user_id=user_id,
        file_path=zip_path,
        status=UploadStatus.PROCESSING,
        created_at=datetime.utcnow(),
    )
    db.add(upload)
    db.commit()

    try:
        extracted = unzip_whoop_export(zip_path)

        # Minimal parser: only workouts.csv
        workouts = []
        for root, _, files in os.walk(extracted):
            for f in files:
                if "workout" in f.lower() and f.endswith(".csv"):
                    df = pd.read_csv(f"{root}/{f}")
                    df.columns = [c.lower().strip().replace(" ", "_") for c in df.columns]

                    for _, row in df.iterrows():
                        w = Workout(
                            user_id=user_id,
                            workout_id=str(uuid.uuid4()),
                            date=pd.to_datetime(row.get("date", datetime.utcnow())).date(),
                            duration_minutes=float(row.get("duration", 0)),
                            sport_type=row.get("sport", "unknown"),
                            avg_hr=float(row.get("avg_hr", 0)),
                            strain=float(row.get("strain", 0)),
                        )
                        db.add(w)
                    db.commit()

        # Create daily rows
        dates = (
            db.query(Workout.date)
            .filter(Workout.user_id == user_id)
            .distinct()
            .all()
        )

        for (d,) in dates:
            dm = DailyMetrics(
                user_id=user_id,
                date=d,
                workouts_count=db.query(Workout).filter(Workout.user_id==user_id, Workout.date==d).count(),
                strain_score=sum([s[0] for s in db.query(Workout.strain).filter(Workout.user_id==user_id, Workout.date==d).all()])
            )
            db.add(dm)
        db.commit()

        upload.status = UploadStatus.COMPLETED
        upload.completed_at = datetime.utcnow()
        db.commit()

    except Exception as e:
        upload.status = UploadStatus.FAILED
        upload.error_message = str(e)
        db.commit()
        raise

    return upload
INGEST

echo "✅ ingestion service created"


###############################################################################
# 10. Feature Engineering
###############################################################################

echo "🧠 Creating feature engineering..."

cat > app/ml/feature_engineering/daily_features.py << 'FEATS'
from sqlalchemy.orm import Session
from app.models.database import DailyMetrics, Workout

def recompute_daily_features(db: Session, user_id: str):
    rows = (
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .order_by(DailyMetrics.date.asc())
        .all()
    )

    for i, dm in enumerate(rows):
        workouts = db.query(Workout).filter(Workout.user_id == user_id, Workout.date==dm.date).all()
        dm.workouts_count = len(workouts)
        dm.strain_score = sum(w.strain or 0 for w in workouts)

    db.commit()
FEATS

echo "✅ feature engineering created"


###############################################################################
# 11. Rule-Based Model
###############################################################################

echo "🤖 Creating rule-based recommender..."

cat > app/ml/models/rule_based_recommender.py << 'RULES'
from app.models.database import IntensityLevel, DailyMetrics

def recommend(dm: DailyMetrics):
    strain = dm.strain_score or 0
    if strain < 5:
        return IntensityLevel.LIGHT, "mobility", "Light walk", "Low strain day."
    elif strain < 10:
        return IntensityLevel.MODERATE, "endurance", "Zone 2 cardio", "Good window for moderate work."
    else:
        return IntensityLevel.HIGH, "strength", "Intervals / heavy strength", "High strain window."
RULES

echo "✅ recommender created"


###############################################################################
# 12. ML Trainer
###############################################################################

echo "🧬 Creating ML trainer..."

cat > app/ml/models/trainer.py << 'TRAIN'
import os
import uuid
import pandas as pd
from sqlalchemy.orm import Session
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
import joblib

from app.models.database import DailyMetrics
from app.core_config import get_settings

settings = get_settings()

def load_df(db: Session, user_id: str):
    rows = (
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .order_by(DailyMetrics.date.asc())
        .all()
    )
    if not rows:
        return pd.DataFrame()

    data = []
    for r in rows:
        data.append({
            "date": r.date,
            "recovery": r.recovery_score,
            "strain": r.strain_score,
            "sleep": r.sleep_hours,
            "hrv": r.hrv,
            "acr": r.acute_chronic_ratio,
        })

    df = pd.DataFrame(data)
    df = df.sort_values("date")
    df["target_recovery"] = df["recovery"].shift(-1)
    df["target_class"] = pd.cut(
        df["recovery"],
        bins=[0, 30, 60, 100],
        labels=[0, 1, 2],
        include_lowest=True,
    )
    df = df.dropna()
    return df

def train_user_models(db: Session, user_id: str):
    df = load_df(db, user_id)
    if df.empty:
        return None

    run_id = str(uuid.uuid4())
    os.makedirs(f"{settings.model_dir}/{user_id}", exist_ok=True)

    X = df[["strain", "sleep", "hrv", "acr"]]
    y_rec = df["target_recovery"]
    y_cls = df["target_class"]

    rec_model = RandomForestRegressor(n_estimators=200)
    rec_model.fit(X, y_rec)

    cls_model = RandomForestClassifier(n_estimators=200)
    cls_model.fit(X, y_cls)

    rec_path = f"{settings.model_dir}/{user_id}/rec_{run_id}.joblib"
    cls_path = f"{settings.model_dir}/{user_id}/cls_{run_id}.joblib"

    joblib.dump(rec_model, rec_path)
    joblib.dump(cls_model, cls_path)

    return {"run_id": run_id, "rec_path": rec_path, "cls_path": cls_path}
TRAIN

echo "✅ trainer created"


###############################################################################
# 13. Model Loader
###############################################################################

echo "📥 Creating model loader..."

cat > app/ml/models/model_loader.py << 'LOADER'
import os
import joblib
from app.core_config import get_settings

settings = get_settings()

def load_model(user_id: str, prefix: str):
    folder = f"{settings.model_dir}/{user_id}"
    if not os.path.exists(folder):
        return None
    files = [f for f in os.listdir(folder) if f.startswith(prefix)]
    if not files:
        return None
    latest = sorted(files)[-1]
    return joblib.load(f"{folder}/{latest}")
LOADER

echo "✅ model_loader created"


###############################################################################
# 14. Dashboard Service
###############################################################################

echo "📊 Creating dashboard service..."

cat > app/services/analysis/dashboard_service.py << 'DASH'
from datetime import date
from sqlalchemy.orm import Session

from app.models.database import DailyMetrics
from app.schemas.api import (
    DashboardSummary,
    TodayMetrics,
    TodayRecommendation,
    TomorrowPrediction,
    HealthScores,
)
from app.ml.models.rule_based_recommender import recommend
from app.ml.models.model_loader import load_model
import numpy as np

def build_dashboard(db: Session, user_id: str):
    dm = (
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .order_by(DailyMetrics.date.desc())
        .first()
    )
    if not dm:
        return DashboardSummary(
            today=TodayMetrics(
                date=date.today(), recovery_score=None, strain_score=None,
                sleep_hours=None, hrv=None, workouts_count=0
            ),
            recommendation=TodayRecommendation(
                intensity_level="LIGHT", focus="general",
                workout_type="Walk", notes="No data yet."
            ),
            tomorrow=TomorrowPrediction(recovery_forecast=50, confidence=0.3),
            scores=HealthScores(consistency=0, burnout_risk=0, sleep_health=0),
        )

    today = TodayMetrics(
        date=dm.date,
        recovery_score=dm.recovery_score,
        strain_score=dm.strain_score,
        sleep_hours=dm.sleep_hours,
        hrv=dm.hrv,
        workouts_count=dm.workouts_count or 0,
    )

    # Rule pick
    intensity, focus, wtype, notes = recommend(dm)

    rec_model = load_model(user_id, "rec_")
    pred_val = 60
    conf = 0.4
    if rec_model:
        X = np.array([[dm.strain_score, dm.sleep_hours, dm.hrv, dm.acute_chronic_ratio]])
        pred_val = float(rec_model.predict(X)[0])
        conf = 0.8

    tomorrow = TomorrowPrediction(
        recovery_forecast=pred_val,
        confidence=conf,
    )

    scores = HealthScores(
        consistency=60,
        burnout_risk=40,
        sleep_health=70,
    )

    return DashboardSummary(
        today=today,
        recommendation=TodayRecommendation(
            intensity_level=intensity,
            focus=focus,
            workout_type=wtype,
            notes=notes,
        ),
        tomorrow=tomorrow,
        scores=scores,
    )
DASH

echo "✅ dashboard service created"


###############################################################################
# 15. Upload Endpoint
###############################################################################

echo "📨 Creating upload endpoint..."

cat > app/api/v1/endpoints/upload.py << 'UPLOAD'
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db_session import get_db
from app.services.ingestion.whoop_ingestion import ingest_whoop_zip
from app.schemas.api import UploadResponse, UploadStatus

router = APIRouter(tags=["upload"])

@router.post("/whoop/upload", response_model=UploadResponse)
def upload(user_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(400, "Only ZIP supported")

    up = ingest_whoop_zip(db, user_id, file.file)

    return UploadResponse(
        upload_id=up.id,
        status=UploadStatus(up.status.value),
        message="Upload processed"
    )
UPLOAD

echo "✅ upload endpoint created"


###############################################################################
# 16. Dashboard Endpoint
###############################################################################

echo "📊 Creating dashboard endpoint..."

cat > app/api/v1/endpoints/dashboard.py << 'DASHAPI'
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db_session import get_db
from app.services.analysis.dashboard_service import build_dashboard
from app.schemas.api import DashboardSummary

router = APIRouter(tags=["dashboard"])

@router.get("/dashboard/summary", response_model=DashboardSummary)
def summary(user_id: str, db: Session = Depends(get_db)):
    return build_dashboard(db, user_id)
DASHAPI

echo "✅ dashboard endpoint created"


###############################################################################
# 17. Train Endpoint
###############################################################################

echo "🎓 Creating train endpoint..."

cat > app/api/v1/endpoints/train.py << 'TRAINEND'
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db_session import get_db
from app.ml.models.trainer import train_user_models

router = APIRouter(tags=["train"])

@router.post("/train")
def train(user_id: str, db: Session = Depends(get_db)):
    res = train_user_models(db, user_id)
    if not res:
        return {"status": "not_enough_data"}
    return res
TRAINEND

echo "✅ train endpoint created"


###############################################################################
# 18. API Router
###############################################################################

echo "🧩 Creating API router..."

cat > app/api/v1/router.py << 'ROUTER'
from fastapi import APIRouter
from app.api.v1.endpoints import upload, dashboard, train

api_router = APIRouter()
api_router.include_router(upload.router)
api_router.include_router(dashboard.router)
api_router.include_router(train.router)
ROUTER

echo "✅ API router created"


###############################################################################
# 19. FastAPI main.py
###############################################################################

echo "🚀 Creating main FastAPI app..."

cat > app/main.py << 'MAIN'
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
MAIN

echo "✅ main app created"


###############################################################################
# FINAL MESSAGE
###############################################################################

echo ""
echo "========================================================="
echo "   🎉 Backend Installation Complete!"
echo "========================================================="
echo ""
echo "Next steps:"
echo "1. cd backend"
echo "2. python -m venv venv && source venv/bin/activate"
echo "3. pip install -r requirements.txt"
echo "4. uvicorn app.main:app --reload"
echo ""
echo "API routes available:"
echo "  POST /api/v1/whoop/upload"
echo "  POST /api/v1/train"
echo "  GET  /api/v1/dashboard/summary"
echo "  GET  /healthz"
echo ""
