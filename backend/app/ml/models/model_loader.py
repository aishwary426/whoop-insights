import os
import joblib
from app.core_config import get_settings

settings = get_settings()

def load_model(user_id: str, prefix: str):
    folder = f"{settings.model_dir}/{user_id}"
    if not os.path.exists(folder):
        return None
    files = [f for f in os.listdir(folder) if f.startswith(prefix)]
    if not files:
        return None
    latest = sorted(files)[-1]
    return joblib.load(f"{folder}/{latest}")
