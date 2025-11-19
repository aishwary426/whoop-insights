from __future__ import annotations

import logging
from datetime import date, datetime
from typing import List, Optional

import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from app.models.database import DailyMetrics, Insight, InsightType, IntensityLevel
from app.schemas.api import (
    DashboardSummary,
    HealthScores,
    InsightItem,
    InsightsFeed,
    TodayMetrics,
    TodayRecommendation,
    TomorrowPrediction,
    TrendPoint,
    TrendsResponse,
    TrendsSeries,
    CalorieAnalysis,
    WorkoutEfficiency,
)
from app.models.database import DailyMetrics, Insight, InsightType, IntensityLevel, Workout
from sqlalchemy import func
from app.ml.models.rule_based_recommender import recommend
from app.ml.models.model_loader import load_latest_models

logger = logging.getLogger(__name__)


def _latest_daily_metrics(db: Session, user_id: str) -> Optional[DailyMetrics]:
    return (
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .order_by(DailyMetrics.date.desc())
        .first()
    )


def _to_today_metrics(dm: DailyMetrics) -> TodayMetrics:
    return TodayMetrics(
        date=dm.date,
        recovery_score=dm.recovery_score,
        strain_score=dm.strain_score,
        sleep_hours=dm.sleep_hours,
        hrv=dm.hrv,
        resting_hr=dm.resting_hr,
        workouts_count=dm.workouts_count or 0,
    )


def _derive_risk_flags(dm: DailyMetrics) -> List[str]:
    flags = []
    if (dm.acute_chronic_ratio or 0) > 1.6:
        flags.append("High acute load vs chronic load")
    if dm.hrv_z_score is not None and dm.hrv_z_score < -1:
        flags.append("Sustained low HRV vs baseline")
    if dm.sleep_debt and dm.sleep_debt > 6:
        flags.append("Sleep debt accumulating past 6h")
    if dm.recovery_z_score is not None and dm.recovery_z_score < -1.2:
        flags.append("Recovery well below baseline")
    return flags


def get_dashboard_summary(db: Session, user_id: str) -> DashboardSummary:
    dm = _latest_daily_metrics(db, user_id)
    if not dm:
        return DashboardSummary(
            today=TodayMetrics(
                date=date.today(),
                recovery_score=None,
                strain_score=None,
                sleep_hours=None,
                hrv=None,
                resting_hr=None,
                workouts_count=0,
            ),
            recommendation=TodayRecommendation(
                intensity_level=IntensityLevel.LIGHT,
                focus="start",
                workout_type="Light walk",
                optimal_time="Anytime",
                notes="No data yet — defaulting to gentle movement.",
            ),
            tomorrow=TomorrowPrediction(recovery_forecast=None, confidence=0.0),
            scores=HealthScores(consistency=0, burnout_risk=0, sleep_health=0, injury_risk=0),
            risk_flags=[],
        )

    models = load_latest_models(user_id)
    rule_plan = recommend(dm, models)

    feature_vector = np.array(
        [
            [
                dm.strain_score or 0,
                dm.sleep_hours or 0,
                dm.hrv or 0,
                dm.acute_chronic_ratio or 0,
                dm.sleep_debt or 0,
                dm.consistency_score or 0,
            ]
        ]
    )

    rec_forecast = None
    confidence = 0.35
    burnout_risk = 40.0

    # Prefer XGBoost models for better accuracy, fallback to RandomForest
    recovery_model = models.get("xgb_recovery") or models.get("recovery")
    burnout_model = models.get("xgb_burnout") or models.get("burnout")
    
    if recovery_model:
        try:
            rec_forecast = float(recovery_model.predict(feature_vector)[0])
            # Confidence calculation: XGBoost provides better calibrated predictions
            if hasattr(recovery_model, 'estimators_'):  # RandomForest
                preds = np.stack([tree.predict(feature_vector) for tree in recovery_model.estimators_])
                confidence = float(np.clip(1 - preds.std() / 50, 0.35, 0.9))
            else:  # XGBoost - use feature importance and prediction stability
                # XGBoost models are generally more confident
                confidence = 0.75
        except Exception:  # noqa: BLE001
            confidence = 0.7 if recovery_model == models.get("xgb_recovery") else 0.6

    if burnout_model:
        try:
            proba = burnout_model.predict_proba(feature_vector)[0]
            burnout_risk = float(proba[0] * 100)  # class 0 = low recovery bucket
        except Exception:  # noqa: BLE001
            burnout_risk = 50.0

    sleep_health = float(max(min(100 - (dm.sleep_debt or 0) * 5, 100), 0))
    injury_risk = float(min(max((dm.acute_chronic_ratio or 0) * 30, 0), 100))

    scores = HealthScores(
        consistency=float(dm.consistency_score or 0),
        burnout_risk=burnout_risk,
        sleep_health=sleep_health,
        injury_risk=injury_risk,
    )

    tomorrow = TomorrowPrediction(recovery_forecast=rec_forecast, confidence=confidence)
    risk_flags = sorted(set(rule_plan["risk_flags"] + _derive_risk_flags(dm)))

    return DashboardSummary(
        today=_to_today_metrics(dm),
        recommendation=TodayRecommendation(
            intensity_level=rule_plan["intensity_level"],
            focus=rule_plan["focus"],
            workout_type=rule_plan["workout_type"],
            optimal_time=rule_plan["optimal_time"],
            notes=rule_plan["notes"],
            calories=rule_plan.get("predicted_calories"),
        ),
        tomorrow=tomorrow,
        scores=scores,
        risk_flags=risk_flags,
    )


