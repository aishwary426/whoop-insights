from __future__ import annotations

import logging
from typing import Optional

import numpy as np
import pandas as pd
try:
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    STATSMODELS_AVAILABLE = True
except ImportError:
    STATSMODELS_AVAILABLE = False
    logger.warning("statsmodels not available, forecasting disabled")

logger = logging.getLogger(__name__)


def forecast_recovery_ts(
    recovery_series: pd.Series,
    forecast_days: int = 7,
    min_periods: int = 14
) -> Optional[dict]:
    """
    Forecast recovery scores using exponential smoothing time series model.
    
    Args:
        recovery_series: Series of recovery scores indexed by date
        forecast_days: Number of days to forecast ahead
        min_periods: Minimum number of data points required
        
    Returns:
        Dictionary with forecast values and confidence intervals, or None if insufficient data
    """
    if len(recovery_series) < min_periods:
        logger.warning(f"Insufficient data for time series forecast: {len(recovery_series)} < {min_periods}")
        return None

    if not STATSMODELS_AVAILABLE:
        return None
    
    try:
        # Ensure the series is sorted by date
        recovery_series = recovery_series.sort_index()
        
        # Fit exponential smoothing model (handles trend and seasonality)
        model = ExponentialSmoothing(
            recovery_series,
            trend='add',
            seasonal=None,  # Can be 'add' or 'mul' if we detect seasonality
            seasonal_periods=None
        )
        fitted_model = model.fit(optimized=True)
        
        # Generate forecast
        forecast = fitted_model.forecast(steps=forecast_days)
        
        # Calculate confidence intervals (simplified - using historical std)
        historical_std = recovery_series.std()
        forecast_std = historical_std * np.sqrt(np.arange(1, forecast_days + 1))
        
        upper_bound = forecast + 1.96 * forecast_std
        lower_bound = forecast - 1.96 * forecast_std
        
        # Clip values to valid recovery range [0, 100]
        forecast = np.clip(forecast, 0, 100)
        upper_bound = np.clip(upper_bound, 0, 100)
        lower_bound = np.clip(lower_bound, 0, 100)
        
        return {
            "forecast": forecast.tolist(),
            "upper_bound": upper_bound.tolist(),
            "lower_bound": lower_bound.tolist(),
            "model_type": "exponential_smoothing",
            "forecast_days": forecast_days,
        }
    except Exception as e:
        logger.error(f"Error in time series forecast: {e}", exc_info=True)
        return None

