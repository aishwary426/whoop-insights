from datetime import date
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class APIBase(BaseModel):
    model_config = ConfigDict(extra="ignore", protected_namespaces=())


class UploadStatus(str, Enum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class IntensityLevel(str, Enum):
    REST = "rest"
    LIGHT = "light"
    MODERATE = "moderate"
    HIGH = "high"


class UploadResponse(APIBase):
    upload_id: str
    status: UploadStatus
    message: str


class TodayMetrics(APIBase):
    date: date
    recovery_score: Optional[float] = None
    strain_score: Optional[float] = None
    sleep_hours: Optional[float] = None
    hrv: Optional[float] = None
    resting_hr: Optional[float] = None
    workouts_count: int = 0


class TodayRecommendation(APIBase):
    intensity_level: IntensityLevel
    focus: str
    workout_type: str
    notes: str
<<<<<<< HEAD
    optimal_time: Optional[str] = None
=======
    optimal_time: str
>>>>>>> 57703a5 (Initial commit - Whoop Insights Pro)


class TomorrowPrediction(APIBase):
    recovery_forecast: Optional[float] = None
    confidence: float = 0.0


class HealthScores(APIBase):
    consistency: float
    burnout_risk: float
    sleep_health: float
    injury_risk: float


class DashboardSummary(APIBase):
    today: TodayMetrics
    recommendation: TodayRecommendation
    tomorrow: TomorrowPrediction
    scores: HealthScores
<<<<<<< HEAD
    risk_flags: List[str] = []


# Additional schemas for trends and insights
class TrendPoint(BaseModel):
    date: date
    value: Optional[float]

class TrendsResponse(BaseModel):
=======
    risk_flags: List[str] = Field(default_factory=list)


class TrainingSummary(APIBase):
    status: str
    model_version: Optional[str] = None
    trained_models: List[str] = Field(default_factory=list)
    days_used: int = 0
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    message: Optional[str] = None


class TrendPoint(APIBase):
    date: date
    value: Optional[float]


class TrendsSeries(APIBase):
>>>>>>> 57703a5 (Initial commit - Whoop Insights Pro)
    recovery: List[TrendPoint]
    strain: List[TrendPoint]
    sleep: List[TrendPoint]
    hrv: List[TrendPoint]


<<<<<<< HEAD
class InsightItem(BaseModel):
    id: int
=======
class TrendsResponse(APIBase):
    user_id: str
    series: TrendsSeries


class InsightItem(APIBase):
>>>>>>> 57703a5 (Initial commit - Whoop Insights Pro)
    insight_type: str
    title: str
    description: str
    confidence: float
    period_start: Optional[date] = None
    period_end: Optional[date] = None
<<<<<<< HEAD
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
=======
    data: dict | None = None


class InsightsFeed(APIBase):
    user_id: str
    insights: List[InsightItem]


class APIMessage(APIBase):
    detail: str
>>>>>>> 57703a5 (Initial commit - Whoop Insights Pro)
