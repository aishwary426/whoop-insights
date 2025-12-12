"""
Calorie GPS Model - Hyper-personalized calorie burn prediction and workout recommendation.

This model predicts:
- Calorie burn efficiency (cal/min) for different workout types
- Time needed to burn target calories for each workout type
- Optimal workout type recommendation based on recovery state and target calories
"""

from __future__ import annotations

import logging
from typing import Dict, List, Optional, Tuple
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import func

# Optional ML dependencies
try:
    from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
    from sklearn.preprocessing import StandardScaler
    import joblib
    SKLEARN_AVAILABLE = True
except Exception:
    SKLEARN_AVAILABLE = False
    logging.getLogger(__name__).warning("scikit-learn not available, Calorie GPS ML disabled")

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except Exception:
    XGBOOST_AVAILABLE = False

from app.models.database import DailyMetrics, Workout

logger = logging.getLogger(__name__)

# Workout type mapping
WORKOUT_TYPES = {
    'high_intensity': {
        'name': 'High-Intensity Training',
        'emoji': '🔥',
        'color': 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
        'base_efficiency': 12.5,  # cal/min baseline
        'base_time_factor': 0.8
    },
    'moderate': {
        'name': 'Moderate Training',
        'emoji': '💪',
        'color': 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
        'base_efficiency': 10.0,
        'base_time_factor': 1.0
    },
    'endurance': {
        'name': 'Long Endurance',
        'emoji': '🚴',
        'color': 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
        'base_efficiency': 8.3,
        'base_time_factor': 1.2
    },
    'light': {
        'name': 'Light Activity/Walking',
        'emoji': '🚶',
        'color': 'from-green-500/20 to-emerald-500/20 border-green-500/30',
        'base_efficiency': 5.5,
        'base_time_factor': 1.8
    }
}


def _load_training_data(db: Session, user_id: str) -> pd.DataFrame:
    """Load and prepare training data for Calorie GPS model."""
    # Get daily metrics
    rows = (
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .order_by(DailyMetrics.date.asc())
        .all()
    )
    
    if not rows:
        return pd.DataFrame()

    # Get workout data with duration and calories
    workouts = (
        db.query(
            Workout.date,
            Workout.duration_minutes,
            Workout.calories,
            Workout.sport_type,
            Workout.avg_hr,
            Workout.max_hr,
            Workout.strain
        )
        .filter(Workout.user_id == user_id)
        .filter(Workout.duration_minutes.isnot(None))
        .filter(Workout.duration_minutes > 0)
        .filter(Workout.calories.isnot(None))
        .filter(Workout.calories > 0)
        .all()
    )

    # Group workouts by date and calculate efficiency
    workout_data = []
    for w in workouts:
        efficiency = w.calories / w.duration_minutes if w.duration_minutes > 0 else None
        if efficiency and efficiency > 0:
            # Classify workout type based on intensity
            workout_type = _classify_workout_type(w.strain, w.avg_hr, efficiency)
            workout_data.append({
                'date': w.date,
                'duration_minutes': w.duration_minutes,
                'calories': w.calories,
                'efficiency': efficiency,
                'workout_type': workout_type,
                'strain': w.strain,
                'avg_hr': w.avg_hr,
                'max_hr': w.max_hr
            })
    
    workout_df = pd.DataFrame(workout_data)
    
    # Merge with daily metrics
    metrics_data = []
    for r in rows:
        metrics_data.append({
            'date': r.date,
            'recovery_score': r.recovery_score,
            'strain_score': r.strain_score,
            'sleep_hours': r.sleep_hours,
            'hrv': r.hrv,
            'resting_hr': r.resting_hr,
            'acute_chronic_ratio': r.acute_chronic_ratio,
            'sleep_debt': r.sleep_debt,
            'consistency_score': r.consistency_score,
        })
    
    metrics_df = pd.DataFrame(metrics_data)
    
    # Merge workout data with daily metrics
    if not workout_df.empty and not metrics_df.empty:
        df = pd.merge(metrics_df, workout_df, on='date', how='inner')
    else:
        return pd.DataFrame()
    
    # Fill missing values
    df['recovery_score'] = df['recovery_score'].fillna(df['recovery_score'].median())
    df['strain_score'] = df['strain_score'].fillna(0)
    df['sleep_hours'] = df['sleep_hours'].fillna(7)
    df['hrv'] = df['hrv'].fillna(df['hrv'].median())
    df['resting_hr'] = df['resting_hr'].fillna(df['resting_hr'].median())
    df['acute_chronic_ratio'] = df['acute_chronic_ratio'].fillna(1.0)
    df['sleep_debt'] = df['sleep_debt'].fillna(0)
    df['consistency_score'] = df['consistency_score'].fillna(50)
    df['strain'] = df['strain'].fillna(0)
    df['avg_hr'] = df['avg_hr'].fillna(df['resting_hr'])
    df['max_hr'] = df['max_hr'].fillna(df['avg_hr'])
    
    return df


def _classify_workout_type(strain: Optional[float], avg_hr: Optional[float], efficiency: float) -> str:
    """Classify workout type based on intensity indicators."""
    if strain and strain >= 12:
        return 'high_intensity'
    elif strain and strain >= 8:
        return 'moderate'
    elif efficiency >= 7:
        return 'endurance'
    else:
        return 'light'


