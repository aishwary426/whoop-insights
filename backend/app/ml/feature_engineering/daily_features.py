from sqlalchemy.orm import Session
from app.models.database import DailyMetrics, Workout

def recompute_daily_features(db: Session, user_id: str):
    rows = (
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .order_by(DailyMetrics.date.asc())
        .all()
    )

    for i, dm in enumerate(rows):
        workouts = db.query(Workout).filter(Workout.user_id == user_id, Workout.date==dm.date).all()
        dm.workouts_count = len(workouts)
        dm.strain_score = sum(w.strain or 0 for w in workouts)

    db.commit()
