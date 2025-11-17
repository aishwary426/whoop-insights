import os
import uuid
import pandas as pd
from sqlalchemy.orm import Session
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
import joblib

from app.models.database import DailyMetrics
from app.core_config import get_settings

settings = get_settings()

def load_df(db: Session, user_id: str):
    rows = (
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .order_by(DailyMetrics.date.asc())
        .all()
    )
    if not rows:
        return pd.DataFrame()

    data = []
    for r in rows:
        data.append({
            "date": r.date,
            "recovery": r.recovery_score,
            "strain": r.strain_score,
            "sleep": r.sleep_hours,
            "hrv": r.hrv,
            "acr": r.acute_chronic_ratio,
        })

    df = pd.DataFrame(data)
    df = df.sort_values("date")
    df["target_recovery"] = df["recovery"].shift(-1)
    df["target_class"] = pd.cut(
        df["recovery"],
        bins=[0, 30, 60, 100],
        labels=[0, 1, 2],
        include_lowest=True,
    )
    df = df.dropna()
    return df

def train_user_models(db: Session, user_id: str):
    df = load_df(db, user_id)
    if df.empty:
        return None

    run_id = str(uuid.uuid4())
    os.makedirs(f"{settings.model_dir}/{user_id}", exist_ok=True)

    X = df[["strain", "sleep", "hrv", "acr"]]
    y_rec = df["target_recovery"]
    y_cls = df["target_class"]

    rec_model = RandomForestRegressor(n_estimators=200)
    rec_model.fit(X, y_rec)

    cls_model = RandomForestClassifier(n_estimators=200)
    cls_model.fit(X, y_cls)

    rec_path = f"{settings.model_dir}/{user_id}/rec_{run_id}.joblib"
    cls_path = f"{settings.model_dir}/{user_id}/cls_{run_id}.joblib"

    joblib.dump(rec_model, rec_path)
    joblib.dump(cls_model, cls_path)

    return {"run_id": run_id, "rec_path": rec_path, "cls_path": cls_path}
