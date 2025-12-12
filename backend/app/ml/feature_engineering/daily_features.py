from __future__ import annotations

from typing import List

import numpy as np
import pandas as pd
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.database import DailyMetrics, Workout

TARGET_SLEEP_HOURS = 8.0


def _rolling_mean(series: pd.Series, window: int) -> pd.Series:
    return series.rolling(window=window, min_periods=max(3, window // 2)).mean().shift(1)


def _rolling_std(series: pd.Series, window: int) -> pd.Series:
    return series.rolling(window=window, min_periods=max(3, window // 2)).std(ddof=0).shift(1)


def _zscore(value, mean, std):
    if pd.isna(value) or pd.isna(mean) or pd.isna(std) or std == 0:
        return None
    return float((value - mean) / std)


def _sleep_debt(series: pd.Series) -> pd.Series:
    """Positive value means debt (below target)."""
    debt = (TARGET_SLEEP_HOURS - series).clip(lower=0)
    return debt.rolling(window=7, min_periods=3).sum()


def _consistency(series: pd.Series) -> pd.Series:
    std = series.rolling(window=14, min_periods=5).std(ddof=0)
    return (100 - std.fillna(0) * 10).clip(lower=0, upper=100)


def _prepare_dataframe(rows: List[DailyMetrics]) -> pd.DataFrame:
    payload = []
    for r in rows:
        payload.append(
            {
                "id": r.id,
                "date": r.date,
                "recovery_score": r.recovery_score,
                "strain_score": r.strain_score,
                "sleep_hours": r.sleep_hours,
                "hrv": r.hrv,
                "resting_hr": r.resting_hr,
                "workouts_count": r.workouts_count or 0,
            }
        )
    df = pd.DataFrame(payload)
    if df.empty:
        return df
    df = df.sort_values("date").reset_index(drop=True)
    return df


def compute_daily_feature_frame(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    metric_prefix = {
        "recovery_score": "recovery",
        "strain_score": "strain",
        "sleep_hours": "sleep",
        "hrv": "hrv",
        "resting_hr": "rhr",
    }

    for metric, prefix in metric_prefix.items():
        df[metric] = pd.to_numeric(df[metric], errors="coerce")
        mean_7 = _rolling_mean(df[metric], 7)
        mean_30 = _rolling_mean(df[metric], 28)
        std_7d = _rolling_std(df[metric], 7)

        df[f"{prefix}_baseline_7d"] = mean_7
        df[f"{prefix}_baseline_30d"] = mean_30
        df[f"{prefix}_z_score"] = [_zscore(val, mean, std) for val, mean, std in zip(df[metric], mean_7, std_7d)]

    acute = _rolling_mean(df["strain_score"], 7)
    chronic = _rolling_mean(df["strain_score"], 28).replace({0: pd.NA})
    ratio = acute / chronic
    df["acute_chronic_ratio"] = ratio.replace([np.inf, -np.inf], pd.NA)
    df["sleep_debt"] = _sleep_debt(df["sleep_hours"])
    df["consistency_score"] = _consistency(df["sleep_hours"])

    return df


def recompute_daily_features(db: Session, user_id: str) -> int:
    """Recompute engineered features for a user's daily metrics."""
    rows: List[DailyMetrics] = (
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .order_by(DailyMetrics.date.asc())
        .all()
    )
    if not rows:
        return 0

    # Sync workouts counts and strain aggregates first
    workout_summaries = {
        d: {"count": c, "strain_sum": s or 0}
        for d, c, s in db.query(
            Workout.date, func.count(Workout.id), func.sum(Workout.strain)
        )
        .filter(Workout.user_id == user_id)
        .group_by(Workout.date)
        .all()
    }

    for dm in rows:
        summary = workout_summaries.get(dm.date, {"count": dm.workouts_count or 0, "strain_sum": dm.strain_score or 0})
        dm.workouts_count = summary["count"]
        if dm.strain_score is None or dm.strain_score == 0:
            dm.strain_score = summary["strain_sum"]

    df = _prepare_dataframe(rows)
    df = compute_daily_feature_frame(df)
    if df.empty:
        db.commit()
        return 0

    # Persist engineered features per row
    for _, row in df.iterrows():
        dm = next(r for r in rows if r.id == row["id"])
        dm.strain_baseline_7d = row.get("strain_baseline_7d")
        dm.strain_baseline_30d = row.get("strain_baseline_30d")
        dm.recovery_baseline_7d = row.get("recovery_baseline_7d")
        dm.recovery_baseline_30d = row.get("recovery_baseline_30d")
        dm.sleep_baseline_7d = row.get("sleep_baseline_7d")
        dm.sleep_baseline_30d = row.get("sleep_baseline_30d")
        dm.hrv_baseline_7d = row.get("hrv_baseline_7d")
        dm.hrv_baseline_30d = row.get("hrv_baseline_30d")
        dm.rhr_baseline_7d = row.get("rhr_baseline_7d")
        dm.rhr_baseline_30d = row.get("rhr_baseline_30d")

        dm.recovery_z_score = row.get("recovery_z_score")
        dm.strain_z_score = row.get("strain_z_score")
        dm.sleep_z_score = row.get("sleep_z_score")
        dm.hrv_z_score = row.get("hrv_z_score")
        dm.rhr_z_score = row.get("rhr_z_score")

        dm.acute_chronic_ratio = row.get("acute_chronic_ratio")
        dm.sleep_debt = row.get("sleep_debt")
        dm.consistency_score = row.get("consistency_score")

    db.commit()
    return len(rows)
