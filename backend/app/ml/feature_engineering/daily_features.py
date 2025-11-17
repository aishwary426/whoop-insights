"""
Feature engineering pipeline for daily metrics.
Computes baselines, z-scores, ratios, and derived metrics.
"""
import logging
from datetime import date, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np

from app.models.database import DailyMetrics, Workout

logger = logging.getLogger(__name__)


def compute_baselines(
    values: List[float],
    window: int = 7
) -> Optional[float]:
    """
    Compute baseline (mean) for a window of values.
    
    Args:
        values: List of values (most recent last)
        window: Number of days to use
    
    Returns:
        Mean value or None if insufficient data
    """
    if not values or len(values) < window:
        return None
    
    window_values = values[-window:]
    window_values = [v for v in window_values if v is not None and not np.isnan(v)]
    
    if not window_values:
        return None
    
    return float(np.mean(window_values))


def compute_z_score(value: Optional[float], baseline: Optional[float], std: Optional[float]) -> Optional[float]:
    """
    Compute z-score: (value - baseline) / std
    
    Args:
        value: Current value
        baseline: Baseline (mean)
        std: Standard deviation
    
    Returns:
        Z-score or None if insufficient data
    """
    if value is None or baseline is None or std is None:
        return None
    
    if std == 0 or np.isnan(std):
        return 0.0
    
    if np.isnan(value) or np.isnan(baseline):
        return None
    
    return float((value - baseline) / std)


def compute_std(values: List[float], window: int = 7) -> Optional[float]:
    """Compute standard deviation for a window."""
    if not values or len(values) < window:
        return None
    
    window_values = values[-window:]
    window_values = [v for v in window_values if v is not None and not np.isnan(v)]
    
    if len(window_values) < 2:
        return None
    
    return float(np.std(window_values))


def compute_acute_chronic_ratio(
    acute_values: List[float],
    chronic_values: List[float],
    acute_window: int = 7,
    chronic_window: int = 28
) -> Optional[float]:
    """
    Compute acute/chronic load ratio.
    
    Args:
        acute_values: Recent values (most recent last)
        chronic_values: Longer-term values (most recent last)
        acute_window: Days for acute load
        chronic_window: Days for chronic load
    
    Returns:
        Ratio or None if insufficient data
    """
    acute_avg = compute_baselines(acute_values, acute_window)
    chronic_avg = compute_baselines(chronic_values, chronic_window)
    
    if acute_avg is None or chronic_avg is None:
        return None
    
    if chronic_avg == 0:
        return None
    
    return float(acute_avg / chronic_avg)


def compute_sleep_debt(
    sleep_hours: List[float],
    target_sleep: float = 8.0,
    window: int = 7
) -> Optional[float]:
    """
    Compute cumulative sleep debt.
    
    Args:
        sleep_hours: List of sleep hours (most recent last)
        target_sleep: Target hours per night
        window: Days to look back
    
    Returns:
        Cumulative sleep debt in hours
    """
    if not sleep_hours or len(sleep_hours) < window:
        return None
    
    window_sleep = sleep_hours[-window:]
    window_sleep = [s for s in window_sleep if s is not None and not np.isnan(s)]
    
    if not window_sleep:
        return None
    
    debt = sum([max(0, target_sleep - s) for s in window_sleep])
    return float(debt)


def compute_consistency_score(
    values: List[float],
    window: int = 28
) -> Optional[float]:
    """
    Compute consistency score (0-100) based on variance.
    Lower variance = higher consistency.
    
    Args:
        values: List of values (most recent last)
        window: Days to analyze
    
    Returns:
        Consistency score (0-100, higher is better)
    """
    if not values or len(values) < window:
        return None
    
    window_values = values[-window:]
    window_values = [v for v in window_values if v is not None and not np.isnan(v)]
    
    if len(window_values) < 2:
        return None
    
    cv = np.std(window_values) / np.mean(window_values) if np.mean(window_values) != 0 else 1.0
    # Convert coefficient of variation to 0-100 score (inverse, normalized)
    consistency = max(0, min(100, 100 * (1 - min(cv, 1.0))))
    
    return float(consistency)


