"""
Workout Timing Optimization
Predicts best workout times (morning/afternoon/evening) for each user based on recovery outcomes.
"""
from __future__ import annotations

import logging
from typing import Optional, Dict
import pandas as pd
from datetime import timedelta
from sqlalchemy.orm import Session

try:
    from sklearn.ensemble import RandomForestClassifier
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

try:
    import joblib
    JOBLIB_AVAILABLE = True
except ImportError:
    JOBLIB_AVAILABLE = False

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

from app.models.database import DailyMetrics, Workout
from app.core_config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def train_workout_timing_optimizer(db: Session, user_id: str, is_mobile: bool = False) -> Optional[Dict]:
    """
    Train a model to predict optimal workout timing based on next-day recovery.
    
    Returns:
        Dictionary with optimal workout times and confidence, or None if insufficient data
    """
    if not SKLEARN_AVAILABLE or not JOBLIB_AVAILABLE:
        logger.warning("ML libraries not available for workout timing optimization")
        return None
    
    # Get workouts with timing data
    workouts = (
        db.query(Workout)
        .filter(Workout.user_id == user_id)
        .filter(Workout.start_time.isnot(None))
        .order_by(Workout.date.asc())
        .all()
    )
    
    if len(workouts) < 20:
        logger.info(f"Insufficient workouts for timing optimizer: {len(workouts)} workouts")
        return None
    
    # Feature engineering: workout time → next-day recovery
    features = []
    targets = []
    
    for workout in workouts:
        # Get next day's recovery
        next_day = workout.date + timedelta(days=1)
        next_metric = (
            db.query(DailyMetrics)
            .filter(
                DailyMetrics.user_id == user_id,
                DailyMetrics.date == next_day
            )
            .first()
        )
        
        if not next_metric or next_metric.recovery_score is None:
            continue
        
        # Get current day's recovery (before workout)
        current_metric = (
            db.query(DailyMetrics)
            .filter(
                DailyMetrics.user_id == user_id,
                DailyMetrics.date == workout.date
            )
            .first()
        )
        
        workout_hour = workout.start_time.hour if workout.start_time else 12
        workout_strain = workout.strain or (current_metric.strain_score if current_metric else 0)
        
        # Features: workout hour, recovery before workout, strain, day of week
        features.append([
            float(workout_hour),
            float(current_metric.recovery_score if current_metric else 50),
            float(workout_strain),
            float(workout.date.weekday()),  # 0=Monday, 6=Sunday
            float(current_metric.sleep_hours if current_metric and current_metric.sleep_hours else 7.5),
        ])
        
        # Target: high recovery next day (binary: 1 if recovery >= 67, else 0)
        targets.append(1 if next_metric.recovery_score >= 67 else 0)
    
    if len(features) < 10:
        logger.info(f"Not enough data pairs for workout timing optimizer: {len(features)}")
        return None
    
    try:
        estimator_count = 25 if is_mobile else 50
        
        # Use XGBoost if available, otherwise RandomForest
        if XGBOOST_AVAILABLE:
            model = xgb.XGBClassifier(
                n_estimators=estimator_count,
                max_depth=6,
                learning_rate=0.1,
                random_state=7,
                n_jobs=1,
                objective='binary:logistic'
            )
            model_type = "xgboost"
        else:
            model = RandomForestClassifier(
                n_estimators=estimator_count,
                max_depth=5,
                random_state=7,
                n_jobs=1
            )
            model_type = "random_forest"
        
        model.fit(features, targets)
        
        # Test different workout times to find optimal
        timing_scores = {}
        test_features = []
        
        # Test morning (6-10), afternoon (12-16), evening (17-20)
        test_hours = [7, 9, 14, 16, 18, 20]
        
        # Use median values from user's data
        median_recovery = pd.Series([f[1] for f in features]).median()
        median_strain = pd.Series([f[2] for f in features]).median()
        median_sleep = pd.Series([f[4] for f in features]).median()
        
        for hour in test_hours:
            # Test for Tuesday (typical workout day)
            test_features.append([
                float(hour),
                float(median_recovery),
                float(median_strain),
                1.0,  # Tuesday
                float(median_sleep),
            ])
        
        # Get probabilities for each workout time
        probas = model.predict_proba(test_features)
        for idx, hour in enumerate(test_hours):
            timing_scores[hour] = float(probas[idx][1])  # Probability of high recovery
        
        # Find optimal time
        optimal_hour = max(timing_scores.items(), key=lambda x: x[1])[0]
        optimal_confidence = timing_scores[optimal_hour]
        
        # Categorize time of day
        if optimal_hour < 12:
            time_category = "morning"
            time_str = f"{optimal_hour}:00 AM"
        elif optimal_hour < 17:
            time_category = "afternoon"
            time_str = f"{optimal_hour % 12 if optimal_hour > 12 else optimal_hour}:00 PM"
        else:
            time_category = "evening"
            time_str = f"{optimal_hour % 12}:00 PM"
        
        result = {
            'model': model,
            'model_type': model_type,
            'optimal_hour': optimal_hour,
            'optimal_time': time_str,
            'optimal_category': time_category,
            'confidence': optimal_confidence,
            'timing_scores': timing_scores,
            'sample_size': len(features),
            'improvement_pct': (optimal_confidence - 0.5) * 100  # Estimated improvement over random
        }
        
        logger.info(
            f"Workout timing optimizer trained for user {user_id}: "
            f"optimal {time_category} ({time_str}) with {optimal_confidence:.2f} confidence"
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error training workout timing optimizer: {e}", exc_info=True)
        return None


def predict_optimal_workout_time(
    db: Session,
    user_id: str,
    today_recovery: float,
    today_strain: float,
    day_of_week: int
) -> Optional[Dict]:
    """
    Predict optimal workout time for today based on trained model or historical patterns.
    
    Args:
        db: Database session
        user_id: User identifier
        today_recovery: Today's recovery score
        today_strain: Today's strain score
        day_of_week: Day of week (0=Monday, 6=Sunday)
    
    Returns:
        Dictionary with workout time recommendation, or None if insufficient data
    """
    # Try rule-based analysis from historical patterns
    workouts = (
        db.query(Workout)
        .filter(Workout.user_id == user_id)
        .filter(Workout.start_time.isnot(None))
        .order_by(Workout.date.desc())
        .limit(30)
        .all()
    )
    
    if len(workouts) < 10:
        return None
    
    # Analyze recovery outcomes by workout time
    morning_recoveries = []
    afternoon_recoveries = []
    evening_recoveries = []
    
    for workout in workouts:
        next_day = workout.date + timedelta(days=1)
        next_metric = (
            db.query(DailyMetrics)
            .filter(
                DailyMetrics.user_id == user_id,
                DailyMetrics.date == next_day
            )
            .first()
        )
        
        if not next_metric or next_metric.recovery_score is None:
            continue
        
        hour = workout.start_time.hour if workout.start_time else 12
        
        if hour < 12:
            morning_recoveries.append(next_metric.recovery_score)
        elif hour < 17:
            afternoon_recoveries.append(next_metric.recovery_score)
        else:
            evening_recoveries.append(next_metric.recovery_score)
    
    # Calculate average recovery by time
    avg_by_time = {}
    if morning_recoveries:
        avg_by_time['morning'] = sum(morning_recoveries) / len(morning_recoveries)
    if afternoon_recoveries:
        avg_by_time['afternoon'] = sum(afternoon_recoveries) / len(afternoon_recoveries)
    if evening_recoveries:
        avg_by_time['evening'] = sum(evening_recoveries) / len(evening_recoveries)
    
    if not avg_by_time:
        return None
    
    # Find best time
    optimal_category = max(avg_by_time.items(), key=lambda x: x[1])[0]
    optimal_avg_recovery = avg_by_time[optimal_category]
    
    # Convert to specific time recommendation
    time_map = {
        'morning': '9:00 AM',
        'afternoon': '2:00 PM',
        'evening': '6:00 PM'
    }
    
    # Calculate improvement percentage
    all_recoveries = morning_recoveries + afternoon_recoveries + evening_recoveries
    overall_avg = sum(all_recoveries) / len(all_recoveries) if all_recoveries else 0
    improvement_pct = ((optimal_avg_recovery - overall_avg) / overall_avg * 100) if overall_avg > 0 else 0
    
    return {
        'optimal_category': optimal_category,
        'optimal_time': time_map.get(optimal_category, 'Afternoon'),
        'avg_recovery': optimal_avg_recovery,
        'improvement_pct': improvement_pct,
        'confidence': min(0.8, len(workouts) / 30.0),
        'reasoning': f"Based on your workout history, {optimal_category} workouts result in "
                     f"{optimal_avg_recovery:.0f}% average next-day recovery "
                     f"({improvement_pct:+.0f}% vs your overall average)"
    }























