from __future__ import annotations

import logging
from datetime import date
from typing import List, Optional, Tuple

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
    CalorieGPSResponse,
    CalorieGPSWorkout,
    CalorieGPSModelMetrics,
)
from app.ml.models.model_loader import load_latest_models
from app.ml.models.sleep_optimizer import predict_optimal_bedtime
from app.ml.models.workout_timing_optimizer import predict_optimal_workout_time
from app.ml.models.strain_tolerance_model import predict_burnout_risk
from app.ml.models.recovery_velocity import predict_recovery_days
from app.ml.models.calorie_gps_model import predict_workout_recommendations
import numpy as np

logger = logging.getLogger(__name__)

# Try to import scipy for statistical tests, fallback to manual calculation
try:
    from scipy import stats as scipy_stats
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False
    logger.warning("scipy not available, using manual statistical calculations")

# Caching configuration
from cachetools import TTLCache, cached
from cachetools.keys import hashkey

# Cache for expensive analytics (1 hour TTL, max 100 items)
analytics_cache = TTLCache(maxsize=100, ttl=3600)
# Cache for dashboard summary (5 minutes TTL, max 100 items)
summary_cache = TTLCache(maxsize=100, ttl=300)

def _user_cache_key(db, user_id, *args, **kwargs):
    """Create a cache key based on user_id, date, and arguments, ignoring db session."""
    # Include today's date in cache key so cache invalidates daily
    today = date.today()
    return hashkey(user_id, today, *args, **kwargs)


def _latest_daily_metrics(db: Session, user_id: str) -> Optional[DailyMetrics]:
    """Get today's daily metrics for the user, or the latest if today's data is not available."""
    today = date.today()
    # First try to get today's data
    today_metrics = (
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .filter(DailyMetrics.date == today)
        .first()
    )
    # If today's data exists, return it
    if today_metrics:
        logger.debug(f"Found today's metrics for user {user_id}: date={today_metrics.date}")
        return today_metrics
    # Otherwise, return the latest available data (fallback for when today's data hasn't synced yet)
    latest_metrics = (
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .order_by(DailyMetrics.date.desc())
        .first()
    )
    if latest_metrics:
        logger.info(f"No today's data found for user {user_id}, using latest available: date={latest_metrics.date} (today is {today})")
    return latest_metrics


def _to_today_metrics(dm: DailyMetrics) -> TodayMetrics:
    light_sleep = None
    awake_time = None
    respiratory_rate = None
    spo2 = None
    skin_temp = None
    sleep_perf = None
    avg_hr = None
    max_hr = None
    calories = None

    if dm.extra:
        # Helper to safely get float
        def get_float(keys):
            for k in keys:
                if k in dm.extra:
                    try:
                        val = dm.extra[k]
                        if isinstance(val, str):
                            val = val.replace('%', '').replace(',', '').strip()
                        return float(val)
                    except (ValueError, TypeError):
                        pass
            return None

        rem_sleep = get_float(['rem_sleep_min', 'rem_sleep_duration_(min)', 'rem_sleep_duration', 'rem_minutes'])
        deep_sleep = get_float(['deep_sleep_min', 'deep_sleep_duration_(min)', 'deep_sleep_duration', 'deep_sleep_minutes', 'sws_duration_(min)'])
        light_sleep = get_float(['light_sleep_min', 'light_sleep_duration_(min)', 'light_sleep_duration'])
        awake_time = get_float(['awake_time_min', 'awake_duration_(min)', 'awake_duration'])
        sleep_efficiency = get_float(['sleep_efficiency_%', 'sleep_efficiency', 'sleep_efficiency_percentage'])
        sleep_perf = get_float(['sleep_performance_%', 'sleep_performance', 'sleep_performance_percentage'])
        respiratory_rate = get_float(['respiratory_rate', 'respiratory_rate_(rpm)'])
        spo2 = get_float(['spo2_percentage', 'blood_oxygen_%', 'blood_oxygen'])
        # Filter out invalid SpO2 values (normal range is 95-100%, filter out values below 50%)
        if spo2 is not None and spo2 < 50.0:
            spo2 = None
        skin_temp = get_float(['skin_temp_celsius', 'skin_temp_c', 'skin_temperature'])
        avg_hr = get_float(['average_heart_rate', 'avg_hr', 'avg_heart_rate'])
        max_hr = get_float(['max_heart_rate', 'max_hr', 'max_heart_rate'])
        calories = get_float(['calories', 'energy_burned_(cal)', 'energy_burned'])

    return TodayMetrics(
        date=dm.date,
        recovery_score=dm.recovery_score,
        strain_score=dm.strain_score,
        sleep_hours=dm.sleep_hours,
        hrv=dm.hrv,
        resting_hr=dm.resting_hr,
        workouts_count=dm.workouts_count or 0,
        rem_sleep_min=rem_sleep,
        deep_sleep_min=deep_sleep,
        light_sleep_min=light_sleep,
        awake_time_min=awake_time,
        sleep_efficiency=sleep_efficiency,
        sleep_performance_percentage=sleep_perf,
        respiratory_rate=respiratory_rate,
        spo2_percentage=spo2,
        skin_temp_celsius=skin_temp,
        avg_heart_rate=avg_hr,
        max_heart_rate=max_hr,
        calories=calories,
    )


