from sqlalchemy import Column, Integer, String, Float, DateTime, Date, JSON, ForeignKey, Text, Enum, UniqueConstraint, Index
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

class InsightType(str, enum.Enum):
    RECOVERY_PATTERN = "recovery_pattern"
    WORKOUT_EFFICIENCY = "workout_efficiency"
    SLEEP_ANALYSIS = "sleep_analysis"
    CONSISTENCY = "consistency"
    PERFORMANCE_CORRELATION = "performance_correlation"

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    email = Column(String, unique=True)
    name = Column(String)
    age = Column(Integer, nullable=True)
    nationality = Column(String, nullable=True)
    goal = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    uploads = relationship("Upload", back_populates="user", cascade="all, delete-orphan")
    daily_metrics = relationship("DailyMetrics", back_populates="user", cascade="all, delete-orphan")
    workouts = relationship("Workout", back_populates="user", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_user_email', 'email'),  # Index for faster email lookups during auth
    )

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

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)

    # Core metrics
    recovery_score = Column(Float)
    strain_score = Column(Float)
    sleep_hours = Column(Float)
    hrv = Column(Float)
    resting_hr = Column(Float)
    workouts_count = Column(Integer, default=0)

    # Feature engineering outputs
    strain_baseline_7d = Column(Float)
    strain_baseline_30d = Column(Float)
    recovery_baseline_7d = Column(Float)
    recovery_baseline_30d = Column(Float)
    sleep_baseline_7d = Column(Float)
    sleep_baseline_30d = Column(Float)
    hrv_baseline_7d = Column(Float)
    hrv_baseline_30d = Column(Float)
    rhr_baseline_7d = Column(Float)
    rhr_baseline_30d = Column(Float)
    
    # Z-scores
    recovery_z_score = Column(Float)
    strain_z_score = Column(Float)
    sleep_z_score = Column(Float)
    hrv_z_score = Column(Float)
    rhr_z_score = Column(Float)
    
    # Ratios and derived metrics
    acute_chronic_ratio = Column(Float)
    sleep_debt = Column(Float)  # Cumulative sleep debt estimate
    consistency_score = Column(Float)  # Workout/sleep consistency
    
    # Metadata
    extra = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="daily_metrics")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'date', name='uq_user_date'),
        Index('idx_user_date', 'user_id', 'date'),
    )

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

    __table_args__ = (
        Index('idx_workout_user_date', 'user_id', 'date'),
    )

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

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    prediction_run_id = Column(String)

    intensity_level = Column(Enum(IntensityLevel))
    focus_recommendation = Column(String)
    workout_type = Column(String)
    notes = Column(Text)
    optimal_time = Column(String)  # e.g., "Late afternoon (4-7pm)"
    
    predicted_recovery_tomorrow = Column(Float)
    confidence = Column(Float)
    
    burnout_risk_score = Column(Float)
    sleep_health_score = Column(Float)
    injury_risk_score = Column(Float)
    consistency_score = Column(Float)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        UniqueConstraint('user_id', 'date', name='uq_prediction_user_date'),
        Index('idx_prediction_user_date', 'user_id', 'date'),
    )

class Insight(Base):
    __tablename__ = "insights"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    insight_type = Column(Enum(InsightType), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    data = Column(JSON)  # Store supporting data/metrics
    confidence = Column(Float)  # 0-1 confidence score
    period_start = Column(Date)
    period_end = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_insight_user_type', 'user_id', 'insight_type'),
        Index('idx_insight_created', 'created_at'),
    )

class BlogPost(Base):
    __tablename__ = "blog_posts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    reading_time = Column(String)  # e.g., "5 min"
    preview = Column(Text, nullable=False)
    content = Column(Text)  # Full blog post content (optional for now)
    image_url = Column(String)  # URL or path to blog post image
    slug = Column(String, unique=True, nullable=False)  # URL-friendly identifier
    published = Column(Integer, default=1)  # 1 = published, 0 = draft
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_blog_published', 'published'),
        Index('idx_blog_created', 'created_at'),
    )

class NewsletterSubscriber(Base):
    __tablename__ = "newsletter_subscribers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False)
    subscribed = Column(Integer, default=1)  # 1 = subscribed, 0 = unsubscribed
    subscribed_at = Column(DateTime, default=datetime.utcnow)
    unsubscribed_at = Column(DateTime)
    
    __table_args__ = (
        Index('idx_subscriber_email', 'email'),
        Index('idx_subscriber_status', 'subscribed'),
    )

class AdminEmail(Base):
    __tablename__ = "admin_emails"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False)
    added_by = Column(String, nullable=False)  # Email of the admin who added this
    added_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_admin_email', 'email'),
    )
