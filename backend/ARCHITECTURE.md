# Whoop Insights Pro - Backend Architecture

## Overview

This document describes the comprehensive backend architecture for Whoop Insights Pro, a premium SaaS platform that transforms raw WHOOP export data into actionable AI-powered insights for athletes.

## Architecture Flow

```
WHOOP ZIP Upload
    ↓
[Ingestion Service]
    ├── Extract ZIP
    ├── Discover CSVs
    ├── Parse CSVs (sleep, recovery, strain, workouts)
    └── Write to DB (DailyMetrics, Workouts)
    ↓
[Feature Engineering Pipeline]
    ├── Compute 7-day & 30-day baselines
    ├── Compute z-scores
    ├── Compute acute/chronic ratios
    ├── Compute sleep debt
    └── Compute consistency scores
    ↓
[ML Training Service]
    ├── Train recovery predictor
    ├── Train burnout classifier
    └── Train sleep classifier
    ↓
[Dashboard Service]
    ├── Rule-based recommendations
    ├── ML predictions
    ├── Risk flag detection
    └── Health scores
    ↓
[Insights Service]
    └── Pattern analysis & insights generation
```

## Core Components

### 1. Database Models (`app/models/database.py`)

**Tables:**
- `users`: User accounts
- `uploads`: Upload history and status
- `daily_metrics`: Daily health metrics with feature engineering outputs
- `workouts`: Individual workout records
- `prediction_runs`: ML model training runs
- `daily_predictions`: Daily predictions and recommendations
- `insights`: Generated insights and patterns

**Key Features:**
- Comprehensive feature engineering columns (baselines, z-scores, ratios)
- Proper indexing for performance
- Unique constraints to prevent duplicates

### 2. Configuration (`app/core_config.py`)

- Pydantic v2 settings with proper configuration
- SQLite default (easy switch to Postgres)
- Configurable directories and ML parameters
- Environment variable support

### 3. Database Session (`app/db_session.py`)

- FastAPI dependency for database sessions
- SQLite-specific optimizations (foreign keys)
- Proper error handling and rollback
- Connection pooling for Postgres

### 4. Ingestion Service (`app/services/ingestion/`)

**Components:**
- `whoop_ingestion.py`: Main orchestrator
- `csv_parsers.py`: Domain-specific CSV parsers

**Flow:**
1. Save ZIP file to `./data/raw/{user_id}/{upload_id}.zip`
2. Extract to `./data/processed/{user_id}/{upload_id}/`
3. Discover CSV files (sleep, recovery, strain, workout)
4. Parse each CSV with domain-specific parser
5. Merge data into DailyMetrics (one row per day)
6. Write Workout records
7. Trigger feature engineering

**Features:**
- Handles missing CSVs gracefully
- Normalizes column names
- Maps WHOOP schema to internal schema
- Idempotent (safe to re-run)

### 5. Feature Engineering (`app/ml/feature_engineering/daily_features.py`)

**Computed Features:**

**Baselines (7-day & 30-day):**
- Recovery score baseline
- Strain score baseline
- Sleep hours baseline
- HRV baseline
- Resting HR baseline

**Z-Scores:**
- Recovery z-score
- Strain z-score
- Sleep z-score
- HRV z-score
- RHR z-score

**Derived Metrics:**
- Acute/Chronic load ratio (7-day vs 30-day strain)
- Sleep debt (cumulative)
- Consistency score (0-100)

**Features:**
- Idempotent (safe to re-run)
- Handles missing data gracefully
- Optimized for daily usage

### 6. ML Training (`app/ml/models/trainer.py`)

**Models Trained:**

1. **Recovery Predictor** (RandomForestRegressor)
   - Predicts next day recovery score
   - Features: recovery, strain, sleep, HRV, baselines, z-scores, ratios
   - Metrics: MAE, R²

2. **Burnout Classifier** (RandomForestClassifier)
   - Classifies burnout risk (low/medium/high)
   - Features: recovery, strain, sleep, HRV, acute/chronic ratio
   - Metrics: Accuracy