def _predict_tomorrow_recovery(db: Session, user_id: str, dm: DailyMetrics) -> TomorrowPrediction:
    """
    Predict tomorrow's recovery score using ML model if available, otherwise rule-based.
    """
    # Try to load and use ML model
    models = load_latest_models(user_id)
    
    # Prefer XGBoost recovery model, fallback to RandomForest
    recovery_model = models.get("xgb_recovery") or models.get("recovery")
    
    if recovery_model:
        try:
            # Use the same features as training: strain_score, sleep_hours, hrv, acute_chronic_ratio, sleep_debt, consistency_score
            features = np.array([[
                float(dm.strain_score or 0),
                float(dm.sleep_hours or 7.5),
                float(dm.hrv or 50),
                float(dm.acute_chronic_ratio or 1.0),
                float(dm.sleep_debt or 0),
                float(dm.consistency_score or 0),
            ]])
            
            prediction = recovery_model.predict(features)[0]
            
            # Clip to valid recovery range [0, 100]
            prediction = max(0, min(100, float(prediction)))
            
            # Higher confidence if using XGBoost
            confidence = 0.8 if "xgb_recovery" in models else 0.7
            
            logger.debug(f"ML recovery prediction for user {user_id}: {prediction:.1f}% (confidence: {confidence})")
            
            return TomorrowPrediction(
                recovery_forecast=prediction,
                confidence=confidence
            )
        except Exception as e:
            logger.warning(f"Error using ML model for recovery prediction: {e}", exc_info=True)
    
    # Rule-based fallback REMOVED - Return empty prediction if ML fails
    return TomorrowPrediction(
        recovery_forecast=None,
        confidence=0.0
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


def _simple_recommendation(db: Session, user_id: str, dm: DailyMetrics) -> TodayRecommendation:
    """Generate recommendations with ML personalization if available, otherwise rule-based."""
    recovery = dm.recovery_score or 50
    strain = dm.strain_score or 0
    sleep = dm.sleep_hours or 7

    # Try to load ML models
    models = load_latest_models(user_id)
    
    # Start with rule-based recommendation
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

    # Use ML personalization if available
    optimal_time = "Morning" if recovery > 50 else "Afternoon"
    
    # Enhance with workout timing optimizer
    try:
        timing_pred = predict_optimal_workout_time(
            db, user_id, recovery, strain, dm.date.weekday()
        )
        if timing_pred:
            optimal_time = timing_pred.get('optimal_time', optimal_time)
            if timing_pred.get('improvement_pct', 0) > 5:
                notes += f" 💡 Personalized: {timing_pred.get('optimal_category', '').title()} workouts result in {timing_pred.get('improvement_pct', 0):+.0f}% better recovery."
    except Exception as e:
        logger.debug(f"Could not use workout timing optimizer: {e}")
    
    # Enhance with strain tolerance model
    try:
        strain_pred = predict_burnout_risk(
            db, user_id, strain, recovery, sleep, dm.hrv or 50, dm.acute_chronic_ratio or 1.0
        )
        if strain_pred and strain_pred.get('burnout_risk', 0) > 50:
            notes += f" ⚠️ Strain alert: {strain_pred.get('recommendation', '')}"
            if intensity == IntensityLevel.HIGH:
                intensity = IntensityLevel.MODERATE
    except Exception as e:
        logger.debug(f"Could not use strain tolerance model: {e}")

    return TodayRecommendation(
        intensity_level=intensity,
        focus=focus,
        workout_type=workout_type,
        optimal_time=optimal_time,
        notes=notes,
    )


@cached(cache=summary_cache, key=_user_cache_key)
def get_dashboard_summary(db: Session, user_id: str) -> DashboardSummary:
    today = date.today()
    logger.info(f"get_dashboard_summary called for {user_id}, today is {today}")
    dm = _latest_daily_metrics(db, user_id)
    if dm:
        logger.info(f"Daily metrics for {user_id}: date={dm.date}, is_today={dm.date == today}")
    else:
        logger.info(f"No daily metrics found for {user_id}")
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

    # Generate recommendation with ML personalization if available
    recommendation = _simple_recommendation(db, user_id, dm)
    
    # Add personalized sleep recommendation to notes if available
    try:
        sleep_pred = predict_optimal_bedtime(
            db, user_id, dm.strain_score or 0, dm.recovery_score or 50, dm.date.weekday()
        )
        if sleep_pred and sleep_pred.get('confidence', 0) > 0.5:
            # Add sleep insight to risk flags as a positive recommendation
            if not any('bedtime' in flag.lower() for flag in risk_flags):
                risk_flags.append(f"💤 Optimal bedtime: {sleep_pred.get('optimal_bedtime')} ({sleep_pred.get('reasoning', '')})")
    except Exception as e:
        logger.debug(f"Could not generate sleep recommendation: {e}")

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

    # Predict tomorrow's recovery using ML model if available
    tomorrow = _predict_tomorrow_recovery(db, user_id, dm)
    risk_flags = sorted(set(_derive_risk_flags(dm)))

    return DashboardSummary(
        today=_to_today_metrics(dm),
        recommendation=recommendation,
        tomorrow=tomorrow,
        scores=scores,
        risk_flags=risk_flags,
    )


@cached(cache=analytics_cache, key=_user_cache_key)
def get_trends(db: Session, user_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None) -> TrendsResponse:
    # Check if user has WHOOP API data (limited to 25 records)
    # Check if user has WHOOP API data (limited to 25 records)
    from app.models.database import Upload, UploadStatus
    
    has_whoop_api_data = db.query(Upload).filter(
        Upload.user_id == user_id,
        Upload.data_source == "whoop_api"
    ).first() is not None
    
    # Check if user has a completed ZIP upload (which contains full history)
    has_zip_data = db.query(Upload).filter(
        Upload.user_id == user_id,
        Upload.data_source == "zip",
        Upload.status == UploadStatus.COMPLETED
    ).first() is not None
    
    query = db.query(DailyMetrics).filter(DailyMetrics.user_id == user_id)
    if start_date:
        query = query.filter(DailyMetrics.date >= start_date)
    if end_date:
        query = query.filter(DailyMetrics.date <= end_date)

    # Limit to 25 records ONLY if data came from WHOOP API and NO zip file was uploaded
    # If they have a zip file, we want to show full history even if they also connected API
    if has_whoop_api_data and not has_zip_data:
        rows = query.order_by(DailyMetrics.date.desc()).limit(25).all()
        # Reverse to get ascending order
        rows = list(reversed(rows))
        logger.info(f"Limited to 25 records for WHOOP API user {user_id} (no zip upload found)")
    else:
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
                            raw_val = row.extra[key]
                            if isinstance(raw_val, str):
                                raw_val = raw_val.replace(",", "").strip()
                            
                            val_float = float(raw_val)
                            if 'kilojoules' in key:
                                val = val_float / 4.184  # Convert kJ to kcal
                            else:
                                val = val_float
                            break
                        except (ValueError, TypeError):
                            continue

            # Fallback to workout sum if no daily total found
            if val == 0:
                val = calorie_map.get(row.date, 0)

            points.append(TrendPoint(date=row.date, value=int(val)))
        return points

    def _extra_series(values: List[DailyMetrics], key_part: str, alternative_keys: List[str] = None, min_valid_value: float = None) -> List[TrendPoint]:
        points = []
        for row in values:
            val = None
            if row.extra:
                # Build list of keys to search for
                keys_to_search = [key_part]
                if alternative_keys:
                    keys_to_search.extend(alternative_keys)
                
                # Find key containing any of the key parts
                for k, v in row.extra.items():
                    if any(search_key in k for search_key in keys_to_search):
                        try:
                            val_str = str(v).replace(",", "").strip()
                            val = float(val_str)
                            # Filter out invalid values (e.g., 0 for SpO2 which should be 95-100%)
                            if min_valid_value is not None and val < min_valid_value:
                                val = None
                        except (ValueError, TypeError):
                            pass
                        if val is not None:
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
            spo2=_extra_series(rows, "blood_oxygen", alternative_keys=["spo2_percentage", "spo2"], min_valid_value=50.0),
            skin_temp=_extra_series(rows, "skin_temp"),
            resting_hr=_series(rows, "resting_hr"),
            respiratory_rate=_extra_series(rows, "respiratory"),
        ),
        is_whoop_api_limited=has_whoop_api_data,
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


