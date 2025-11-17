"""
ML model training service.
Trains per-user models for recovery prediction, burnout risk, etc.
"""
import os
import uuid
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, List
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score, accuracy_score, classification_report
import joblib

from app.models.database import DailyMetrics, PredictionRun
from app.core_config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def load_training_data(db: Session, user_id: str) -> pd.DataFrame:
    """
    Load and prepare training data from DailyMetrics.
    
    Returns:
        DataFrame with features and targets
    """
    metrics = (
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .order_by(DailyMetrics.date.asc())
        .all()
    )
    
    if not metrics:
        return pd.DataFrame()
    
    data = []
    for m in metrics:
        data.append({
            'date': m.date,
            'recovery_score': m.recovery_score,
            'strain_score': m.strain_score,
            'sleep_hours': m.sleep_hours,
            'hrv': m.hrv,
            'resting_hr': m.resting_hr,
            'strain_baseline_7d': m.strain_baseline_7d,
            'strain_baseline_30d': m.strain_baseline_30d,
            'recovery_baseline_7d': m.recovery_baseline_7d,
            'recovery_baseline_30d': m.recovery_baseline_30d,
            'sleep_baseline_7d': m.sleep_baseline_7d,
            'hrv_baseline_7d': m.hrv_baseline_7d,
            'rhr_baseline_7d': m.rhr_baseline_7d,
            'recovery_z_score': m.recovery_z_score,
            'strain_z_score': m.strain_z_score,
            'sleep_z_score': m.sleep_z_score,
            'hrv_z_score': m.hrv_z_score,
            'acute_chronic_ratio': m.acute_chronic_ratio,
            'sleep_debt': m.sleep_debt,
            'consistency_score': m.consistency_score,
        })
    
    df = pd.DataFrame(data)
    
    # Create targets
    # Next day recovery (shift -1 means tomorrow's recovery)
    df['target_recovery'] = df['recovery_score'].shift(-1)
    
    # Burnout risk classification (low/medium/high based on recovery + strain)
    df['burnout_risk'] = pd.cut(
        df['recovery_score'] - (df['strain_score'] * 5),  # Recovery penalized by strain
        bins=[-np.inf, 20, 50, np.inf],
        labels=[2, 1, 0],  # 0=low, 1=medium, 2=high
        include_lowest=True
    )
    
    # Sleep health classification
    df['sleep_health'] = pd.cut(
        df['sleep_hours'],
        bins=[0, 6, 7, 8, np.inf],
        labels=[2, 1, 0, 0],  # 0=good, 1=moderate, 2=poor
        include_lowest=True
    )
    
    # Drop rows with missing targets
    df = df.dropna(subset=['target_recovery'])
    
    return df


def train_recovery_predictor(df: pd.DataFrame) -> Optional[Dict]:
    """
    Train model to predict next day recovery score.
    
    Returns:
        Dict with model, metrics, feature_importance
    """
    if df.empty or len(df) < settings.min_days_for_training:
        return None
    
    # Feature columns
    feature_cols = [
        'recovery_score', 'strain_score', 'sleep_hours', 'hrv', 'resting_hr',
        'strain_baseline_7d', 'recovery_baseline_7d', 'sleep_baseline_7d',
        'hrv_baseline_7d', 'rhr_baseline_7d',
        'recovery_z_score', 'strain_z_score', 'sleep_z_score', 'hrv_z_score',
        'acute_chronic_ratio', 'sleep_debt', 'consistency_score'
    ]
    
    # Filter to available features
    available_features = [col for col in feature_cols if col in df.columns]
    
    X = df[available_features].fillna(0)
    y = df['target_recovery'].fillna(50)  # Default to 50 if missing
    
    if len(X) < 5:
        return None
    
    # Split data
    if len(X) > 10:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
    else:
        X_train, X_test, y_train, y_test = X, X, y, y
    
    # Train model
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        min_samples_split=2,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    logger.info(f"Recovery predictor - MAE: {mae:.2f}, R2: {r2:.3f}")
    
    return {
        'model': model,
        'mae': mae,
        'r2': r2,
        'feature_importance': dict(zip(available_features, model.feature_importances_)),
        'features': available_features,
    }