def get_trends(db: Session, user_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None) -> TrendsResponse:
    query = db.query(DailyMetrics).filter(DailyMetrics.user_id == user_id)
    if start_date:
        query = query.filter(DailyMetrics.date >= start_date)
    if end_date:
        query = query.filter(DailyMetrics.date <= end_date)

    rows = query.order_by(DailyMetrics.date.asc()).all()

    # Fetch calorie data from workouts
    workout_query = (
        db.query(Workout.date, func.sum(Workout.calories).label("total_calories"))
        .filter(Workout.user_id == user_id)
        .group_by(Workout.date)
    )
    if start_date:
        workout_query = workout_query.filter(Workout.date >= start_date)
    if end_date:
        workout_query = workout_query.filter(Workout.date <= end_date)
    
    calorie_rows = workout_query.all()
    calorie_map = {r.date: r.total_calories for r in calorie_rows}

    def _series(values: List[DailyMetrics], attr: str) -> List[TrendPoint]:
        return [TrendPoint(date=row.date, value=getattr(row, attr)) for row in values]

    def _calorie_series(values: List[DailyMetrics]) -> List[TrendPoint]:
        # Use DailyMetrics dates to ensure alignment, but fetch value from calorie_map
        return [TrendPoint(date=row.date, value=calorie_map.get(row.date, 0)) for row in values]

    def _extra_series(values: List[DailyMetrics], key_part: str) -> List[TrendPoint]:
        points = []
        for row in values:
            val = None
            if row.extra:
                # Find key containing key_part (e.g. "blood_oxygen" in "blood_oxygen_%")
                for k, v in row.extra.items():
                    if key_part in k:
                        try:
                            val = float(v)
                        except (ValueError, TypeError):
                            pass
                        break
            points.append(TrendPoint(date=row.date, value=val))
        return points

    return TrendsResponse(
        user_id=user_id,
        series=TrendsSeries(
            recovery=_series(rows, "recovery_score"),
            strain=_series(rows, "strain_score"),
            sleep=_series(rows, "sleep_hours"),
            hrv=_series(rows, "hrv"),
            calories=_calorie_series(rows),
            spo2=_extra_series(rows, "blood_oxygen"),
            skin_temp=_extra_series(rows, "skin_temp"),
            resting_hr=_series(rows, "resting_hr"),
            respiratory_rate=_extra_series(rows, "respiratory"),
        ),
    )


def generate_insights_for_user(db: Session, user_id: str) -> InsightsFeed:
    """Derive medium-horizon patterns and persist them."""
    rows = (
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .order_by(DailyMetrics.date.asc())
        .all()
    )
    insights: List[Insight] = []
    if not rows:
        return InsightsFeed(user_id=user_id, insights=[])

    # Example insight: weekday vs weekend consistency
    weekday_sleep = [r.sleep_hours for r in rows if r.date.weekday() < 5 and r.sleep_hours]
    weekend_sleep = [r.sleep_hours for r in rows if r.date.weekday() >= 5 and r.sleep_hours]
    if weekday_sleep and weekend_sleep:
        delta = float(np.mean(weekend_sleep) - np.mean(weekday_sleep))
        title = "Weekends vs weekdays sleep"
        desc = f"You sleep {abs(delta):.1f}h {'more' if delta > 0 else 'less'} on weekends."
        insights.append(
            Insight(
                user_id=user_id,
                insight_type=InsightType.SLEEP_ANALYSIS,
                title=title,
                description=desc,
                confidence=0.6,
                data={"delta_hours": delta},
                period_start=rows[0].date,
                period_end=rows[-1].date,
            )
        )

    # Example insight: high strain vs recovery
    high_strain = [r for r in rows if (r.strain_score or 0) > 12]
    if high_strain:
        avg_recovery_after_high = np.nanmean([r.recovery_score for r in high_strain])
        insights.append(
            Insight(
                user_id=user_id,
                insight_type=InsightType.PERFORMANCE_CORRELATION,
                title="Recovery after high strain",
                description=f"Average recovery after >12 strain days is {avg_recovery_after_high:.0f}.",
                confidence=0.5,
                data={"sample": len(high_strain)},
                period_start=rows[0].date,
                period_end=rows[-1].date,
            )
        )

    for insight in insights:
        db.merge(insight)
    db.commit()

    return InsightsFeed(
        user_id=user_id,
        insights=[
            InsightItem(
                insight_type=i.insight_type.value,
                title=i.title,
                description=i.description,
                confidence=i.confidence or 0,
                period_start=i.period_start,
                period_end=i.period_end,
                data=i.data,
            )
            for i in insights
        ],
    )