@cached(cache=analytics_cache, key=_user_cache_key)
def get_personalization_insights(db: Session, user_id: str) -> List[InsightItem]:
    """Get personalized insights from ML models (sleep, workout timing, strain tolerance)."""
    insights = []
    dm = _latest_daily_metrics(db, user_id)
    
    if not dm:
        return insights
    
    # 1. Sleep optimization insight
    try:
        sleep_pred = predict_optimal_bedtime(
            db, user_id, dm.strain_score or 0, dm.recovery_score or 50, dm.date.weekday()
        )
        if sleep_pred and sleep_pred.get('confidence', 0) > 0.5:
            insights.append(InsightItem(
                insight_type="sleep_optimization",
                title="Personalized Sleep Window",
                description=(
                    f"Your optimal bedtime is {sleep_pred.get('optimal_bedtime')}. "
                    f"{sleep_pred.get('reasoning', '')}"
                ),
                confidence=sleep_pred.get('confidence', 0.7),
                data=sleep_pred
            ))
    except Exception as e:
        logger.debug(f"Could not generate sleep insight: {e}")
    
    # 2. Workout timing insight
    try:
        timing_pred = predict_optimal_workout_time(
            db, user_id, dm.recovery_score or 50, dm.strain_score or 0, dm.date.weekday()
        )
        if timing_pred and timing_pred.get('improvement_pct', 0) > 5:
            insights.append(InsightItem(
                insight_type="workout_timing",
                title="Optimal Workout Timing",
                description=(
                    f"You perform best with {timing_pred.get('optimal_category', '')} workouts. "
                    f"They result in {timing_pred.get('improvement_pct', 0):+.0f}% better next-day recovery "
                    f"compared to your average."
                ),
                confidence=timing_pred.get('confidence', 0.7),
                data=timing_pred
            ))
    except Exception as e:
        logger.debug(f"Could not generate workout timing insight: {e}")
    
    # 3. Strain tolerance insight
    try:
        strain_pred = predict_burnout_risk(
            db, user_id,
            dm.strain_score or 0,
            dm.recovery_score or 50,
            dm.sleep_hours or 7.5,
            dm.hrv or 50,
            dm.acute_chronic_ratio or 1.0
        )
        if strain_pred and strain_pred.get('safe_threshold'):
            insights.append(InsightItem(
                insight_type="strain_tolerance",
                title="Personalized Strain Threshold",
                description=strain_pred.get('recommendation', ''),
                confidence=strain_pred.get('confidence', 0.7),
                data={
                    'safe_threshold': strain_pred.get('safe_threshold'),
                    'burnout_risk': strain_pred.get('burnout_risk', 0),
                    'recovery_drop_pct': strain_pred.get('recovery_drop_pct', 0),
                    'examples': strain_pred.get('examples', [])  # Historical examples
                }
            ))
    except Exception as e:
        logger.debug(f"Could not generate strain tolerance insight: {e}")
    
    # 4. Recovery velocity insight (always show if model is available, with contextual message)
    try:
        if dm.recovery_score is not None:
            current_recovery = dm.recovery_score
            if current_recovery < 67:
                # Recovery is low - show prediction
                velocity_pred = predict_recovery_days(
                    db, user_id,
                    current_recovery,
                    dm.strain_score or 0,
                    dm.sleep_hours or 7.5,
                    dm.hrv or 50,
                    dm.acute_chronic_ratio or 1.0
                )
                if velocity_pred and velocity_pred.get('days_to_recover'):
                    insights.append(InsightItem(
                        insight_type="recovery_velocity",
                        title="Recovery Velocity Prediction",
                        description=velocity_pred.get('message', ''),
                        confidence=velocity_pred.get('confidence', 0.7),
                        data={
                            'days_to_recover': velocity_pred.get('days_to_recover'),
                            'current_recovery': velocity_pred.get('current_recovery'),
                            'strain_score': velocity_pred.get('strain_score'),
                            'examples': velocity_pred.get('examples', []),
                            'model_metadata': velocity_pred.get('model_metadata', {}),
                            'show_always': True,
                        }
                    ))
            else:
                # Recovery is high - still show the card with historical context
                # Try to get historical examples for context
                from app.ml.models.recovery_velocity import get_historical_recovery_episodes
                historical_examples = get_historical_recovery_episodes(
                    db, user_id, current_recovery, dm.strain_score or 0
                )
                
                # Check if model exists to show metadata
                from app.ml.models.model_loader import load_latest_models
                models = load_latest_models(user_id)
                velocity_model_data = models.get("recovery_velocity")
                
                model_metadata = {}
                if velocity_model_data and isinstance(velocity_model_data, dict):
                    model_metadata = {
                        'method': 'ML Model (Linear Regression)',
                        'features': [
                            'Current Recovery Score',
                            'Strain Score',
                            'Sleep Hours',
                            'HRV (Heart Rate Variability)',
                            'Acute/Chronic Load Ratio',
                            'HRV Trend (3-day change)'
                        ],
                        'r2_score': velocity_model_data.get('r2'),
                        'mae': velocity_model_data.get('mae'),
                        'sample_size': velocity_model_data.get('sample_size'),
                    }
                
                # Show card with message that recovery is good
                insights.append(InsightItem(
                    insight_type="recovery_velocity",
                    title="Recovery Velocity Prediction",
                    description=f"You're in good recovery ({current_recovery:.0f}%). This model predicts how fast you recover from low recovery states.",
                    confidence=1.0,
                    data={
                        'days_to_recover': None,
                        'current_recovery': current_recovery,
                        'strain_score': dm.strain_score or 0,
                        'examples': historical_examples[:5],  # Show up to 5 examples
                        'model_metadata': model_metadata,
                        'show_always': True,
                        'recovery_high': True,
                    }
                ))
    except Exception as e:
        logger.debug(f"Could not generate recovery velocity insight: {e}")
    
    return insights


