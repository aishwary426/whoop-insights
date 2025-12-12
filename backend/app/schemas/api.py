from datetime import date, datetime
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
    rem_sleep_min: Optional[float] = None
    deep_sleep_min: Optional[float] = None
    light_sleep_min: Optional[float] = None
    awake_time_min: Optional[float] = None
    sleep_efficiency: Optional[float] = None
    sleep_performance_percentage: Optional[float] = None
    respiratory_rate: Optional[float] = None
    spo2_percentage: Optional[float] = None
    skin_temp_celsius: Optional[float] = None
    avg_heart_rate: Optional[float] = None
    max_heart_rate: Optional[float] = None
    calories: Optional[float] = None


class TodayRecommendation(APIBase):
    intensity_level: IntensityLevel
    focus: str
    workout_type: str
    notes: str
    optimal_time: Optional[str] = None
    calories: Optional[int] = None


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
    risk_flags: List[str] = []


# Additional schemas for trends and insights
class TrendPoint(BaseModel):
    date: date
    value: Optional[float]


class TrendsSeries(BaseModel):
    recovery: List[TrendPoint]
    strain: List[TrendPoint]
    sleep: List[TrendPoint]
    hrv: List[TrendPoint]
    calories: List[TrendPoint]
    spo2: List[TrendPoint]
    skin_temp: List[TrendPoint]
    resting_hr: List[TrendPoint]
    respiratory_rate: List[TrendPoint]


class TrendsResponse(BaseModel):
    user_id: str
    series: TrendsSeries
    is_whoop_api_limited: bool = False  # True if data is limited to 25 records due to WHOOP API


class InsightItem(BaseModel):
    insight_type: str
    title: str
    description: str
    confidence: float
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    data: Optional[dict] = None


class InsightsFeed(BaseModel):
    user_id: str
    insights: List[InsightItem]


class TrainingSummary(APIBase):
    status: str
    model_version: Optional[str] = None
    run_id: Optional[str] = None
    trained_models: List[str] = []
    metrics: dict = {}
    data_summary: dict = {}


class WorkoutEfficiency(BaseModel):
    sport_type: str
    avg_cal_per_min: float
    avg_hr: float
    sample_size: int


class CalorieAnalysis(BaseModel):
    winner: Optional[WorkoutEfficiency] = None
    explanation: str
    comparison: List[WorkoutEfficiency] = []


class CalorieGPSWorkout(BaseModel):
    type: str
    name: str
    emoji: str
    color: str
    efficiency: float  # cal/min
    time: float  # minutes needed
    optimal: bool
    improvement: float  # % vs baseline


class CalorieGPSModelMetrics(BaseModel):
    mae: Optional[float] = None  # Mean Absolute Error
    r2: Optional[float] = None  # R² Score
    sample_size: Optional[int] = None  # Number of workouts used for training
    feature_importance: Optional[dict] = None  # Feature importance scores
    model_type: Optional[str] = None  # e.g., "GradientBoosting" or "XGBoost"


class CalorieGPSResponse(BaseModel):
    recommendations: List[CalorieGPSWorkout]
    is_personalized: bool
    model_confidence: Optional[float] = None
    model_metrics: Optional[CalorieGPSModelMetrics] = None  # Model performance metrics


# Blog and Newsletter schemas
class BlogPostBase(BaseModel):
    title: str
    category: str
    reading_time: Optional[str] = None
    preview: str
    content: Optional[str] = None
    image_url: Optional[str] = None
    slug: str
    published: int = 1


class BlogPostCreate(BlogPostBase):
    pass


class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    reading_time: Optional[str] = None
    preview: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    slug: Optional[str] = None
    published: Optional[int] = None


class BlogPost(BlogPostBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class BlogPostList(BaseModel):
    posts: List[BlogPost]


class NewsletterSubscribe(BaseModel):
    email: str = Field(..., description="Email address to subscribe to newsletter")


class NewsletterResponse(BaseModel):
    success: bool
    message: str


class SubscriberInfo(BaseModel):
    id: int
    email: str
    subscribed: int
    subscribed_at: Optional[datetime] = None
    unsubscribed_at: Optional[datetime] = None


class SubscriberList(BaseModel):
    total: int
    active_count: int
    inactive_count: int
    subscribers: List[SubscriberInfo]

