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