def _calculate_confidence_interval(data: List[float], confidence: float = 0.95) -> Tuple[float, float]:
    """Calculate confidence interval for a dataset."""
    if not data or len(data) < 2:
        return (0.0, 0.0)
    
    n = len(data)
    mean = np.mean(data)
    std_err = np.std(data, ddof=1) / np.sqrt(n) if n > 1 else 0
    
    if SCIPY_AVAILABLE:
        # Use t-distribution for small samples
        t_critical = scipy_stats.t.ppf((1 + confidence) / 2, df=n - 1)
    else:
        # Approximate with normal distribution for large samples, t for small
        if n < 30:
            # Rough approximation: t-value for 95% CI
            t_critical = 2.0 if n < 10 else 1.96
        else:
            t_critical = 1.96  # z-value for 95% CI
    
    margin = t_critical * std_err
    return (mean - margin, mean + margin)


def _calculate_t_test(group1: List[float], group2: List[float]) -> Tuple[float, float]:
    """Calculate t-test statistic and p-value between two groups."""
    if len(group1) < 2 or len(group2) < 2:
        return (0.0, 1.0)
    
    if SCIPY_AVAILABLE:
        try:
            t_stat, p_value = scipy_stats.ttest_ind(group1, group2, equal_var=False)
            return (float(t_stat), float(p_value))
        except Exception as e:
            logger.warning(f"Error in scipy t-test: {e}")
            return (0.0, 1.0)
    else:
        # Manual t-test calculation (Welch's t-test approximation)
        n1, n2 = len(group1), len(group2)
        mean1, mean2 = np.mean(group1), np.mean(group2)
        var1, var2 = np.var(group1, ddof=1), np.var(group2, ddof=1)
        
        # Pooled standard error
        se = np.sqrt(var1/n1 + var2/n2)
        if se == 0:
            return (0.0, 1.0)
        
        t_stat = (mean1 - mean2) / se
        
        # Approximate degrees of freedom (Welch-Satterthwaite)
        df = (var1/n1 + var2/n2)**2 / ((var1/n1)**2/(n1-1) + (var2/n2)**2/(n2-1))
        df = max(1, int(df))
        
        # Approximate p-value using t-distribution (rough approximation)
        # For simplicity, use a lookup table approximation
        abs_t = abs(t_stat)
        if abs_t > 2.5:
            p_value = 0.01  # Very significant
        elif abs_t > 2.0:
            p_value = 0.05  # Significant
        elif abs_t > 1.5:
            p_value = 0.10  # Marginally significant
        else:
            p_value = 0.20  # Not significant
        
        return (float(t_stat), p_value)


