import os
import joblib
import logging
from pathlib import Path
from typing import Optional
from app.core_config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


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