def train_burnout_classifier(df: pd.DataFrame) -> Optional[Dict]:
    """Train classifier for burnout risk (low/medium/high)."""
    if df.empty or len(df) < settings.min_days_for_training:
        return None
    
    feature_cols = [
        'recovery_score', 'strain_score', 'sleep_hours', 'hrv',
        'strain_baseline_7d', 'recovery_baseline_7d',
        'recovery_z_score', 'strain_z_score', 'sleep_z_score',
        'acute_chronic_ratio', 'sleep_debt', 'consistency_score'
    ]
    
    available_features = [col for col in feature_cols if col in df.columns]
    
    X = df[available_features].fillna(0)
    y = df['burnout_risk'].astype(int)
    
    if len(X) < 5 or y.nunique() < 2:
        return None
    
    if len(X) > 10:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
    else:
        X_train, X_test, y_train, y_test = X, X, y, y
    
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=2,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    logger.info(f"Burnout classifier - Accuracy: {accuracy:.3f}")
    
    return {
        'model': model,
        'accuracy': accuracy,
        'features': available_features,
    }


def train_sleep_classifier(df: pd.DataFrame) -> Optional[Dict]:
    """Train classifier for sleep health."""
    if df.empty or len(df) < settings.min_days_for_training:
        return None
    
    feature_cols = [
        'sleep_hours', 'recovery_score', 'strain_score', 'hrv',
        'sleep_baseline_7d', 'sleep_z_score', 'sleep_debt', 'consistency_score'
    ]
    
    available_features = [col for col in feature_cols if col in df.columns]
    
    X = df[available_features].fillna(0)
    y = df['sleep_health'].astype(int)
    
    if len(X) < 5 or y.nunique() < 2:
        return None
    
    if len(X) > 10:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
    else:
        X_train, X_test, y_train, y_test = X, X, y, y
    
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=2,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    logger.info(f"Sleep classifier - Accuracy: {accuracy:.3f}")
    
    return {
        'model': model,
        'accuracy': accuracy,
        'features': available_features,
    }


def train_user_models(db: Session, user_id: str) -> Optional[Dict]:
    """
    Train all models for a user.
    
    Returns:
        Dict with training results, model paths, version info
    """
    logger.info(f"Starting model training for user {user_id}")
    
    # Load data
    df = load_training_data(db, user_id)
    
    if df.empty or len(df) < settings.min_days_for_training:
        logger.warning(f"Insufficient data for training: {len(df)} days (need {settings.min_days_for_training})")
        return None
    
    # Create model directory
    model_dir = Path(settings.model_dir) / user_id
    model_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate version
    model_version = f"{settings.model_version}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    version_dir = model_dir / model_version
    version_dir.mkdir(exist_ok=True)
    
    trained_models = {}
    model_paths = {}
    
    # Train recovery predictor
    recovery_result = train_recovery_predictor(df)
    if recovery_result:
        model_path = version_dir / "recovery_predictor.joblib"
        joblib.dump(recovery_result['model'], model_path)
        trained_models['recovery_predictor'] = {
            'mae': recovery_result['mae'],
            'r2': recovery_result['r2'],
        }
        model_paths['recovery_predictor'] = str(model_path)
        logger.info(f"Saved recovery predictor to {model_path}")
    
    # Train burnout classifier
    burnout_result = train_burnout_classifier(df)
    if burnout_result:
        model_path = version_dir / "burnout_classifier.joblib"
        joblib.dump(burnout_result['model'], model_path)
        trained_models['burnout_classifier'] = {
            'accuracy': burnout_result['accuracy'],
        }
        model_paths['burnout_classifier'] = str(model_path)
        logger.info(f"Saved burnout classifier to {model_path}")
    
    # Train sleep classifier
    sleep_result = train_sleep_classifier(df)
    if sleep_result:
        model_path = version_dir / "sleep_classifier.joblib"
        joblib.dump(sleep_result['model'], model_path)
        trained_models['sleep_classifier'] = {
            'accuracy': sleep_result['accuracy'],
        }
        model_paths['sleep_classifier'] = str(model_path)
        logger.info(f"Saved sleep classifier to {model_path}")
    
    if not trained_models:
        logger.warning("No models were successfully trained")
        return None
    
    # Create prediction run record
    run_id = str(uuid.uuid4())
    prediction_run = PredictionRun(
        id=run_id,
        user_id=user_id,
        model_version=model_version,
        status="completed",
        created_at=datetime.utcnow(),
    )
    db.add(prediction_run)
    db.commit()
    
    # Summary
    result = {
        'status': 'ok',
        'model_version': model_version,
        'run_id': run_id,
        'trained_models': list(trained_models.keys()),
        'metrics': trained_models,
        'data_summary': {
            'days_used': len(df),
            'start_date': df['date'].min().isoformat(),
            'end_date': df['date'].max().isoformat(),
        },
        'model_paths': model_paths,
    }
    
    logger.info(f"Training completed for user {user_id}: {result}")
    
    return result