@cached(cache=analytics_cache, key=_user_cache_key)
def get_journal_insights(db: Session, user_id: str) -> List[InsightItem]:
    """Analyze how journal entries affect next day's recovery with statistical significance."""
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
        with_dates = []
        without_dates = []

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
                with_dates.append(next_day.date)
            else:
                without_factor.append(next_day.recovery_score)
                without_dates.append(next_day.date)

        if len(with_factor) < 3 or len(without_factor) < 3:
            continue

        # Calculate statistics
        avg_with = np.mean(with_factor)
        avg_without = np.mean(without_factor)
        diff = avg_with - avg_without
        
        # Calculate confidence intervals
        ci_with = _calculate_confidence_interval(with_factor)
        ci_without = _calculate_confidence_interval(without_factor)
        
        # Calculate t-test for statistical significance
        t_stat, p_value = _calculate_t_test(with_factor, without_factor)
        
        # Determine if statistically significant (p < 0.05)
        is_significant = p_value < 0.05
        
        # Only include insights with meaningful impact
        if abs(diff) < 0.5:
            continue

        impact = "Positive" if diff > 0 else "Negative"
        clean_key = key.replace("Question: ", "").replace("_", " ").capitalize()
        
        # Format description with statistical significance
        instance_count = len(with_factor)
        if is_significant:
            description = f"{clean_key} {'improves' if diff > 0 else 'reduces'} your recovery by {abs(diff):.1f}% on average. Based on {instance_count} day{'s' if instance_count != 1 else ''} of data - this is a reliable pattern."
        else:
            description = f"{clean_key} {'improves' if diff > 0 else 'reduces'} your recovery by {abs(diff):.1f}% on average. Based on {instance_count} day{'s' if instance_count != 1 else ''} of data - we need more data to be confident."

        insights.append(
            InsightItem(
                insight_type="journal_impact",
                title=f"{clean_key}",
                description=description,
                confidence=1.0 - p_value if is_significant else 0.5,  # Higher confidence for significant results
                data={
                    "factor": clean_key,
                    "factor_key": key,  # Store original key for API calls
                    "impact_val": float(diff),
                    "impact_percent": float(abs(diff)),
                    "avg_with": float(avg_with),
                    "avg_without": float(avg_without),
                    "instance_count": instance_count,
                    "total_days": len(without_factor),
                    "p_value": float(p_value),
                    "t_statistic": float(t_stat),
                    "is_significant": is_significant,
                    "ci_with": [float(ci_with[0]), float(ci_with[1])],
                    "ci_without": [float(ci_without[0]), float(ci_without[1])],
                    "with_recovery_scores": with_factor,
                    "without_recovery_scores": without_factor,
                    "with_dates": [d.isoformat() for d in with_dates],
                    "without_dates": [d.isoformat() for d in without_dates]
                }
            )
        )

    # Sort by statistical significance first, then by impact magnitude
    insights.sort(key=lambda x: (x.data["is_significant"], abs(x.data["impact_val"])), reverse=True)
    return insights


