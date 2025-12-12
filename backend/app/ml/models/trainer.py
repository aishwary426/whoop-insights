from __future__ import annotations

import logging
from pathlib import Path
from typing import Dict, Optional

import pandas as pd

# Optional ML dependencies
try:
    import joblib
    JOBLIB_AVAILABLE = True
except Exception:
    JOBLIB_AVAILABLE = False
    joblib = None

try:
    from sklearn.cluster import KMeans
    from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
    SKLEARN_AVAILABLE = True
except Exception:
    SKLEARN_AVAILABLE = False
    logging.getLogger(__name__).warning("scikit-learn not available, ML features disabled")

from sqlalchemy.orm import Session

from app.core_config import get_settings
from app.models.database import DailyMetrics, Workout
from sqlalchemy import func

# Import new personalization models
from app.ml.models.sleep_optimizer import train_sleep_optimizer
from app.ml.models.workout_timing_optimizer import train_workout_timing_optimizer
from app.ml.models.strain_tolerance_model import train_strain_tolerance_model
from app.ml.models.recovery_velocity import train_recovery_velocity_model
from app.ml.models.calorie_gps_model import train_calorie_gps_model

logger = logging.getLogger(__name__)

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except Exception:
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
        logger.warning(f"ML libraries not available for user {user_id}")
        return {
            "status": "skipped_no_ml_libs",
            "trained_models": [],
            "message": "ML libraries not installed (Light Backend mode)",
        }

    df = _load_training_frame(db, user_id)
    logger.info(f"Training models for user {user_id}: {len(df)} days of data available")
    
    if df.empty or len(df) < MIN_ROWS:
        logger.warning(f"Insufficient data for user {user_id}: {len(df)} days (need {MIN_ROWS})")
        return {
            "status": "not_enough_data",
            "trained_models": [],
            "days_used": len(df),
            "message": f"Need at least {MIN_ROWS} days of data to train. You have {len(df)} days.",
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
    logger.info(f"Model directory for user {user_id}: {version_dir}")
    
    rec_path = version_dir / "recovery_model.joblib"
    burnout_path = version_dir / "burnout_model.joblib"
    cal_path = version_dir / "calorie_model.joblib"
    xgb_rec_path = version_dir / "xgb_recovery_model.joblib"
    xgb_burnout_path = version_dir / "xgb_burnout_model.joblib"
    cluster_path = version_dir / "behavior_clusters.pkl"
    
    # New personalization models
    sleep_opt_path = version_dir / "sleep_optimizer.joblib"
    workout_timing_path = version_dir / "workout_timing_optimizer.joblib"
    strain_tolerance_path = version_dir / "strain_tolerance_model.joblib"
    recovery_velocity_path = version_dir / "recovery_velocity_model.joblib"
    calorie_gps_path = version_dir / "calorie_gps_model.joblib"

    # Save RandomForest models with error handling
    try:
        joblib.dump(rf_reg_model, rec_path)
        logger.info(f"✓ Saved recovery model to {rec_path}")
    except Exception as e:
        logger.error(f"✗ Failed to save recovery model to {rec_path}: {e}", exc_info=True)
    
    try:
        joblib.dump(rf_cls_model, burnout_path)
        logger.info(f"✓ Saved burnout model to {burnout_path}")
    except Exception as e:
        logger.error(f"✗ Failed to save burnout model to {burnout_path}: {e}", exc_info=True)
    
    try:
        joblib.dump(rf_cal_model, cal_path)
        logger.info(f"✓ Saved calorie model to {cal_path}")
    except Exception as e:
        logger.error(f"✗ Failed to save calorie model to {cal_path}: {e}", exc_info=True)

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

    # Train new personalization models
    personalization_models = []
    
    # 1. Sleep Optimizer - learns optimal bedtime
    try:
        sleep_result = train_sleep_optimizer(db, user_id)
        if sleep_result and sleep_result.get('model'):
            # Save full result dictionary with metrics (similar to calorie_gps and recovery_velocity)
            joblib.dump({
                'model': sleep_result['model'],
                'optimal_bedtime_hour': sleep_result.get('optimal_bedtime_hour'),
                'optimal_bedtime': sleep_result.get('optimal_bedtime'),
                'confidence': sleep_result.get('confidence'),
                'sample_size': sleep_result.get('sample_size'),
            }, sleep_opt_path)
            personalization_models.append("sleep_optimizer")
            logger.info(f"Sleep optimizer trained and saved for user {user_id}")
    except Exception as e:
        logger.warning(f"Failed to train sleep optimizer: {e}", exc_info=True)
    
    # 2. Workout Timing Optimizer - learns best workout times
    try:
        timing_result = train_workout_timing_optimizer(db, user_id, is_mobile)
        if timing_result and timing_result.get('model'):
            # Save full result dictionary with metrics (similar to calorie_gps and recovery_velocity)
            joblib.dump({
                'model': timing_result['model'],
                'model_type': timing_result.get('model_type'),
                'optimal_hour': timing_result.get('optimal_hour'),
                'optimal_time': timing_result.get('optimal_time'),
                'optimal_category': timing_result.get('optimal_category'),
                'confidence': timing_result.get('confidence'),
                'sample_size': timing_result.get('sample_size'),
                'improvement_pct': timing_result.get('improvement_pct'),
            }, workout_timing_path)
            personalization_models.append("workout_timing_optimizer")
            logger.info(f"Workout timing optimizer trained and saved for user {user_id}")
    except Exception as e:
        logger.warning(f"Failed to train workout timing optimizer: {e}", exc_info=True)
    
    # 3. Strain Tolerance Model - learns safe strain thresholds
    try:
        strain_result = train_strain_tolerance_model(db, user_id)
        if strain_result and strain_result.get('model'):
            # Save both model and scaler
            joblib.dump({
                'model': strain_result['model'],
                'scaler': strain_result['scaler'],
                'safe_threshold': strain_result.get('safe_threshold')
            }, strain_tolerance_path)
            personalization_models.append("strain_tolerance")
            logger.info(f"Strain tolerance model trained and saved for user {user_id}")
    except Exception as e:
        logger.warning(f"Failed to train strain tolerance model: {e}", exc_info=True)
    
    # 4. Recovery Velocity Model - predicts days to recover from low recovery
    try:
        velocity_result = train_recovery_velocity_model(db, user_id)
        if velocity_result and velocity_result.get('model'):
            # Save both model and scaler with metadata
            joblib.dump({
                'model': velocity_result['model'],
                'scaler': velocity_result['scaler'],
                'mae': velocity_result.get('mae'),
                'r2': velocity_result.get('r2'),
                'sample_size': velocity_result.get('sample_size')
            }, recovery_velocity_path)
            personalization_models.append("recovery_velocity")
            logger.info(f"Recovery velocity model trained and saved for user {user_id}")
    except Exception as e:
        logger.warning(f"Failed to train recovery velocity model: {e}", exc_info=True)
    
    # 5. Calorie GPS Model - hyper-personalized calorie burn prediction
    try:
        calorie_gps_result = train_calorie_gps_model(db, user_id, is_mobile)
        if calorie_gps_result and calorie_gps_result.get('model'):
            # Save model with all metadata including feature_importance
            joblib.dump({
                'model': calorie_gps_result['model'],
                'xgb_model': calorie_gps_result.get('xgb_model'),
                'feature_cols': calorie_gps_result['feature_cols'],
                'mae': calorie_gps_result.get('mae'),
                'r2': calorie_gps_result.get('r2'),
                'sample_size': calorie_gps_result.get('sample_size'),
                'feature_importance': calorie_gps_result.get('feature_importance', {}),
                'workout_types': calorie_gps_result.get('workout_types', [])
            }, calorie_gps_path)
            personalization_models.append("calorie_gps")
            logger.info(f"Calorie GPS model trained and saved for user {user_id}")
            logger.info(f"  Metrics: MAE={calorie_gps_result.get('mae', 'N/A'):.2f}, R²={calorie_gps_result.get('r2', 'N/A'):.3f}, samples={calorie_gps_result.get('sample_size', 0)}")
    except Exception as e:
        logger.warning(f"Failed to train Calorie GPS model: {e}", exc_info=True)
    
    # Lightweight clustering to personalize patterns (per user only)
    cluster_model = None
    if len(df) >= 6:
        cluster_features = df[["strain_score", "sleep_hours", "hrv", "sleep_debt"]]
        k = min(3, len(df))  # small, per-user clusters
        cluster_model = KMeans(n_clusters=k, n_init="auto", random_state=7)
        cluster_model.fit(cluster_features)
        joblib.dump(cluster_model, cluster_path)

    all_models = trained_models + personalization_models + (["cluster"] if cluster_model else [])
    
    # Verify models were actually saved
    saved_models = []
    model_paths_to_check = [
        ("recovery", rec_path),
        ("burnout", burnout_path),
        ("calorie", cal_path),
    ]
    
    if XGBOOST_AVAILABLE:
        model_paths_to_check.extend([
            ("xgb_recovery", xgb_rec_path),
            ("xgb_burnout", xgb_burnout_path),
        ])
    
    model_paths_to_check.extend([
        ("sleep_optimizer", sleep_opt_path),
        ("workout_timing", workout_timing_path),
        ("strain_tolerance", strain_tolerance_path),
        ("recovery_velocity", recovery_velocity_path),
        ("calorie_gps", calorie_gps_path),
    ])
    
    if cluster_model:
        model_paths_to_check.append(("cluster", cluster_path))
    
    for model_name, model_path in model_paths_to_check:
        if model_path.exists():
            saved_models.append(model_name)
            file_size = model_path.stat().st_size
            logger.info(f"✓ Model file exists: {model_path} ({file_size} bytes)")
        else:
            logger.warning(f"✗ Model file missing: {model_path}")
    
    logger.info(
        f"Training completed for user {user_id}: {len(all_models)} models trained, {len(saved_models)} files verified",
        extra={
            "user_id": user_id,
            "model_version": settings.model_version,
            "trained_models": all_models,
            "saved_models": saved_models,
            "model_directory": str(version_dir),
        },
    )

    result = {
        "status": "ok",
        "model_version": settings.model_version,
        "trained_models": all_models,
        "days_used": len(df),
        "start_date": df["date"].min(),
        "end_date": df["date"].max(),
        "recovery_model_path": str(rec_path),
        "burnout_model_path": str(burnout_path),
        "calorie_model_path": str(cal_path),
        "cluster_model_path": str(cluster_path) if cluster_model else None,
        "sleep_optimizer_path": str(sleep_opt_path) if "sleep_optimizer" in personalization_models else None,
        "workout_timing_path": str(workout_timing_path) if "workout_timing_optimizer" in personalization_models else None,
        "strain_tolerance_path": str(strain_tolerance_path) if "strain_tolerance" in personalization_models else None,
        "recovery_velocity_path": str(recovery_velocity_path) if "recovery_velocity" in personalization_models else None,
        "calorie_gps_path": str(calorie_gps_path) if "calorie_gps" in personalization_models else None,
    }
    
    if XGBOOST_AVAILABLE:
        result["xgb_recovery_model_path"] = str(xgb_rec_path)
        result["xgb_burnout_model_path"] = str(xgb_burnout_path)
    
    return result
