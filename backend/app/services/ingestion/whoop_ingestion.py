import uuid
from datetime import datetime
import pandas as pd
from sqlalchemy.orm import Session

from app.models.database import Upload, UploadStatus, User, Workout, DailyMetrics
from app.utils.zip_utils import save_upload_file, unzip_whoop_export

def ensure_user(db: Session, user_id: str, email=None, name=None):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(id=user_id, email=email or f"{user_id}@auto.com", name=name)
        db.add(user)
        db.commit()
    return user

def ingest_whoop_zip(db: Session, user_id: str, file_obj):
    ensure_user(db, user_id)

    upload_id = str(uuid.uuid4())
    zip_path = save_upload_file(user_id=user_id, upload_id=upload_id, file_obj=file_obj)

    upload = Upload(
        id=upload_id,
        user_id=user_id,
        file_path=zip_path,
        status=UploadStatus.PROCESSING,
        created_at=datetime.utcnow(),
    )
    db.add(upload)
    db.commit()

    try:
        extracted = unzip_whoop_export(zip_path)

        # Minimal parser: only workouts.csv
        workouts = []
        for root, _, files in os.walk(extracted):
            for f in files:
                if "workout" in f.lower() and f.endswith(".csv"):
                    df = pd.read_csv(f"{root}/{f}")
                    df.columns = [c.lower().strip().replace(" ", "_") for c in df.columns]

                    for _, row in df.iterrows():
                        w = Workout(
                            user_id=user_id,
                            workout_id=str(uuid.uuid4()),
                            date=pd.to_datetime(row.get("date", datetime.utcnow())).date(),
                            duration_minutes=float(row.get("duration", 0)),
                            sport_type=row.get("sport", "unknown"),
                            avg_hr=float(row.get("avg_hr", 0)),
                            strain=float(row.get("strain", 0)),
                        )
                        db.add(w)
                    db.commit()

        # Create daily rows
        dates = (
            db.query(Workout.date)
            .filter(Workout.user_id == user_id)
            .distinct()
            .all()
        )

        for (d,) in dates:
            dm = DailyMetrics(
                user_id=user_id,
                date=d,
                workouts_count=db.query(Workout).filter(Workout.user_id==user_id, Workout.date==d).count(),
                strain_score=sum([s[0] for s in db.query(Workout.strain).filter(Workout.user_id==user_id, Workout.date==d).all()])
            )
            db.add(dm)
        db.commit()

        upload.status = UploadStatus.COMPLETED
        upload.completed_at = datetime.utcnow()
        db.commit()

    except Exception as e:
        upload.status = UploadStatus.FAILED
        upload.error_message = str(e)
        db.commit()
        raise

    return upload