def get_calorie_gps_recommendations(
    db: Session, 
    user_id: str, 
    recovery_score: float, 
    target_calories: float,
    strain_score: Optional[float] = None,
    sleep_hours: Optional[float] = None,
    hrv: Optional[float] = None,
    resting_hr: Optional[float] = None,
    acute_chronic_ratio: Optional[float] = None,
    sleep_debt: Optional[float] = None,
    consistency_score: Optional[float] = None
) -> CalorieGPSResponse:
    """Get hyper-personalized calorie GPS workout recommendations using ML model."""
    
    # Try to load Calorie GPS model
    models = load_latest_models(user_id)
    calorie_gps_model_data = models.get("calorie_gps")
    
    # If model is available, use ML predictions
    if calorie_gps_model_data and isinstance(calorie_gps_model_data, dict):
        try:
            model = calorie_gps_model_data.get('model')
            xgb_model = calorie_gps_model_data.get('xgb_model')
            feature_cols = calorie_gps_model_data.get('feature_cols', [])
            
            # Get latest daily metrics if not provided
            dm = _latest_daily_metrics(db, user_id)
            if dm:
                strain_score = strain_score if strain_score is not None else (dm.strain_score or 0)
                sleep_hours = sleep_hours if sleep_hours is not None else (dm.sleep_hours or 7)
                hrv = hrv if hrv is not None else (dm.hrv or 50)
                resting_hr = resting_hr if resting_hr is not None else (dm.resting_hr or 60)
                acute_chronic_ratio = acute_chronic_ratio if acute_chronic_ratio is not None else (dm.acute_chronic_ratio or 1.0)
                sleep_debt = sleep_debt if sleep_debt is not None else (dm.sleep_debt or 0)
                consistency_score = consistency_score if consistency_score is not None else (dm.consistency_score or 50)
            
            # Use defaults if still None
            strain_score = strain_score or 0
            sleep_hours = sleep_hours or 7
            hrv = hrv or 50
            resting_hr = resting_hr or 60
            acute_chronic_ratio = acute_chronic_ratio or 1.0
            sleep_debt = sleep_debt or 0
            consistency_score = consistency_score or 50
            
            # Get ML predictions
            recommendations = predict_workout_recommendations(
                model=model,
                xgb_model=xgb_model,
                feature_cols=feature_cols,
                recovery_score=recovery_score,
                target_calories=target_calories,
                strain_score=strain_score,
                sleep_hours=sleep_hours,
                hrv=hrv,
                resting_hr=resting_hr,
                acute_chronic_ratio=acute_chronic_ratio,
                sleep_debt=sleep_debt,
                consistency_score=consistency_score
            )
            
            # Convert to response format
            workout_recommendations = [
                CalorieGPSWorkout(
                    type=r['type'],
                    name=r['name'],
                    emoji=r['emoji'],
                    color=r['color'],
                    efficiency=r['efficiency'],
                    time=r['time'],
                    optimal=r['optimal'],
                    improvement=r['improvement']
                )
                for r in recommendations
            ]
            
            model_confidence = calorie_gps_model_data.get('r2', 0.7)  # Use R² as confidence
            
            # Always include model metrics if model is available
            model_type = 'XGBoost' if calorie_gps_model_data.get('xgb_model') else 'GradientBoosting'
            model_metrics = CalorieGPSModelMetrics(
                mae=calorie_gps_model_data.get('mae'),
                r2=calorie_gps_model_data.get('r2'),
                sample_size=calorie_gps_model_data.get('sample_size'),
                feature_importance=calorie_gps_model_data.get('feature_importance', {}),
                model_type=model_type
            )
            
            logger.debug(f"Calorie GPS model metrics: MAE={model_metrics.mae}, R²={model_metrics.r2}, samples={model_metrics.sample_size}")
            
            return CalorieGPSResponse(
                recommendations=workout_recommendations,
                is_personalized=True,
                model_confidence=float(model_confidence),
                model_metrics=model_metrics
            )
        except Exception as e:
            logger.warning(f"Error using Calorie GPS ML model: {e}", exc_info=True)
    
    # Fallback to rule-based recommendations
    return _rule_based_calorie_gps(
        recovery_score=recovery_score,
        target_calories=target_calories
    )


