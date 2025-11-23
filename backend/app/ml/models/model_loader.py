from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Optional ML dependencies
try:
    import joblib
    JOBLIB_AVAILABLE = True
    logger.info("joblib is available for model loading")
except ImportError as e:
    JOBLIB_AVAILABLE = False
    joblib = None
    logger.error(f"joblib not available: {e}. Models cannot be loaded. Please install joblib: pip install joblib>=1.3.0")

from app.core_config import get_settings

settings = get_settings()


def _latest_version_path(base: Path) -> Optional[Path]:
    versions = [p for p in base.iterdir() if p.is_dir()]
    if not versions:
        return None
    # Sort by name for determinism; version naming should make this meaningful.
    return sorted(versions)[-1]


def load_latest_models(user_id: str) -> dict:
    """Load latest saved models for user if they exist."""
    if not JOBLIB_AVAILABLE:
        logger.warning("joblib not available, cannot load models")
        return {}
    
    user_dir = Path(settings.model_dir) / user_id
    if not user_dir.exists():
        return {}

    version_dir = _latest_version_path(user_dir)
    if not version_dir:
        return {}

    models = {}
    rec_path = version_dir / "recovery_model.joblib"
    burnout_path = version_dir / "burnout_model.joblib"
    xgb_rec_path = version_dir / "xgb_recovery_model.joblib"
    xgb_burnout_path = version_dir / "xgb_burnout_model.joblib"
    cluster_path = version_dir / "behavior_clusters.pkl"
    
    # New personalization models
    sleep_opt_path = version_dir / "sleep_optimizer.joblib"
    workout_timing_path = version_dir / "workout_timing_optimizer.joblib"
    strain_tolerance_path = version_dir / "strain_tolerance_model.joblib"
    recovery_velocity_path = version_dir / "recovery_velocity_model.joblib"
    calorie_gps_path = version_dir / "calorie_gps_model.joblib"

    # Load RandomForest models (baseline)
    if rec_path.exists():
        models["recovery"] = joblib.load(rec_path)
    if burnout_path.exists():
        models["burnout"] = joblib.load(burnout_path)
    
    # Load XGBoost models (preferred, better performance)
    if xgb_rec_path.exists():
        models["xgb_recovery"] = joblib.load(xgb_rec_path)
    if xgb_burnout_path.exists():
        models["xgb_burnout"] = joblib.load(xgb_burnout_path)
    
    if cluster_path.exists():
        models["cluster"] = joblib.load(cluster_path)
    
    # Load personalization models
    if sleep_opt_path.exists():
        models["sleep_optimizer"] = joblib.load(sleep_opt_path)
    if workout_timing_path.exists():
        models["workout_timing"] = joblib.load(workout_timing_path)
    if strain_tolerance_path.exists():
        models["strain_tolerance"] = joblib.load(strain_tolerance_path)
    if recovery_velocity_path.exists():
        models["recovery_velocity"] = joblib.load(recovery_velocity_path)
    if calorie_gps_path.exists():
        models["calorie_gps"] = joblib.load(calorie_gps_path)

    return models