def recompute_daily_features(db: Session, user_id: str) -> int:
    """
    Recompute all feature engineering for a user's daily metrics.
    This is idempotent - safe to run multiple times.
    
    Args:
        db: Database session
        user_id: User identifier
    
    Returns:
        Number of records updated
    """
    logger.info(f"Recomputing features for user {user_id}")
    
    # Get all daily metrics ordered by date
    metrics = (
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .order_by(DailyMetrics.date.asc())
        .all()
    )

    if not metrics:
        logger.warning(f"No metrics found for user {user_id}")
        return 0
    
    # Update workout counts
    for metric in metrics:
        workout_count = db.query(Workout).filter(
            Workout.user_id == user_id,
            Workout.date == metric.date
        ).count()
        metric.workouts_count = workout_count
    
    # Build lists for rolling calculations
    dates = [m.date for m in metrics]
    recovery_scores = [m.recovery_score for m in metrics]
    strain_scores = [m.strain_score for m in metrics]
    sleep_hours = [m.sleep_hours for m in metrics]
    hrv_values = [m.hrv for m in metrics]
    rhr_values = [m.resting_hr for m in metrics]
    
    updated_count = 0
    
    # Process each metric
    for i, metric in enumerate(metrics):
        # Get historical values up to this point
        hist_recovery = recovery_scores[:i+1]
        hist_strain = strain_scores[:i+1]
        hist_sleep = sleep_hours[:i+1]
        hist_hrv = hrv_values[:i+1]
        hist_rhr = rhr_values[:i+1]
        
        # Compute 7-day and 30-day baselines
        metric.strain_baseline_7d = compute_baselines(hist_strain, 7)
        metric.strain_baseline_30d = compute_baselines(hist_strain, 30)
        metric.recovery_baseline_7d = compute_baselines(hist_recovery, 7)
        metric.recovery_baseline_30d = compute_baselines(hist_recovery, 30)
        metric.sleep_baseline_7d = compute_baselines(hist_sleep, 7)
        metric.sleep_baseline_30d = compute_baselines(hist_sleep, 30)
        metric.hrv_baseline_7d = compute_baselines(hist_hrv, 7)
        metric.hrv_baseline_30d = compute_baselines(hist_hrv, 30)
        metric.rhr_baseline_7d = compute_baselines(hist_rhr, 7)
        metric.rhr_baseline_30d = compute_baselines(hist_rhr, 30)
        
        # Compute z-scores (using 30-day baseline and std)
        recovery_std = compute_std(hist_recovery, 30)
        strain_std = compute_std(hist_strain, 30)
        sleep_std = compute_std(hist_sleep, 30)
        hrv_std = compute_std(hist_hrv, 30)
        rhr_std = compute_std(hist_rhr, 30)
        
        metric.recovery_z_score = compute_z_score(
            metric.recovery_score,
            metric.recovery_baseline_30d,
            recovery_std
        )
        metric.strain_z_score = compute_z_score(
            metric.strain_score,
            metric.strain_baseline_30d,
            strain_std
        )
        metric.sleep_z_score = compute_z_score(
            metric.sleep_hours,
            metric.sleep_baseline_30d,
            sleep_std
        )
        metric.hrv_z_score = compute_z_score(
            metric.hrv,
            metric.hrv_baseline_30d,
            hrv_std
        )
        metric.rhr_z_score = compute_z_score(
            metric.resting_hr,
            metric.rhr_baseline_30d,
            rhr_std
        )
        
        # Compute acute/chronic ratio (7-day vs 30-day strain)
        metric.acute_chronic_ratio = compute_acute_chronic_ratio(
            hist_strain, hist_strain, 7, 30
        )
        
        # Compute sleep debt
        metric.sleep_debt = compute_sleep_debt(hist_sleep, target_sleep=8.0, window=7)
        
        # Compute consistency (using last 28 days)
        metric.consistency_score = compute_consistency_score(hist_sleep, 28)
        
        updated_count += 1

    db.commit()
    logger.info(f"Updated {updated_count} daily metrics with features")
    
    return updated_count
