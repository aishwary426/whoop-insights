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