def get_calorie_analysis(db: Session, user_id: str) -> CalorieAnalysis:
    """Analyze workout history to find the most efficient calorie burners."""
    # Aggregate stats by sport type
    # We filter for workouts > 10 mins to avoid noise
    stats = (
        db.query(
            Workout.sport_type,
            func.avg(Workout.calories / Workout.duration_minutes).label("avg_cal_min"),
            func.avg(Workout.avg_hr).label("avg_hr"),
            func.count(Workout.id).label("count")
        )
        .filter(Workout.user_id == user_id)
        .filter(Workout.duration_minutes > 10)
        .filter(Workout.calories > 0)
        .group_by(Workout.sport_type)
        .having(func.count(Workout.id) >= 3)  # Need at least 3 sessions for valid stats
        .all()
    )

    if not stats:
        return CalorieAnalysis(
            winner=None,
            explanation="Not enough workout data to analyze efficiency yet. Log at least 3 sessions of different activities.",
            comparison=[]
        )

    # Convert to schema objects
    efficiencies = []
    for s in stats:
        efficiencies.append(
            WorkoutEfficiency(
                sport_type=s.sport_type,
                avg_cal_per_min=float(s.avg_cal_min or 0),
                avg_hr=float(s.avg_hr or 0),
                sample_size=s.count
            )
        )

    # Sort by efficiency
    efficiencies.sort(key=lambda x: x.avg_cal_per_min, reverse=True)
    winner = efficiencies[0]

    # Generate explanation
    explanation = f"Based on your history, **{winner.sport_type}** is your most efficient calorie burner at {winner.avg_cal_per_min:.1f} cal/min."
    
    if len(efficiencies) > 1:
        runner_up = efficiencies[1]
        diff = ((winner.avg_cal_per_min - runner_up.avg_cal_per_min) / runner_up.avg_cal_per_min) * 100
        explanation += f" It burns {diff:.0f}% more calories per minute than {runner_up.sport_type}, "
        
        if winner.avg_hr < runner_up.avg_hr:
             explanation += f"surprisingly with a lower average heart rate ({winner.avg_hr:.0f} vs {runner_up.avg_hr:.0f} bpm), suggesting better biomechanical efficiency."
        else:
             explanation += f"driven by a higher average heart rate ({winner.avg_hr:.0f} vs {runner_up.avg_hr:.0f} bpm)."

    return CalorieAnalysis(
        winner=winner,
        explanation=explanation,
        comparison=efficiencies
    )


def get_journal_insights(db: Session, user_id: str) -> List[InsightItem]:
    """Analyze how journal entries (from 'extra' column) affect next day's recovery."""
    rows = (
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .order_by(DailyMetrics.date.asc())
        .all()
    )
    
    if len(rows) < 7:
        return []

    # Map date -> recovery_score
    recovery_map = {r.date: r.recovery_score for r in rows if r.recovery_score is not None}
    
    # Collect all potential journal keys
    journal_keys = set()
    for r in rows:
        if r.extra:
            journal_keys.update(r.extra.keys())

    insights = []
    
    for key in journal_keys:
        # Skip non-journal looking keys if possible, but for now process all
        # We look for boolean-like values (Yes/No, true/false, 0/1)
        
        with_factor = []
        without_factor = []
        
        for i, r in enumerate(rows[:-1]): # Look at today's journal vs tomorrow's recovery
            next_day = rows[i+1]
            if next_day.recovery_score is None:
                continue
                
            val = r.extra.get(key) if r.extra else None
            
            # Check if "positive" answer
            is_present = False
            if isinstance(val, str):
                is_present = val.lower() in ['yes', 'true', '1']
            elif isinstance(val, (int, float)):
                is_present = val > 0
            elif isinstance(val, bool):
                is_present = val
            
            if is_present:
                with_factor.append(next_day.recovery_score)
            else:
                without_factor.append(next_day.recovery_score)
        
        if len(with_factor) < 3 or len(without_factor) < 3:
            continue
            
        avg_with = np.mean(with_factor)
        avg_without = np.mean(without_factor)
        diff = avg_with - avg_without
        
        # Significant impact threshold (lowered to track everything)
        if abs(diff) > 0.5:
            impact = "Positive" if diff > 0 else "Negative"
            clean_key = key.replace("Question: ", "").replace("_", " ").capitalize()
            
            insights.append(
                InsightItem(
                    insight_type="journal_impact",
                    title=f"{clean_key}",
                    description=f"{impact} Impact: Recovery is {abs(diff):.1f}% {'higher' if diff > 0 else 'lower'} when you do this.",
                    confidence=0.8, # Simple correlation
                    data={
                        "factor": clean_key,
                        "impact_val": diff,
                        "avg_with": avg_with,
                        "avg_without": avg_without
                    }
                )
            )
            
    # Sort by absolute impact
    insights.sort(key=lambda x: abs(x.data["impact_val"]), reverse=True)
    return insights
