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
    optimal_time: Optional[str] = None

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
    risk_flags: List[str] = []


# Additional schemas for trends and insights
class TrendPoint(BaseModel):
    date: date
    value: Optional[float]

class TrendsResponse(BaseModel):
    recovery: List[TrendPoint]
    strain: List[TrendPoint]
    sleep: List[TrendPoint]
    hrv: List[TrendPoint]


class InsightItem(BaseModel):
    id: int
    insight_type: str
    title: str
    description: str
    confidence: float
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    data: Optional[dict] = None

class InsightsFeed(BaseModel):
    insights: List[InsightItem]


class TrainingSummary(BaseModel):
    status: str
    model_version: Optional[str] = None
    run_id: Optional[str] = None
    trained_models: List[str] = []
    metrics: dict = {}
    data_summary: dict = {}
