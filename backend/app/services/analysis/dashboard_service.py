from __future__ import annotations

import logging
from datetime import date
from typing import List, Optional

import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.database import DailyMetrics, Insight, InsightType, IntensityLevel, Workout
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


def _simple_recommendation(dm: DailyMetrics) -> TodayRecommendation:
    """Generate simple rule-based recommendations without ML."""
    recovery = dm.recovery_score or 50
    strain = dm.strain_score or 0
    sleep = dm.sleep_hours or 7

    # Simple rules based on recovery score
    if recovery >= 67:
        intensity = IntensityLevel.HIGH
        workout_type = "High-intensity training"
        focus = "Push your limits"
        notes = "Your recovery is strong. Go for an intense workout!"
    elif recovery >= 34:
        intensity = IntensityLevel.MODERATE
        workout_type = "Moderate activity"
        focus = "Balanced training"
        notes = "Moderate recovery. Keep training but listen to your body."
    else:
        intensity = IntensityLevel.LIGHT
        workout_type = "Light activity or rest"
        focus = "Recovery"
        notes = "Low recovery. Focus on rest and light movement."

    # Adjust based on sleep
    if sleep < 6:
        intensity = IntensityLevel.LIGHT
        notes += " Low sleep detected - prioritize rest."

    # Adjust based on recent strain
    if strain > 15:
        notes += " High strain yesterday - consider recovery."

    return TodayRecommendation(
        intensity_level=intensity,
        focus=focus,
        workout_type=workout_type,
        optimal_time="Morning" if recovery > 50 else "Afternoon",
        notes=notes,
    )


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
                notes="No data yet — upload your WHOOP data to get started!",
            ),
            tomorrow=TomorrowPrediction(recovery_forecast=None, confidence=0.0),
            scores=HealthScores(consistency=0, burnout_risk=0, sleep_health=0, injury_risk=0),
            risk_flags=[],
        )

    # Simple rule-based recommendation
    recommendation = _simple_recommendation(dm)

    # Calculate basic health scores without ML
    sleep_health = float(max(min(100 - (dm.sleep_debt or 0) * 5, 100), 0))
    injury_risk = float(min(max((dm.acute_chronic_ratio or 0) * 30, 0), 100))

    # Simple burnout risk based on recovery score
    burnout_risk = float(max(100 - (dm.recovery_score or 50), 0))

    scores = HealthScores(
        consistency=float(dm.consistency_score or 0),
        burnout_risk=burnout_risk,
        sleep_health=sleep_health,
        injury_risk=injury_risk,
    )

    tomorrow = TomorrowPrediction(recovery_forecast=None, confidence=0.0)
    risk_flags = sorted(set(_derive_risk_flags(dm)))

    return DashboardSummary(
        today=_to_today_metrics(dm),
        recommendation=recommendation,
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
        points = []
        for row in values:
            val = 0
            # Try to get daily total from extra (physiological cycles)
            if row.extra:
                # Check for direct calories
                for key in ['energy_burned_(cal)', 'energy_burned', 'calories', 'total_calories', 'kilojoules']:
                    if key in row.extra:
                        try:
                            raw_val = float(row.extra[key])
                            if 'kilojoules' in key:
                                val = raw_val / 4.184  # Convert kJ to kcal
                            else:
                                val = raw_val
                            break
                        except (ValueError, TypeError):
                            continue

            # Fallback to workout sum if no daily total found
            if val == 0:
                val = calorie_map.get(row.date, 0)

            points.append(TrendPoint(date=row.date, value=int(val)))
        return points

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
    """Derive basic patterns without ML."""
    rows = (
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .order_by(DailyMetrics.date.asc())
        .all()
    )
    insights: List[InsightItem] = []
    if not rows:
        return InsightsFeed(user_id=user_id, insights=[])

    # Calculate simple averages using pandas
    weekday_sleep = [r.sleep_hours for r in rows if r.date.weekday() < 5 and r.sleep_hours]
    weekend_sleep = [r.sleep_hours for r in rows if r.date.weekday() >= 5 and r.sleep_hours]

    if weekday_sleep and weekend_sleep:
        avg_weekday = sum(weekday_sleep) / len(weekday_sleep)
        avg_weekend = sum(weekend_sleep) / len(weekend_sleep)
        delta = float(avg_weekend - avg_weekday)

        insights.append(
            InsightItem(
                insight_type=InsightType.SLEEP_ANALYSIS.value,
                title="Weekends vs weekdays sleep",
                description=f"You sleep {abs(delta):.1f}h {'more' if delta > 0 else 'less'} on weekends.",
                confidence=0.6,
                data={"delta_hours": delta},
                period_start=rows[0].date,
                period_end=rows[-1].date,
            )
        )

    # High strain analysis
    high_strain = [r for r in rows if (r.strain_score or 0) > 12]
    if high_strain:
        recoveries = [r.recovery_score for r in high_strain if r.recovery_score]
        if recoveries:
            avg_recovery = sum(recoveries) / len(recoveries)
            insights.append(
                InsightItem(
                    insight_type=InsightType.PERFORMANCE_CORRELATION.value,
                    title="Recovery after high strain",
                    description=f"Average recovery after >12 strain days is {avg_recovery:.0f}.",
                    confidence=0.5,
                    data={"sample": len(high_strain)},
                    period_start=rows[0].date,
                    period_end=rows[-1].date,
                )
            )

    return InsightsFeed(user_id=user_id, insights=insights)


def get_calorie_analysis(db: Session, user_id: str) -> CalorieAnalysis:
    """Analyze workout history to find the most efficient calorie burners."""
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
        .having(func.count(Workout.id) >= 3)
        .all()
    )

    if not stats:
        return CalorieAnalysis(
            winner=None,
            explanation="Not enough workout data to analyze efficiency yet. Log at least 3 sessions of different activities.",
            comparison=[]
        )

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

    efficiencies.sort(key=lambda x: x.avg_cal_per_min, reverse=True)
    winner = efficiencies[0]

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
    """Analyze how journal entries affect next day's recovery."""
    rows = (
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .order_by(DailyMetrics.date.asc())
        .all()
    )

    if len(rows) < 7:
        return []

    journal_keys = set()
    for r in rows:
        if r.extra:
            journal_keys.update(r.extra.keys())

    insights = []

    for key in journal_keys:
        with_factor = []
        without_factor = []

        for i, r in enumerate(rows[:-1]):
            next_day = rows[i+1]
            if next_day.recovery_score is None:
                continue

            val = r.extra.get(key) if r.extra else None

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

        avg_with = sum(with_factor) / len(with_factor)
        avg_without = sum(without_factor) / len(without_factor)
        diff = avg_with - avg_without

        if abs(diff) > 0.5:
            impact = "Positive" if diff > 0 else "Negative"
            clean_key = key.replace("Question: ", "").replace("_", " ").capitalize()

            insights.append(
                InsightItem(
                    insight_type="journal_impact",
                    title=f"{clean_key}",
                    description=f"{impact} Impact: Recovery is {abs(diff):.1f}% {'higher' if diff > 0 else 'lower'} when you do this.",
                    confidence=0.8,
                    data={
                        "factor": clean_key,
                        "impact_val": diff,
                        "avg_with": avg_with,
                        "avg_without": avg_without
                    }
                )
            )

    insights.sort(key=lambda x: abs(x.data["impact_val"]), reverse=True)
    return insights
