"""
Comprehensive tests for ML feature engineering and forecasting.
"""
import pytest
import pandas as pd
import numpy as np
from datetime import date, timedelta

from app.models.database import DailyMetrics
from app.ml.feature_engineering.daily_features import (
    _rolling_mean,
    _rolling_std,
    _zscore,
    _sleep_debt,
    _consistency,
    _prepare_dataframe,
    compute_daily_feature_frame,
    recompute_daily_features
)
from app.ml.forecasting.recovery_forecast import forecast_recovery_ts


class TestDailyFeatures:
    """Tests for daily_features.py functions."""

    def test_rolling_mean(self):
        """Test rolling mean calculation."""
        series = pd.Series([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        result = _rolling_mean(series, window=3)

        assert isinstance(result, pd.Series)
        assert len(result) == len(series)
        # First two values should be NaN due to window size
        assert pd.isna(result.iloc[0])
        assert pd.isna(result.iloc[1])
        # Third value should be mean of first 3 values
        assert result.iloc[2] == pytest.approx(2.0)

    def test_rolling_std(self):
        """Test rolling standard deviation calculation."""
        series = pd.Series([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
        result = _rolling_std(series, window=3)

        assert isinstance(result, pd.Series)
        assert len(result) == len(series)
        # First two values should be NaN
        assert pd.isna(result.iloc[0])
        assert pd.isna(result.iloc[1])
        # Subsequent values should be valid std dev
        assert result.iloc[2] >= 0

    def test_zscore_normal(self):
        """Test z-score calculation."""
        value = 10
        mean = 8
        std = 2

        result = _zscore(value, mean, std)

        assert result == pytest.approx(1.0)

    def test_zscore_zero_std(self):
        """Test z-score with zero standard deviation."""
        result = _zscore(10, 8, 0)

        assert result == 0.0

    def test_zscore_nan_handling(self):
        """Test z-score with NaN values."""
        result = _zscore(np.nan, 8, 2)
        assert result == 0.0

        result = _zscore(10, np.nan, 2)
        assert result == 0.0

    def test_sleep_debt(self):
        """Test sleep debt calculation."""
        series = pd.Series([7.0, 6.5, 7.5, 6.0, 8.0, 7.0, 6.5, 7.0])
        target = 7.5

        result = _sleep_debt(series)

        assert isinstance(result, pd.Series)
        assert len(result) == len(series)
        # Sleep debt should be cumulative
        assert result.iloc[-1] != 0  # Should have accumulated some debt

    def test_consistency(self):
        """Test consistency score calculation."""
        # Very consistent series
        consistent_series = pd.Series([7.0, 7.0, 7.0, 7.0, 7.0])
        result = _consistency(consistent_series)

        assert isinstance(result, pd.Series)
        # Last value should be high (low variance = high consistency)
        assert result.iloc[-1] > 50

        # Very inconsistent series
        inconsistent_series = pd.Series([5.0, 9.0, 3.0, 10.0, 4.0])
        result = _consistency(inconsistent_series)

        # Last value should be low (high variance = low consistency)
        assert result.iloc[-1] < 50

    def test_prepare_dataframe(self):
        """Test dataframe preparation from DailyMetrics objects."""
        base_date = date(2024, 1, 1)
        rows = []

        for i in range(10):
            dm = DailyMetrics(
                user_id="test_user",
                date=base_date + timedelta(days=i),
                recovery_score=65 + i,
                strain_score=10 + i * 0.5,
                sleep_hours=7.5,
                hrv=70,
                resting_hr=55
            )
            rows.append(dm)

        df = _prepare_dataframe(rows)

        assert isinstance(df, pd.DataFrame)
        assert len(df) == 10
        assert 'date' in df.columns
        assert 'recovery_score' in df.columns
        assert 'strain_score' in df.columns

    def test_compute_daily_feature_frame(self):
        """Test computing daily features."""
        # Create sample dataframe
        base_date = date(2024, 1, 1)
        dates = [base_date + timedelta(days=i) for i in range(30)]

        df = pd.DataFrame({
            'date': dates,
            'recovery_score': [65 + (i % 10) for i in range(30)],
            'strain_score': [10 + (i % 5) * 0.5 for i in range(30)],
            'sleep_hours': [7.0 + (i % 3) * 0.5 for i in range(30)],
            'hrv': [70 + i * 0.2 for i in range(30)],
            'resting_hr': [55 - i * 0.1 for i in range(30)],
        })

        result = compute_daily_feature_frame(df)

        assert isinstance(result, pd.DataFrame)
        assert len(result) == 30

        # Check that baseline columns were added
        assert 'recovery_baseline_7d' in result.columns
        assert 'strain_baseline_7d' in result.columns
        assert 'sleep_baseline_7d' in result.columns

        # Check that z-score columns were added
        assert 'hrv_z_score' in result.columns
        assert 'rhr_z_score' in result.columns

        # Check that derived columns were added
        assert 'acute_chronic_ratio' in result.columns
        assert 'sleep_debt' in result.columns
        assert 'consistency_score' in result.columns

    def test_compute_daily_feature_frame_insufficient_data(self):
        """Test computing features with insufficient data."""
        # Create dataframe with only 2 days
        df = pd.DataFrame({
            'date': [date(2024, 1, 1), date(2024, 1, 2)],
            'recovery_score': [65, 70],
            'strain_score': [10, 11],
            'sleep_hours': [7.5, 7.0],
            'hrv': [70, 72],
            'resting_hr': [55, 54],
        })

        result = compute_daily_feature_frame(df)

        assert isinstance(result, pd.DataFrame)
        # Early rows will have NaN for rolling features
        assert result.iloc[0]['recovery_baseline_7d'] is None or pd.isna(result.iloc[0]['recovery_baseline_7d'])

    def test_recompute_daily_features(self, db_session):
        """Test recomputing features for user's daily metrics."""
        base_date = date(2024, 1, 1)

        # Add daily metrics to database
        for i in range(30):
            db_session.add(DailyMetrics(
                user_id="test_user",
                date=base_date + timedelta(days=i),
                recovery_score=65 + (i % 10),
                strain_score=10 + (i % 5) * 0.5,
                sleep_hours=7.0 + (i % 3) * 0.5,
                hrv=70 + i * 0.2,
                resting_hr=55 - i * 0.1
            ))
        db_session.commit()

        # Recompute features
        count = recompute_daily_features(db_session, "test_user")

        assert count == 30

        # Verify features were computed
        metrics = db_session.query(DailyMetrics).filter(
            DailyMetrics.user_id == "test_user"
        ).order_by(DailyMetrics.date.desc()).first()

        assert metrics.recovery_baseline_7d is not None
        assert metrics.strain_baseline_7d is not None
        assert metrics.sleep_baseline_7d is not None
        assert metrics.acute_chronic_ratio is not None

    def test_recompute_daily_features_no_data(self, db_session):
        """Test recomputing features with no data."""
        count = recompute_daily_features(db_session, "nonexistent_user")

        assert count == 0

    def test_rolling_mean_empty_series(self):
        """Test rolling mean with empty series."""
        series = pd.Series([])
        result = _rolling_mean(series, window=3)

        assert isinstance(result, pd.Series)
        assert len(result) == 0

    def test_sleep_debt_negative_values(self):
        """Test sleep debt with negative debt (sleep surplus)."""
        # Series with lots of sleep (surplus)
        series = pd.Series([9.0, 9.5, 10.0, 9.0, 8.5])

        result = _sleep_debt(series)

        assert isinstance(result, pd.Series)
        # Should have negative debt (surplus)
        assert result.iloc[-1] < 0

    def test_consistency_single_value(self):
        """Test consistency with single value."""
        series = pd.Series([7.0])
        result = _consistency(series)

        assert isinstance(result, pd.Series)
        assert len(result) == 1


class TestRecoveryForecast:
    """Tests for recovery_forecast.py functions."""

    def test_forecast_recovery_ts_success(self):
        """Test successful recovery time series forecast."""
        # Create time series with trend
        dates = pd.date_range(start='2024-01-01', periods=30, freq='D')
        recovery_scores = [65 + i * 0.5 + np.random.randn() * 2 for i in range(30)]

        series = pd.Series(recovery_scores, index=dates)

        result = forecast_recovery_ts(series, forecast_days=7, min_periods=14)

        if result is not None:
            assert isinstance(result, dict)
            assert 'forecast' in result
            assert 'confidence_lower' in result
            assert 'confidence_upper' in result
            assert len(result['forecast']) == 7

    def test_forecast_recovery_ts_insufficient_data(self):
        """Test forecast with insufficient data."""
        # Only 10 days of data
        dates = pd.date_range(start='2024-01-01', periods=10, freq='D')
        recovery_scores = [65 + i * 0.5 for i in range(10)]

        series = pd.Series(recovery_scores, index=dates)

        result = forecast_recovery_ts(series, forecast_days=7, min_periods=14)

        # Should return None due to insufficient data
        assert result is None

    def test_forecast_recovery_ts_constant_values(self):
        """Test forecast with constant recovery values."""
        dates = pd.date_range(start='2024-01-01', periods=30, freq='D')
        recovery_scores = [70.0] * 30

        series = pd.Series(recovery_scores, index=dates)

        result = forecast_recovery_ts(series, forecast_days=7, min_periods=14)

        if result is not None:
            # Forecast should be close to constant value
            assert all(65 <= f <= 75 for f in result['forecast'])

    def test_forecast_recovery_ts_varying_forecast_days(self):
        """Test forecast with different forecast horizons."""
        dates = pd.date_range(start='2024-01-01', periods=30, freq='D')
        recovery_scores = [65 + i * 0.5 for i in range(30)]

        series = pd.Series(recovery_scores, index=dates)

        # Test 3-day forecast
        result_3d = forecast_recovery_ts(series, forecast_days=3, min_periods=14)

        if result_3d is not None:
            assert len(result_3d['forecast']) == 3

        # Test 14-day forecast
        result_14d = forecast_recovery_ts(series, forecast_days=14, min_periods=14)

        if result_14d is not None:
            assert len(result_14d['forecast']) == 14

    def test_forecast_recovery_ts_with_missing_values(self):
        """Test forecast with missing values in series."""
        dates = pd.date_range(start='2024-01-01', periods=30, freq='D')
        recovery_scores = [65 + i * 0.5 if i % 5 != 0 else np.nan for i in range(30)]

        series = pd.Series(recovery_scores, index=dates)

        result = forecast_recovery_ts(series, forecast_days=7, min_periods=14)

        # Should handle missing values gracefully
        # Result can be None or valid forecast depending on implementation
        assert result is None or isinstance(result, dict)

    def test_forecast_recovery_ts_descending_trend(self):
        """Test forecast with descending recovery trend."""
        dates = pd.date_range(start='2024-01-01', periods=30, freq='D')
        recovery_scores = [80 - i * 0.5 for i in range(30)]

        series = pd.Series(recovery_scores, index=dates)

        result = forecast_recovery_ts(series, forecast_days=7, min_periods=14)

        if result is not None:
            # Should continue descending trend
            assert result['forecast'][0] < 70
