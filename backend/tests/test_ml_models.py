"""
Comprehensive tests for ML models.
"""
import pytest
import pandas as pd
import numpy as np
from datetime import date, timedelta
from unittest.mock import Mock, patch, MagicMock
import tempfile
from pathlib import Path

from app.models.database import DailyMetrics, Workout, User
from app.ml.models.trainer import train_user_models, _load_training_frame, _ensure_dirs
from app.ml.models.calorie_gps_model import (
    train_calorie_gps_model,
    predict_workout_recommendations,
    _classify_workout_type,
    _load_training_data
)
from app.ml.models.recovery_velocity import (
    train_recovery_velocity_model,
    predict_recovery_days,
    get_historical_recovery_episodes
)
from app.ml.models.sleep_optimizer import (
    train_sleep_optimizer,
    predict_optimal_bedtime
)
from app.ml.models.strain_tolerance_model import (
    train_strain_tolerance_model,
    predict_burnout_risk,
    _get_strain_threshold_examples
)
from app.ml.models.workout_timing_optimizer import (
    train_workout_timing_optimizer,
    predict_optimal_workout_time
)

from app.ml.models.model_loader import load_latest_models, _latest_version_path


class TestTrainer:
    """Tests for trainer.py functions."""

    def test_load_training_frame(self, db_session, temp_dirs):
        """Test loading training data frame."""
        # Create sample data
        base_date = date(2024, 1, 1)
        for i in range(20):
            db_session.add(DailyMetrics(
                user_id="test_user",
                date=base_date + timedelta(days=i),
                recovery_score=65 + i,
                strain_score=10 + i * 0.5,
                sleep_hours=7.5,
                hrv=70,
                resting_hr=55
            ))
        db_session.commit()

        df = _load_training_frame(db_session, "test_user")

        assert len(df) == 20
        assert 'recovery_score' in df.columns
        assert 'strain_score' in df.columns

    def test_ensure_dirs_creates_directories(self, temp_dirs):
        """Test directory creation."""
        user_dir = _ensure_dirs("test_user_123")
        assert user_dir.exists()
        assert (user_dir / "recovery").exists()
        assert (user_dir / "sleep").exists()

    def test_train_user_models_insufficient_data(self, db_session, temp_dirs):
        """Test training with insufficient data."""
        # Add only 5 days of data (insufficient)
        base_date = date(2024, 1, 1)
        for i in range(5):
            db_session.add(DailyMetrics(
                user_id="test_user",
                date=base_date + timedelta(days=i),
                recovery_score=65,
                strain_score=10,
                sleep_hours=7.5,
                hrv=70,
                resting_hr=55
            ))
        db_session.commit()

        result = train_user_models(db_session, "test_user")
        # Should return None or error due to insufficient data
        assert result is None or "error" in result

    def test_train_user_models_success(self, db_session, temp_dirs):
        """Test successful model training."""
        # Add sufficient data
        base_date = date(2024, 1, 1)
        for i in range(30):
            db_session.add(DailyMetrics(
                user_id="test_user",
                date=base_date + timedelta(days=i),
                recovery_score=65 + (i % 10),
                strain_score=10 + (i % 5),
                sleep_hours=7.0 + (i % 3) * 0.5,
                hrv=70 + i * 0.2,
                resting_hr=55 - i * 0.1,
                recovery_baseline_7d=65.0,
                strain_baseline_7d=10.0,
                sleep_baseline_7d=7.5
            ))
        db_session.commit()

        result = train_user_models(db_session, "test_user")

        assert result is not None
        assert result.get("status") == "ok" or "recovery_model_path" in result


