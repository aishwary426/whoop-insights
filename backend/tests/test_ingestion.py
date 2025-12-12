"""
Tests for ingestion service.
"""
import pytest
import tempfile
import zipfile
import pandas as pd
from pathlib import Path
from datetime import date, datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.database import Base, DailyMetrics, Workout, Upload, User
from app.services.ingestion.whoop_ingestion import ingest_whoop_zip, ensure_user
from app.ml.feature_engineering.daily_features import recompute_daily_features


@pytest.fixture
def db_session():
    """Create in-memory SQLite database for testing."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture
def sample_whoop_zip(tmp_path):
    """Create a sample WHOOP ZIP file with test CSVs."""
    zip_path = tmp_path / "test_whoop_export.zip"
    
    with zipfile.ZipFile(zip_path, 'w') as zf:
        # Create recovery CSV
        recovery_data = pd.DataFrame({
            'Date': ['2024-01-01', '2024-01-02', '2024-01-03'],
            'Recovery Score': [67, 45, 78],
            'HRV': [45, 42, 48],
            'RHR': [55, 58, 54],
        })
        zf.writestr('Recovery.csv', recovery_data.to_csv(index=False))
        
        # Create sleep CSV
        sleep_data = pd.DataFrame({
            'Date': ['2024-01-01', '2024-01-02', '2024-01-03'],
            'Hours Slept': [7.5, 6.5, 8.0],
        })
        zf.writestr('Sleep.csv', sleep_data.to_csv(index=False))
        
        # Create strain CSV
        strain_data = pd.DataFrame({
            'Date': ['2024-01-01', '2024-01-02', '2024-01-03'],
            'Strain': [10.5, 8.2, 12.1],
        })
        zf.writestr('Strain.csv', strain_data.to_csv(index=False))
        
        # Create workout CSV
        workout_data = pd.DataFrame({
            'Date': ['2024-01-01', '2024-01-02'],
            'Start Time': ['2024-01-01 17:00:00', '2024-01-02 18:00:00'],
            'Duration (minutes)': [60, 45],
            'Sport': ['Running', 'Cycling'],
            'Strain': [10.5, 8.2],
            'Avg HR': [145, 130],
            'Max HR': [165, 150],
            'Calories': [450, 320],
        })
        zf.writestr('Workout.csv', workout_data.to_csv(index=False))
    
    return zip_path


def test_ingestion_creates_daily_metrics(db_session, sample_whoop_zip, tmp_path):
    """Test that ingestion creates DailyMetrics records."""
    user_id = "test_user_1"
    
    with open(sample_whoop_zip, 'rb') as f:
        upload = ingest_whoop_zip(db_session, user_id, f)
    
    # Check upload status
    assert upload.status.value == "completed"
    
    # Check daily metrics were created
    metrics = db_session.query(DailyMetrics).filter(
        DailyMetrics.user_id == user_id
    ).all()
    
    assert len(metrics) == 3  # 3 days of data
    
    # Check first day has recovery score
    first_metric = metrics[0]
    assert first_metric.recovery_score == 67
    assert first_metric.hrv == 45
    assert first_metric.resting_hr == 55
    assert first_metric.sleep_hours == 7.5
    assert first_metric.strain_score == 10.5


def test_ingestion_creates_workouts(db_session, sample_whoop_zip):
    """Test that ingestion creates Workout records."""
    user_id = "test_user_2"
    
    with open(sample_whoop_zip, 'rb') as f:
        ingest_whoop_zip(db_session, user_id, f)
    
    workouts = db_session.query(Workout).filter(
        Workout.user_id == user_id
    ).all()
    
    assert len(workouts) == 2  # 2 workouts
    
    # Check first workout
    first_workout = workouts[0]
    assert first_workout.sport_type == "Running"
    assert first_workout.duration_minutes == 60
    assert first_workout.strain == 10.5


def test_feature_engineering_computes_baselines(db_session, sample_whoop_zip):
    """Test that feature engineering computes baselines."""
    user_id = "test_user_3"
    
    with open(sample_whoop_zip, 'rb') as f:
        ingest_whoop_zip(db_session, user_id, f)
    
    # Run feature engineering
    recompute_daily_features(db_session, user_id)
    
    # Check that baselines are computed
    metrics = db_session.query(DailyMetrics).filter(
        DailyMetrics.user_id == user_id
    ).order_by(DailyMetrics.date.asc()).all()
    
    # Last metric should have baselines
    last_metric = metrics[-1]
    assert last_metric.strain_baseline_7d is not None
    assert last_metric.recovery_baseline_7d is not None
    assert last_metric.sleep_baseline_7d is not None


def test_ingestion_handles_missing_data(db_session, tmp_path):
    """Test that ingestion handles missing CSV files gracefully."""
    user_id = "test_user_4"
    
    # Create minimal ZIP with only recovery data
    zip_path = tmp_path / "minimal.zip"
    with zipfile.ZipFile(zip_path, 'w') as zf:
        recovery_data = pd.DataFrame({
            'Date': ['2024-01-01'],
            'Recovery Score': [67],
        })
        zf.writestr('Recovery.csv', recovery_data.to_csv(index=False))
    
    with open(zip_path, 'rb') as f:
        upload = ingest_whoop_zip(db_session, user_id, f)
    
    assert upload.status.value == "completed"
    
    # Should still create daily metrics
    metrics = db_session.query(DailyMetrics).filter(
        DailyMetrics.user_id == user_id
    ).all()
    
    assert len(metrics) >= 1

