from datetime import date
from sqlalchemy.orm import Session

from app.models.database import DailyMetrics
from app.schemas.api import (
    DashboardSummary,
    TodayMetrics,
    TodayRecommendation,
    TomorrowPrediction,
    HealthScores,
)
from app.ml.models.rule_based_recommender import recommend
from app.ml.models.model_loader import load_model
import numpy as np

def build_dashboard(db: Session, user_id: str):
    dm = (
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .order_by(DailyMetrics.date.desc())
        .first()
    )
    if not dm:
        return DashboardSummary(
            today=TodayMetrics(
                date=date.today(), recovery_score=None, strain_score=None,
                sleep_hours=None, hrv=None, workouts_count=0
            ),
            recommendation=TodayRecommendation(
                intensity_level="LIGHT", focus="general",
                workout_type="Walk", notes="No data yet."
            ),
            tomorrow=TomorrowPrediction(recovery_forecast=50, confidence=0.3),
            scores=HealthScores(consistency=0, burnout_risk=0, sleep_health=0),
        )

    today = TodayMetrics(
        date=dm.date,
        recovery_score=dm.recovery_score,
        strain_score=dm.strain_score,
        sleep_hours=dm.sleep_hours,
        hrv=dm.hrv,
        workouts_count=dm.workouts_count or 0,
    )

    # Rule pick
    intensity, focus, wtype, notes = recommend(dm)

    rec_model = load_model(user_id, "rec_")
    pred_val = 60
    conf = 0.4
    if rec_model:
        X = np.array([[dm.strain_score, dm.sleep_hours, dm.hrv, dm.acute_chronic_ratio]])
        pred_val = float(rec_model.predict(X)[0])
        conf = 0.8

    tomorrow = TomorrowPrediction(
        recovery_forecast=pred_val,
        confidence=conf,
    )

    scores = HealthScores(
        consistency=60,
        burnout_risk=40,
        sleep_health=70,
    )

    return DashboardSummary(
        today=today,
        recommendation=TodayRecommendation(
            intensity_level=intensity,
            focus=focus,
            workout_type=wtype,
            notes=notes,
        ),
        tomorrow=tomorrow,
        scores=scores,
    )