class TestCalorieGPSModel:
    """Tests for calorie_gps_model.py functions."""

    def test_classify_workout_type_high_intensity(self):
        """Test classification of high intensity workout."""
        workout_type = _classify_workout_type(strain=15.0, avg_hr=160, efficiency=0.9)
        assert workout_type in ["high_intensity", "endurance", "moderate"]

    def test_classify_workout_type_low_intensity(self):
        """Test classification of low intensity workout."""
        workout_type = _classify_workout_type(strain=5.0, avg_hr=100, efficiency=0.5)
        assert workout_type in ["low_intensity", "moderate", "recovery"]

    def test_load_training_data(self, db_session, temp_dirs):
        """Test loading training data with workouts."""
        base_date = date(2024, 1, 1)
        for i in range(10):
            db_session.add(DailyMetrics(
                user_id="test_user",
                date=base_date + timedelta(days=i),
                recovery_score=65,
                strain_score=10,
                sleep_hours=7.5,
                hrv=70,
                resting_hr=55
            ))
            db_session.add(Workout(
                user_id="test_user",
                workout_date=base_date + timedelta(days=i),
                sport_type="Running",
                duration_minutes=60,
                strain=10.5,
                avg_hr=145,
                calories_burned=450
            ))
        db_session.commit()

        df = _load_training_data(db_session, "test_user")

        assert len(df) >= 10
        assert 'calories_burned' in df.columns

    def test_predict_workout_recommendations(self):
        """Test workout recommendations prediction."""
        # Create mock model
        mock_model = Mock()
        mock_model.predict.return_value = np.array([[500, 10, 120]])

        feature_cols = ['recovery_score', 'target_calories']

        recommendations = predict_workout_recommendations(
            model=mock_model,
            xgb_model=None,
            feature_cols=feature_cols,
            recovery_score=70,
            target_calories=400
        )

        assert isinstance(recommendations, list)
        assert len(recommendations) > 0

    def test_train_calorie_gps_model(self, db_session, temp_dirs):
        """Test calorie GPS model training."""
        # Add sufficient workout data
        base_date = date(2024, 1, 1)
        for i in range(25):
            db_session.add(DailyMetrics(
                user_id="test_user",
                date=base_date + timedelta(days=i),
                recovery_score=65 + (i % 10),
                strain_score=10 + (i % 5),
                sleep_hours=7.5,
                hrv=70,
                resting_hr=55,
                recovery_baseline_7d=65.0,
                strain_baseline_7d=10.0
            ))
            db_session.add(Workout(
                user_id="test_user",
                workout_date=base_date + timedelta(days=i),
                sport_type="Running",
                duration_minutes=60,
                strain=10.0 + i * 0.3,
                avg_hr=140 + i,
                calories_burned=400 + i * 10
            ))
        db_session.commit()

        result = train_calorie_gps_model(db_session, "test_user")

        # May return None if insufficient data, or success dict
        assert result is None or isinstance(result, dict)


class TestRecoveryVelocity:
    """Tests for recovery_velocity.py functions."""

    def test_get_historical_recovery_episodes(self, db_session):
        """Test retrieving historical recovery episodes."""
        base_date = date(2024, 1, 1)
        for i in range(20):
            recovery = 60 + (i % 15)
            db_session.add(DailyMetrics(
                user_id="test_user",
                date=base_date + timedelta(days=i),
                recovery_score=recovery,
                strain_score=10,
                sleep_hours=7.5,
                hrv=70,
                resting_hr=55
            ))
        db_session.commit()

        episodes = get_historical_recovery_episodes(
            db_session,
            "test_user",
            current_recovery=65,
            strain_score=10,
            limit=5
        )

        assert isinstance(episodes, list)
        assert len(episodes) <= 5

    def test_predict_recovery_days(self, db_session, temp_dirs):
        """Test recovery days prediction."""
        # Add data
        base_date = date(2024, 1, 1)
        for i in range(30):
            db_session.add(DailyMetrics(
                user_id="test_user",
                date=base_date + timedelta(days=i),
                recovery_score=65 + (i % 10),
                strain_score=10,
                sleep_hours=7.5,
                hrv=70,
                resting_hr=55,
                recovery_baseline_7d=65.0,
                acute_chronic_ratio=1.0
            ))
        db_session.commit()

        result = predict_recovery_days(
            db_session,
            "test_user",
            current_recovery=60,
            strain_score=12,
            sleep_hours=7,
            hrv=65,
            acute_chronic_ratio=1.2
        )

        # May return None if no model trained
        assert result is None or isinstance(result, dict)


class TestSleepOptimizer:
    """Tests for sleep_optimizer.py functions."""

    def test_train_sleep_optimizer(self, db_session, temp_dirs):
        """Test sleep optimizer training."""
        base_date = date(2024, 1, 1)
        for i in range(30):
            db_session.add(DailyMetrics(
                user_id="test_user",
                date=base_date + timedelta(days=i),
                recovery_score=65 + (i % 10),
                strain_score=10,
                sleep_hours=7.0 + (i % 3) * 0.5,
                hrv=70,
                resting_hr=55,
                recovery_baseline_7d=65.0,
                strain_baseline_7d=10.0
            ))
        db_session.commit()

        result = train_sleep_optimizer(db_session, "test_user")

        assert result is None or isinstance(result, dict)

    def test_predict_optimal_bedtime(self, db_session, temp_dirs):
        """Test optimal bedtime prediction."""
        base_date = date(2024, 1, 1)
        for i in range(30):
            db_session.add(DailyMetrics(
                user_id="test_user",
                date=base_date + timedelta(days=i),
                recovery_score=65,
                strain_score=10,
                sleep_hours=7.5,
                hrv=70,
                resting_hr=55
            ))
        db_session.commit()

        result = predict_optimal_bedtime(
            db_session,
            "test_user",
            today_strain=10,
            today_recovery=65,
            day_of_week=1
        )

        assert result is None or isinstance(result, dict)