def get_all_model_metrics(user_id: str) -> dict:
    """Get metrics for all trained models for a user."""
    from app.ml.models.model_loader import load_latest_models
    from pathlib import Path
    from app.core_config import get_settings
    import logging
    
    logger = logging.getLogger(__name__)
    settings = get_settings()
    
    # Check if model directory exists
    model_dir = Path(settings.model_dir) / user_id
    logger.info(f"Model directory for user {user_id}: {model_dir}")
    logger.info(f"Model directory exists: {model_dir.exists()}")
    logger.info(f"Model directory path: {settings.model_dir}")
    
    models = load_latest_models(user_id)
    all_metrics = {}
    
    logger.info(f"Loading model metrics for user {user_id}, found {len(models)} model files: {list(models.keys())}")
    
    # Calorie GPS Model
    calorie_gps_data = models.get("calorie_gps")
    if calorie_gps_data:
        if isinstance(calorie_gps_data, dict):
            all_metrics["calorie_gps"] = {
                "model_type": "XGBoost" if calorie_gps_data.get('xgb_model') else "GradientBoosting",
                "r2": calorie_gps_data.get('r2'),
                "mae": calorie_gps_data.get('mae'),
                "sample_size": calorie_gps_data.get('sample_size'),
                "feature_importance": calorie_gps_data.get('feature_importance', {}),
            }
        else:
            # Legacy format: just the model object
            all_metrics["calorie_gps"] = {
                "model_type": "GradientBoosting",
                "available": True,
            }
    
    # Recovery Velocity Model
    recovery_velocity_data = models.get("recovery_velocity")
    if recovery_velocity_data:
        if isinstance(recovery_velocity_data, dict):
            all_metrics["recovery_velocity"] = {
                "model_type": "Linear Regression",
                "r2": recovery_velocity_data.get('r2'),
                "mae": recovery_velocity_data.get('mae'),
                "sample_size": recovery_velocity_data.get('sample_size'),
            }
        else:
            # Legacy format: just the model object
            all_metrics["recovery_velocity"] = {
                "model_type": "Linear Regression",
                "available": True,
            }
    
    # Strain Tolerance Model
    strain_tolerance_data = models.get("strain_tolerance")
    if strain_tolerance_data:
        if isinstance(strain_tolerance_data, dict):
            all_metrics["strain_tolerance"] = {
                "model_type": "Random Forest Classifier",
                "accuracy": strain_tolerance_data.get('accuracy'),
                "sample_size": strain_tolerance_data.get('sample_size'),
                "safe_threshold": strain_tolerance_data.get('safe_threshold'),
            }
        else:
            # Legacy format: just the model object
            all_metrics["strain_tolerance"] = {
                "model_type": "Random Forest Classifier",
                "available": True,
            }
    
    # Workout Timing Optimizer
    workout_timing_data = models.get("workout_timing")
    if workout_timing_data:
        if isinstance(workout_timing_data, dict):
            all_metrics["workout_timing"] = {
                "model_type": workout_timing_data.get('model_type', 'Random Forest Classifier'),
                "optimal_time": workout_timing_data.get('optimal_time'),
                "optimal_category": workout_timing_data.get('optimal_category'),
                "confidence": workout_timing_data.get('confidence'),
                "sample_size": workout_timing_data.get('sample_size'),
                "improvement_pct": workout_timing_data.get('improvement_pct'),
            }
        else:
            # Legacy format: just the model object
            all_metrics["workout_timing"] = {
                "model_type": "Random Forest Classifier",
                "available": True,
            }
    
    # Sleep Optimizer
    sleep_optimizer_data = models.get("sleep_optimizer")
    if sleep_optimizer_data:
        if isinstance(sleep_optimizer_data, dict):
            all_metrics["sleep_optimizer"] = {
                "model_type": "Random Forest Classifier",
                "optimal_bedtime": sleep_optimizer_data.get('optimal_bedtime'),
                "optimal_bedtime_hour": sleep_optimizer_data.get('optimal_bedtime_hour'),
                "confidence": sleep_optimizer_data.get('confidence'),
                "sample_size": sleep_optimizer_data.get('sample_size'),
            }
        else:
            # Legacy format: just the model object
            all_metrics["sleep_optimizer"] = {
                "model_type": "Random Forest Classifier",
                "available": True,
            }
    
    # Recovery Model (XGBoost or RandomForest)
    if models.get("xgb_recovery"):
        all_metrics["recovery_forecast"] = {
            "model_type": "XGBoost Regressor",
            "available": True,
        }
    elif models.get("recovery"):
        all_metrics["recovery_forecast"] = {
            "model_type": "Random Forest Regressor",
            "available": True,
        }
    
    # Burnout Risk Model
    if models.get("xgb_burnout"):
        all_metrics["burnout_risk"] = {
            "model_type": "XGBoost Classifier",
            "available": True,
        }
    elif models.get("burnout"):
        all_metrics["burnout_risk"] = {
            "model_type": "Random Forest Classifier",
            "available": True,
        }
    
    logger.info(f"Returning {len(all_metrics)} model metrics for user {user_id}")
    return all_metrics


