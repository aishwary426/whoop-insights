from __future__ import annotations

import logging
from pathlib import Path
from typing import Dict, Optional

import pandas as pd

# Optional ML dependencies
try:
    import joblib
    JOBLIB_AVAILABLE = True
except ImportError:
    JOBLIB_AVAILABLE = False
    joblib = None

try:
    from sklearn.cluster import KMeans
    from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logging.getLogger(__name__).warning("scikit-learn not available, ML features disabled")

from sqlalchemy.orm import Session

from app.core_config import get_settings
from app.models.database import DailyMetrics, Workout
from sqlalchemy import func

logger = logging.getLogger(__name__)

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
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .order_by(DailyMetrics.date.asc())
        .all()
    )
    
    if not rows:
        return pd.DataFrame()

    # Aggregate workout calories by date
    workout_cals = (
        db.query(Workout.date, func.sum(Workout.calories).label("total_calories"))
        .filter(Workout.user_id == user_id)
        .group_by(Workout.date)
        .all()
    )
    cal_map = {w.date: (w.total_calories or 0.0) for w in workout_cals}

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
                "calories": cal_map.get(r.date, 0.0),
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
    # Ensure calories is numeric
    df["calories"] = df["calories"].fillna(0.0)
    return df


def _ensure_dirs(user_id: str) -> Path:
    version_dir = Path(settings.model_dir) / user_id / settings.model_version
    version_dir.mkdir(parents=True, exist_ok=True)
    return version_dir


def train_user_models(db: Session, user_id: str, is_mobile: bool = False) -> Optional[Dict]:
    """Train per-user models and persist them to disk."""
    if not SKLEARN_AVAILABLE or not JOBLIB_AVAILABLE:
        return {
            "status": "skipped_no_ml_libs",
            "trained_models": [],
            "message": "ML libraries not installed (Light Backend mode)",
        }

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
    y_cal = df["calories"]

    estimator_count = 25 if is_mobile else 50
    # Train RandomForest models (baseline)
    rf_reg_model = RandomForestRegressor(n_estimators=estimator_count, random_state=7)
    rf_reg_model.fit(X, y_reg)

    rf_cls_model = RandomForestClassifier(n_estimators=estimator_count, random_state=7)
    rf_cls_model.fit(X, y_cls)

    # Train Calorie Model (Regressor)
    rf_cal_model = RandomForestRegressor(n_estimators=estimator_count, random_state=7)
    rf_cal_model.fit(X, y_cal)

    version_dir = _ensure_dirs(user_id)
    rec_path = version_dir / "recovery_model.joblib"
    burnout_path = version_dir / "burnout_model.joblib"
    cal_path = version_dir / "calorie_model.joblib"
    xgb_rec_path = version_dir / "xgb_recovery_model.joblib"
    xgb_burnout_path = version_dir / "xgb_burnout_model.joblib"
    cluster_path = version_dir / "behavior_clusters.pkl"

    # Save RandomForest models
    joblib.dump(rf_reg_model, rec_path)
    joblib.dump(rf_cls_model, burnout_path)
    joblib.dump(rf_cal_model, cal_path)

    # Train and save XGBoost models (improved performance)
    trained_models = ["recovery", "burnout_classifier", "calorie"]
    if XGBOOST_AVAILABLE:
        try:
            # XGBoost regressor for recovery prediction
            xgb_reg_model = xgb.XGBRegressor(
                n_estimators=estimator_count,
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
                n_estimators=estimator_count,
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
        "calorie_model_path": str(cal_path),
        "cluster_model_path": str(cluster_path) if cluster_model else None,
    }
    
    if XGBOOST_AVAILABLE:
        result["xgb_recovery_model_path"] = str(xgb_rec_path)
        result["xgb_burnout_model_path"] = str(xgb_burnout_path)
    
    return result