3. **Sleep Classifier** (RandomForestClassifier)
   - Classifies sleep health (good/moderate/poor)
   - Features: sleep hours, recovery, strain, sleep debt
   - Metrics: Accuracy

**Model Storage:**
- `./data/models/{user_id}/{version}/{model_name}.joblib`
- Version format: `{base_version}_{timestamp}`
- Tracks training runs in `prediction_runs` table

**Requirements:**
- Minimum 14 days of data (configurable)
- Falls back gracefully if insufficient data

### 7. Model Loading (`app/ml/models/model_loader.py`)

- Loads latest model version for a user
- Handles missing models gracefully
- Backward compatibility with old naming

### 8. Rule-Based Recommender (`app/ml/models/rule_based_recommender.py`)

**Recommendation Logic:**
- Intensity level: REST / LIGHT / MODERATE / HIGH
- Based on: recovery, strain, sleep, acute/chronic ratio
- Workout type suggestions
- Optimal workout time (based on historical patterns)
- Plain-English notes

**Fallback:**
- Used when ML models aren't available
- Always provides recommendations

### 9. Dashboard Service (`app/services/analysis/dashboard_service.py`)

**Generates:**

1. **Today's Metrics**
   - Recovery, strain, sleep, HRV, workout count

2. **Recommendation**
   - Intensity level, focus, workout type, notes, optimal time
   - Blends rule-based + ML (when available)

3. **Tomorrow's Prediction**
   - Recovery forecast (0-100)
   - Confidence (0-1)
   - Uses ML model if available, else rule-based

4. **Health Scores**
   - Consistency (0-100)
   - Burnout risk (0-100)
   - Sleep health (0-100)
   - Uses ML classifiers if available

5. **Risk Flags**
   - High acute/chronic ratio
   - Sustained low HRV
   - Sleep debt
   - Low sleep for multiple days
   - Low recovery sustained
   - High strain without recovery

### 10. Insights Service (`app/services/analysis/insights_service.py`)

**Generated Insights:**

1. **Weekday vs Weekend Consistency**
   - Compares workout patterns

2. **Sleep and Recovery Correlation**
   - Finds optimal sleep for recovery

3. **Late Night Workouts Impact**
   - Analyzes recovery after evening workouts

4. **Strain and Recovery Balance**
   - High strain days impact on recovery

5. **HRV Trends**
   - Improving or declining HRV patterns

**Features:**
- Requires minimum 14 days of data
- Saves insights to database
- Avoids duplicates
- Confidence scores (0-1)

## API Endpoints

### 1. `POST /api/v1/whoop/upload`
- Upload WHOOP ZIP file
- Query params: `user_id`
- Body: multipart form with `file`
- Returns: `UploadResponse`

### 2. `POST /api/v1/train`
- Train ML models for user
- Query params: `user_id`
- Returns: `TrainingSummary`

### 3. `GET /api/v1/dashboard/summary`
- Get comprehensive dashboard
- Query params: `user_id`
- Returns: `DashboardSummary`

### 4. `GET /api/v1/dashboard/trends`
- Get trend data
- Query params: `user_id`, `start_date?`, `end_date?`
- Returns: `TrendsResponse`

### 5. `GET /api/v1/dashboard/insights`
- Get insights feed
- Query params: `user_id`, `regenerate?`
- Returns: `InsightsFeed`

### 6. `GET /healthz`
- Health check
- Returns: `{"status": "ok"}`

## Example Flow

### 1. User Uploads WHOOP ZIP

```bash
curl -X POST "http://localhost:8000/api/v1/whoop/upload?user_id=user123" \
  -F "file=@whoop_export.zip"
```

**Response:**
```json
{
  "upload_id": "abc-123-def",
  "status": "completed",
  "message": "Upload processed successfully. Status: completed"
}
```

### 2. Train Models

```bash
curl -X POST "http://localhost:8000/api/v1/train?user_id=user123"
```