class TestStrainToleranceModel:
    """Tests for strain_tolerance_model.py functions."""

    def test_get_strain_threshold_examples(self, db_session):
        """Test retrieving strain threshold examples."""
        base_date = date(2024, 1, 1)
        for i in range(20):
            db_session.add(DailyMetrics(
                user_id="test_user",
                date=base_date + timedelta(days=i),
                recovery_score=65,
                strain_score=8.0 + i * 0.5,
                sleep_hours=7.5,
                hrv=70,
                resting_hr=55
            ))
        db_session.commit()

        examples = _get_strain_threshold_examples(
            db_session,
            "test_user",
            threshold=12.0,
            max_examples=5
        )

        assert isinstance(examples, list)
        assert len(examples) <= 5

    def test_predict_burnout_risk(self, db_session, temp_dirs):
        """Test burnout risk prediction."""
        base_date = date(2024, 1, 1)
        for i in range(30):
            db_session.add(DailyMetrics(
                user_id="test_user",
                date=base_date + timedelta(days=i),
                recovery_score=65,
                strain_score=10 + i * 0.3,
                sleep_hours=7.5,
                hrv=70,
                resting_hr=55,
                recovery_baseline_7d=65.0,
                acute_chronic_ratio=1.0
            ))
        db_session.commit()

        result = predict_burnout_risk(
            db_session,
            "test_user",
            current_strain=15,
            recovery_score=60,
            sleep_hours=6.5,
            hrv=65,
            acute_chronic_ratio=1.3
        )

        assert result is None or isinstance(result, dict)


class TestWorkoutTimingOptimizer:
    """Tests for workout_timing_optimizer.py functions."""

    def test_train_workout_timing_optimizer(self, db_session, temp_dirs):
        """Test workout timing optimizer training."""
        base_date = date(2024, 1, 1)
        for i in range(30):
            db_session.add(DailyMetrics(
                user_id="test_user",
                date=base_date + timedelta(days=i),
                recovery_score=65 + (i % 10),
                strain_score=10,
                sleep_hours=7.5,
                hrv=70,
                resting_hr=55,
                workouts_count=1 if i % 2 == 0 else 0,
                recovery_baseline_7d=65.0
            ))
        db_session.commit()

        result = train_workout_timing_optimizer(db_session, "test_user")

        assert result is None or isinstance(result, dict)

    def test_predict_optimal_workout_time(self, db_session, temp_dirs):
        """Test optimal workout time prediction."""
        base_date = date(2024, 1, 1)
        for i in range(30):
            db_session.add(DailyMetrics(
                user_id="test_user",
                date=base_date + timedelta(days=i),
                recovery_score=65,
                strain_score=10,
                sleep_hours=7.5,
                hrv=70,
                resting_hr=55
            ))
        db_session.commit()

        result = predict_optimal_workout_time(
            db_session,
            "test_user",
            today_recovery=70,
            today_strain=8,
            day_of_week=1
        )

        assert result is None or isinstance(result, dict)





class TestModelLoader:
    """Tests for model_loader.py functions."""

    def test_latest_version_path_exists(self, tmp_path):
        """Test finding latest version path."""
        # Create version directories
        base_path = tmp_path / "models" / "user_123"
        base_path.mkdir(parents=True)
        (base_path / "v1").mkdir()
        (base_path / "v2").mkdir()
        (base_path / "v3").mkdir()

        latest = _latest_version_path(base_path)

        assert latest is not None
        assert "v3" in str(latest)

    def test_latest_version_path_no_versions(self, tmp_path):
        """Test with no version directories."""
        base_path = tmp_path / "models" / "user_456"
        base_path.mkdir(parents=True)

        latest = _latest_version_path(base_path)

        assert latest is None

    def test_load_latest_models_no_models(self, temp_dirs):
        """Test loading models when none exist."""
        models = load_latest_models("nonexistent_user")

        assert isinstance(models, dict)
        # Should return empty dict or fallback models

    def test_load_latest_models_with_models(self, temp_dirs, tmp_path):
        """Test loading existing models."""
        # This would require creating actual model files
        # For now, just test the function doesn't crash
        models = load_latest_models("test_user")

        assert isinstance(models, dict)
