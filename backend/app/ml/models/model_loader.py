from pathlib import Path
from typing import Optional

import joblib
<<<<<<< HEAD
import logging
from pathlib import Path
from typing import Optional
=======

>>>>>>> 57703a5 (Initial commit - Whoop Insights Pro)
from app.core_config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


<<<<<<< HEAD
def load_latest_model(user_id: str, model_name: str) -> Optional:
    """
    Load the latest version of a specific model for a user.
    
    Args:
        user_id: User identifier
        model_name: Model name (e.g., 'recovery_predictor', 'burnout_classifier')
    
    Returns:
        Loaded model or None if not found
    """
    model_dir = Path(settings.model_dir) / user_id
    
    if not model_dir.exists():
        logger.debug(f"No model directory for user {user_id}")
        return None
    
    # Find all version directories
    version_dirs = [d for d in model_dir.iterdir() if d.is_dir()]
    
    if not version_dirs:
        logger.debug(f"No model versions found for user {user_id}")
        return None
    
    # Get latest version (by name, assuming timestamp format)
    latest_version = sorted(version_dirs, key=lambda x: x.name, reverse=True)[0]
    
    model_path = latest_version / f"{model_name}.joblib"
    
    if not model_path.exists():
        logger.debug(f"Model {model_name} not found in {latest_version}")
        return None
    
    try:
        model = joblib.load(model_path)
        logger.info(f"Loaded {model_name} from {model_path}")
        return model
    except Exception as e:
        logger.error(f"Error loading model {model_path}: {e}")
        return None


def get_model_version(user_id: str) -> Optional[str]:
    """Get the latest model version string for a user."""
    model_dir = Path(settings.model_dir) / user_id
    
    if not model_dir.exists():
        return None
    
    version_dirs = [d for d in model_dir.iterdir() if d.is_dir()]
    
    if not version_dirs:
        return None
    
    latest_version = sorted(version_dirs, key=lambda x: x.name, reverse=True)[0]
    return latest_version.name


# Backward compatibility
def load_model(user_id: str, prefix: str):
    """Legacy function for backward compatibility."""
    # Try to map old prefixes to new model names
    model_map = {
        'rec_': 'recovery_predictor',
        'cls_': 'burnout_classifier',
    }
    
    model_name = model_map.get(prefix, prefix.rstrip('_'))
    return load_latest_model(user_id, model_name)
=======
def _latest_version_path(base: Path) -> Optional[Path]:
    versions = [p for p in base.iterdir() if p.is_dir()]
    if not versions:
        return None
    # Sort by name for determinism; version naming should make this meaningful.
    return sorted(versions)[-1]


def load_latest_models(user_id: str) -> dict:
    """Load latest saved models for user if they exist."""
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

    return models
>>>>>>> 57703a5 (Initial commit - Whoop Insights Pro)