**Response:**
```json
{
  "status": "ok",
  "model_version": "1.0.0_20240115_143022",
  "run_id": "run-456",
  "trained_models": ["recovery_predictor", "burnout_classifier", "sleep_classifier"],
  "metrics": {
    "recovery_predictor": {"mae": 8.5, "r2": 0.72},
    "burnout_classifier": {"accuracy": 0.85},
    "sleep_classifier": {"accuracy": 0.78}
  },
  "data_summary": {
    "days_used": 45,
    "start_date": "2023-12-01",
    "end_date": "2024-01-15"
  }
}
```

### 3. Get Dashboard Summary

```bash
curl "http://localhost:8000/api/v1/dashboard/summary?user_id=user123"
```

**Response:**
```json
{
  "today": {
    "date": "2024-01-15",
    "recovery_score": 67.0,
    "strain_score": 10.5,
    "sleep_hours": 7.5,
    "hrv": 45.0,
    "workouts_count": 1
  },
  "recommendation": {
    "intensity_level": "moderate",
    "focus": "Maintenance",
    "workout_type": "Zone 3-4 intervals / Moderate strength",
    "notes": "Good sleep - body is well-recovered. Maintain consistency with your training plan.",
    "optimal_time": "Late afternoon (4-7pm)"
  },
  "tomorrow": {
    "recovery_forecast": 72.5,
    "confidence": 0.8
  },
  "scores": {
    "consistency": 75.0,
    "burnout_risk": 25.0,
    "sleep_health": 85.0
  },
  "risk_flags": []
}
```

## Error Handling

- All endpoints use HTTPException with appropriate status codes
- Logging at INFO/WARNING/ERROR levels
- Graceful fallbacks when ML models unavailable
- Validation errors return 400
- Server errors return 500 with error details

## Logging

- Centralized logging configuration (`app/utils/logger.py`)
- Logs to both console and file (`./logs/app.log`)
- Structured logging with context
- SQL query logging in debug mode

## Testing

- Pytest tests in `backend/tests/`
- Test coverage:
  - Ingestion (CSV parsing, DB writes)
  - Feature engineering (baselines, z-scores)
  - Training (model creation)
  - Dashboard (summary generation)

## Future Extensions

### Authentication
- Add JWT authentication middleware
- Protect endpoints with user verification
- Store user sessions

### Multi-Device Support
- Track data sources
- Merge data from multiple devices
- Handle conflicts

### Scheduling
- Daily cron job to:
  - Update feature engineering
  - Retrain models (weekly)
  - Generate new insights
- Use Celery or RQ for async tasks

### Postgres Migration
- Change `DATABASE_URL` to Postgres connection string
- Run Alembic migrations
- No code changes needed (SQLAlchemy handles it)

### Advanced ML
- Time series models (Prophet, LSTM)
- Ensemble methods
- Hyperparameter tuning
- Model versioning and A/B testing

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=sqlite:///./whoop.db  # or postgresql://user:pass@host/db

# API
SECRET_KEY=your-secret-key
DEBUG=True
LOG_LEVEL=INFO

# ML
MIN_DAYS_FOR_TRAINING=14
```

### Directory Structure

```
backend/
├── app/
│   ├── api/v1/endpoints/     # API endpoints
│   ├── models/               # Database models
│   ├── services/             # Business logic
│   │   ├── ingestion/       # ZIP processing
│   │   └── analysis/        # Dashboard & insights
│   ├── ml/                   # ML code
│   │   ├── feature_engineering/
│   │   └── models/
│   ├── utils/               # Utilities
│   └── schemas/              # Pydantic schemas
├── data/
│   ├── raw/                  # Uploaded ZIPs
│   ├── processed/            # Extracted CSVs
│   └── models/                # Trained models
└── tests/                    # Test files
```

## Performance Considerations

- Database indexes on frequently queried columns
- Feature engineering cached in database
- Model loading is lazy (only when needed)
- Batch processing for large datasets
- SQLite suitable for development, Postgres for production

## Security

- Input validation on all endpoints
- File size limits (configure in FastAPI)
- SQL injection protection (SQLAlchemy ORM)
- CORS configuration for production
- Secret key management (use environment variables)

