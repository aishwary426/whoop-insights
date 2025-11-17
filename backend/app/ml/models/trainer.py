<<<<<<< HEAD
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
=======
from __future__ import annotations

import logging
from pathlib import Path
from typing import Dict, Optional

>>>>>>> 57703a5 (Initial commit - Whoop Insights Pro)
import joblib
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sqlalchemy.orm import Session

<<<<<<< HEAD
from app.models.database import DailyMetrics, PredictionRun
=======
>>>>>>> 57703a5 (Initial commit - Whoop Insights Pro)
from app.core_config import get_settings
from app.models.database import DailyMetrics

logger = logging.getLogger(__name__)
<<<<<<< HEAD
settings = get_settings()


def load_training_data(db: Session, user_id: str) -> pd.DataFrame:
    """
    Load and prepare training data from DailyMetrics.
    
    Returns:
        DataFrame with features and targets
    """
    metrics = (
=======

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    logger.warning("XGBoost not available, falling back to RandomForest only")
settings = get_settings()

MIN_ROWS = 10


def _load_training_frame(db: Session, user_id: str) -> pd.DataFrame:
    rows = (
>>>>>>> 57703a5 (Initial commit - Whoop Insights Pro)
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .order_by(DailyMetrics.date.asc())
        .all()
    )
    
    if not metrics:
        return pd.DataFrame()
<<<<<<< HEAD
    
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
=======

    payload = []
    for r in rows:
        payload.append(
            {
                "date": r.date,
                "recovery_score": r.recovery_score,
                "strain_score": r.strain_score,
                "sleep_hours": r.sleep_hours,
                "hrv": r.hrv,
                "acute_chronic_ratio": r.acute_chronic_ratio,
                "sleep_debt": r.sleep_debt,
                "consistency_score": r.consistency_score,
            }
        )

    df = pd.DataFrame(payload).sort_values("date")
    df["target_recovery"] = df["recovery_score"].shift(-1)
    df["recovery_bucket"] = pd.cut(
        df["recovery_score"],
        bins=[0, 33, 66, 100],
        labels=[0, 1, 2],
        include_lowest=True,
    )
    df["acute_chronic_ratio"] = df["acute_chronic_ratio"].fillna(1.0)
    df["sleep_debt"] = df["sleep_debt"].fillna(0)
    df["consistency_score"] = df["consistency_score"].ffill().fillna(50)
    df = df.dropna(subset=["target_recovery"])
    df = df.fillna(0)
    return df


def _ensure_dirs(user_id: str) -> Path:
    version_dir = Path(settings.model_dir) / user_id / settings.model_version
    version_dir.mkdir(parents=True, exist_ok=True)
    return version_dir


def train_user_models(db: Session, user_id: str) -> Optional[Dict]:
    """Train per-user models and persist them to disk."""
    df = _load_training_frame(db, user_id)
    if df.empty or len(df) < MIN_ROWS:
        return {
            "status": "not_enough_data",
            "trained_models": [],
            "days_used": len(df),
            "message": "Need at least 10 days of data to train.",
        }

    feature_cols = ["strain_score", "sleep_hours", "hrv", "acute_chronic_ratio", "sleep_debt", "consistency_score"]
    X = df[feature_cols]
    y_reg = df["target_recovery"]
    y_cls = df["recovery_bucket"]

    # Train RandomForest models (baseline)
    rf_reg_model = RandomForestRegressor(n_estimators=200, random_state=7)
    rf_reg_model.fit(X, y_reg)

    rf_cls_model = RandomForestClassifier(n_estimators=200, random_state=7)
    rf_cls_model.fit(X, y_cls)

    version_dir = _ensure_dirs(user_id)
    rec_path = version_dir / "recovery_model.joblib"
    burnout_path = version_dir / "burnout_model.joblib"
    xgb_rec_path = version_dir / "xgb_recovery_model.joblib"
    xgb_burnout_path = version_dir / "xgb_burnout_model.joblib"
    cluster_path = version_dir / "behavior_clusters.pkl"

    # Save RandomForest models
    joblib.dump(rf_reg_model, rec_path)
    joblib.dump(rf_cls_model, burnout_path)

    # Train and save XGBoost models (improved performance)
    trained_models = ["recovery", "burnout_classifier"]
    if XGBOOST_AVAILABLE:
        try:
            # XGBoost regressor for recovery prediction
            xgb_reg_model = xgb.XGBRegressor(
                n_estimators=200,
                max_depth=6,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=7,
                objective='reg:squarederror'
            )
            xgb_reg_model.fit(X, y_reg)
            joblib.dump(xgb_reg_model, xgb_rec_path)
            
            # XGBoost classifier for burnout prediction
            xgb_cls_model = xgb.XGBClassifier(
                n_estimators=200,
                max_depth=6,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=7,
                objective='multi:softprob',
                num_class=3
            )
            xgb_cls_model.fit(X, y_cls)
            joblib.dump(xgb_cls_model, xgb_burnout_path)
            
            trained_models.extend(["xgb_recovery", "xgb_burnout"])
            logger.info("XGBoost models trained successfully")
        except Exception as e:
            logger.warning(f"Failed to train XGBoost models: {e}", exc_info=True)

    # Lightweight clustering to personalize patterns (per user only)
    cluster_model = None
    if len(df) >= 6:
        cluster_features = df[["strain_score", "sleep_hours", "hrv", "sleep_debt"]]
        k = min(3, len(df))  # small, per-user clusters
        cluster_model = KMeans(n_clusters=k, n_init="auto", random_state=7)
        cluster_model.fit(cluster_features)
        joblib.dump(cluster_model, cluster_path)

    logger.info(
        "Training completed",
        extra={
            "user_id": user_id,
            "model_version": settings.model_version,
            "trained_models": trained_models + (["cluster"] if cluster_model else []),
        },
    )

    result = {
        "status": "ok",
        "model_version": settings.model_version,
        "trained_models": trained_models + (["cluster"] if cluster_model else []),
        "days_used": len(df),
        "start_date": df["date"].min(),
        "end_date": df["date"].max(),
        "recovery_model_path": str(rec_path),
        "burnout_model_path": str(burnout_path),
        "cluster_model_path": str(cluster_path) if cluster_model else None,
    }
    
    if XGBOOST_AVAILABLE:
        result["xgb_recovery_model_path"] = str(xgb_rec_path)
        result["xgb_burnout_model_path"] = str(xgb_burnout_path)
>>>>>>> 57703a5 (Initial commit - Whoop Insights Pro)
    
    return result