def train_calorie_gps_model(db: Session, user_id: str, is_mobile: bool = False) -> Optional[Dict]:
    """Train a hyper-personalized Calorie GPS model for a user."""
    if not SKLEARN_AVAILABLE:
        logger.warning("scikit-learn not available, cannot train Calorie GPS model")
        return None

    df = _load_training_data(db, user_id)
    
    if df.empty or len(df) < 10:
        logger.info(f"Insufficient data for Calorie GPS model: {len(df)} workouts")
        return {
            'status': 'insufficient_data',
            'workouts_available': len(df),
            'message': 'Need at least 10 workouts with calorie and duration data to train model'
        }

    # Feature engineering
    # Features that predict calorie burn efficiency
    feature_cols = [
        'recovery_score',
        'strain_score',
        'sleep_hours',
        'hrv',
        'resting_hr',
        'acute_chronic_ratio',
        'sleep_debt',
        'consistency_score'
    ]
    
    # Encode workout type as features
    for wtype in WORKOUT_TYPES.keys():
        df[f'is_{wtype}'] = (df['workout_type'] == wtype).astype(int)
        feature_cols.append(f'is_{wtype}')
    
    # Additional derived features
    df['recovery_strain_ratio'] = df['recovery_score'] / (df['strain_score'] + 1)
    df['hrv_resting_hr_ratio'] = df['hrv'] / (df['resting_hr'] + 1)
    feature_cols.extend(['recovery_strain_ratio', 'hrv_resting_hr_ratio'])
    
    X = df[feature_cols].fillna(0)
    y = df['efficiency']  # Target: calories per minute
    
    # Train model (use Gradient Boosting for better performance)
    estimator_count = 30 if is_mobile else 50
    max_depth = 5 if is_mobile else 7
    
    model = GradientBoostingRegressor(
        n_estimators=estimator_count,
        max_depth=max_depth,
        learning_rate=0.1,
        random_state=7,
        subsample=0.8
    )
    
    model.fit(X, y)
    
    # Also train XGBoost if available (usually better)
    xgb_model = None
    if XGBOOST_AVAILABLE:
        try:
            xgb_model = xgb.XGBRegressor(
                n_estimators=estimator_count,
                max_depth=max_depth,
                learning_rate=0.1,
                random_state=7,
                subsample=0.8,
                colsample_bytree=0.8,
                objective='reg:squarederror'
            )
            xgb_model.fit(X, y)
        except Exception as e:
            logger.warning(f"Failed to train XGBoost model: {e}")
    
    # Calculate model performance
    predictions = model.predict(X)
    mae = np.mean(np.abs(predictions - y))
    r2 = model.score(X, y)
    
    # Feature importance
    feature_importance = dict(zip(feature_cols, model.feature_importances_))
    
    result = {
        'status': 'ok',
        'model': model,
        'xgb_model': xgb_model,
        'feature_cols': feature_cols,
        'mae': float(mae),
        'r2': float(r2),
        'sample_size': len(df),
        'feature_importance': {k: float(v) for k, v in feature_importance.items()},
        'workout_types': list(WORKOUT_TYPES.keys())
    }
    
    logger.info(f"Calorie GPS model trained: MAE={mae:.2f}, R²={r2:.3f}, samples={len(df)}")
    
    return result


def predict_workout_recommendations(
    model: any,
    xgb_model: Optional[any],
    feature_cols: List[str],
    recovery_score: float,
    target_calories: float,
    strain_score: float = 0,
    sleep_hours: float = 7,
    hrv: float = 50,
    resting_hr: float = 60,
    acute_chronic_ratio: float = 1.0,
    sleep_debt: float = 0,
    consistency_score: float = 50
) -> List[Dict]:
    """Predict workout recommendations for given recovery state and target calories."""
    
    # Prepare base features
    base_features = {
        'recovery_score': recovery_score,
        'strain_score': strain_score,
        'sleep_hours': sleep_hours,
        'hrv': hrv,
        'resting_hr': resting_hr,
        'acute_chronic_ratio': acute_chronic_ratio,
        'sleep_debt': sleep_debt,
        'consistency_score': consistency_score,
        'recovery_strain_ratio': recovery_score / (strain_score + 1),
        'hrv_resting_hr_ratio': hrv / (resting_hr + 1)
    }
    
    recommendations = []
    
    # Predict for each workout type
    for wtype, wconfig in WORKOUT_TYPES.items():
        # Create feature vector for this workout type
        features = base_features.copy()
        for other_type in WORKOUT_TYPES.keys():
            features[f'is_{other_type}'] = 1 if other_type == wtype else 0
        
        # Ensure feature order matches training
        feature_vector = np.array([[features.get(col, 0) for col in feature_cols]])
        
        # Predict efficiency
        if xgb_model is not None:
            try:
                efficiency = float(xgb_model.predict(feature_vector)[0])
            except:
                efficiency = float(model.predict(feature_vector)[0])
        else:
            efficiency = float(model.predict(feature_vector)[0])
        
        # Ensure reasonable bounds
        efficiency = max(3.0, min(20.0, efficiency))
        
        # Calculate time needed
        time_needed = target_calories / efficiency if efficiency > 0 else 999
        
        # Determine if this is optimal based on recovery
        is_optimal = False
        if recovery_score >= 67:
            is_optimal = wtype == 'high_intensity'
        elif recovery_score >= 34:
            is_optimal = wtype == 'moderate'
        elif recovery_score < 34:
            is_optimal = wtype == 'light'
        
        # Improvement vs baseline
        baseline_efficiency = wconfig['base_efficiency']
        improvement = ((efficiency - baseline_efficiency) / baseline_efficiency) * 100
        
        recommendations.append({
            'type': wtype,
            'name': wconfig['name'],
            'emoji': wconfig['emoji'],
            'color': wconfig['color'],
            'efficiency': round(efficiency, 1),
            'time': round(time_needed, 1),
            'optimal': is_optimal,
            'improvement': round(improvement, 1)
        })
    
    return recommendations























