import io
import zipfile
from datetime import date, timedelta

import pandas as pd

from app.ml.feature_engineering.daily_features import recompute_daily_features
from app.ml.models.trainer import train_user_models
from app.services.analysis.dashboard_service import get_dashboard_summary
from app.services.ingestion.whoop_ingestion import ingest_whoop_zip
from app.models.database import DailyMetrics, Workout


def _make_zip(tmp_path):
    sleep_csv = pd.DataFrame({"date": ["2024-01-01", "2024-01-02"], "sleep_hours": [7.5, 6.8]})
    recovery_csv = pd.DataFrame(
        {"date": ["2024-01-01", "2024-01-02"], "recovery_score": [75, 62], "hrv": [80, 72], "resting_heart_rate": [50, 52]}
    )
    strain_csv = pd.DataFrame({"date": ["2024-01-01", "2024-01-02"], "strain": [12.3, 9.5]})
    workouts_csv = pd.DataFrame(
        {
            "date": ["2024-01-01", "2024-01-02"],
            "start": ["2024-01-01T10:00:00", "2024-01-02T11:00:00"],
            "end": ["2024-01-01T11:00:00", "2024-01-02T12:00:00"],
            "duration": [60, 55],
            "sport": ["Running", "Strength"],
            "strain": [12.3, 9.5],
        }
    )

    zip_path = tmp_path / "whoop.zip"
    with zipfile.ZipFile(zip_path, "w") as z:
        for fname, df in [
            ("sleep.csv", sleep_csv),
            ("recovery.csv", recovery_csv),
            ("strain.csv", strain_csv),
            ("workouts.csv", workouts_csv),
        ]:
            buf = io.StringIO()
            df.to_csv(buf, index=False)
            z.writestr(fname, buf.getvalue())
    return zip_path


def test_ingestion_creates_rows(db_session, temp_dirs, tmp_path):
    zip_path = _make_zip(tmp_path)
    with open(zip_path, "rb") as f:
        ingest_whoop_zip(db_session, "user-1", f)

    all_days = db_session.query(DailyMetrics).filter(DailyMetrics.user_id == "user-1").all()
    workouts = db_session.query(Workout).filter(Workout.user_id == "user-1").all()

    assert len(all_days) == 2
    assert len(workouts) == 2
    assert all(day.strain_score is not None for day in all_days)


def test_feature_engineering_computes_baselines(db_session, temp_dirs):
    base_day = date(2024, 1, 1)
    for i in range(1, 16):
        db_session.add(
            DailyMetrics(
                user_id="feat-user",
                date=base_day + timedelta(days=i),
                recovery_score=60 + i,
                strain_score=10 + i * 0.5,
                sleep_hours=7 + (i % 3) * 0.2,
                hrv=70 + i,
                resting_hr=50 - i * 0.1,
            )
        )
    db_session.commit()

    recompute_daily_features(db_session, "feat-user")

    latest = (
        db_session.query(DailyMetrics)
        .filter(DailyMetrics.user_id == "feat-user")
        .order_by(DailyMetrics.date.desc())
        .first()
    )

    assert latest.recovery_baseline_7d is not None
    assert latest.hrv_z_score is not None
    assert latest.acute_chronic_ratio is not None


def test_training_writes_model_files(db_session, temp_dirs):
    base_day = date(2024, 1, 1)
    for i in range(1, 25):
        db_session.add(
            DailyMetrics(
                user_id="trainer",
                date=base_day + timedelta(days=i),
                recovery_score=65 + (i % 5),
                strain_score=8 + i * 0.3,
                sleep_hours=7.5,
                hrv=75 + i * 0.2,
                resting_hr=52,
            )
        )
    db_session.commit()

    recompute_daily_features(db_session, "trainer")
    summary = train_user_models(db_session, "trainer")

    assert summary["status"] == "ok"
    assert (temp_dirs.model_dir in summary["recovery_model_path"]) is True


def test_dashboard_summary_structure(db_session, temp_dirs):
    today = date.today()
    dm = DailyMetrics(
        user_id="dash",
        date=today,
        recovery_score=70,
        strain_score=10,
        sleep_hours=7.2,
        hrv=75,
        resting_hr=52,
        workouts_count=1,
    )
    db_session.add(dm)
    db_session.commit()

    recompute_daily_features(db_session, "dash")
    summary = get_dashboard_summary(db_session, "dash")

    assert summary.today.date == today
    assert summary.recommendation.intensity_level is not None
    assert isinstance(summary.risk_flags, list)