def _rule_based_calorie_gps(recovery_score: float, target_calories: float) -> CalorieGPSResponse:
    """Fallback rule-based calorie GPS recommendations."""
    from app.ml.models.calorie_gps_model import WORKOUT_TYPES
    
    # Simple rule-based calculation
    neutral_efficiency = 10  # neutral baseline at 50% recovery
    recovery_bonus = ((recovery_score - 50) / 50) * 3
    baseline_efficiency = neutral_efficiency + recovery_bonus
    
    recommendations = []
    
    for wtype, wconfig in WORKOUT_TYPES.items():
        efficiency = baseline_efficiency * wconfig['base_efficiency'] / 10.0
        time = target_calories / efficiency if efficiency > 0 else 999
        improvement = ((efficiency - neutral_efficiency) / neutral_efficiency) * 100
        
        # Determine if optimal based on recovery
        is_optimal = False
        if recovery_score >= 67:
            is_optimal = wtype == 'high_intensity'
        elif recovery_score >= 34:
            is_optimal = wtype == 'moderate'
        else:
            is_optimal = wtype == 'light'
        
        recommendations.append(CalorieGPSWorkout(
            type=wtype,
            name=wconfig['name'],
            emoji=wconfig['emoji'],
            color=wconfig['color'],
            efficiency=round(efficiency, 1),
            time=round(time, 1),
            optimal=is_optimal,
            improvement=round(improvement, 1)
        ))
    
    return CalorieGPSResponse(
        recommendations=recommendations,
        is_personalized=False,
        model_confidence=None
    )
