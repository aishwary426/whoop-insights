<<<<<<< HEAD
"""
Comprehensive dashboard service.
Generates dashboard summaries with recommendations, predictions, scores, and risk flags.
"""
import logging
from datetime import date, timedelta
from typing import List, Optional, Tuple
=======
from __future__ import annotations

import logging
from datetime import date, datetime
from typing import List, Optional

import numpy as np
>>>>>>> 57703a5 (Initial commit - Whoop Insights Pro)
from sqlalchemy.orm import Session
import numpy as np
import pandas as pd

<<<<<<< HEAD
from app.models.database import DailyMetrics, Workout
=======
from app.models.database import DailyMetrics, Insight, InsightType, IntensityLevel
>>>>>>> 57703a5 (Initial commit - Whoop Insights Pro)
from app.schemas.api import (
    DashboardSummary,
    HealthScores,
    InsightItem,
    InsightsFeed,
    TodayMetrics,
    TodayRecommendation,
    TomorrowPrediction,
<<<<<<< HEAD
    HealthScores,
    IntensityLevel,
)
from app.ml.models.rule_based_recommender import recommend as rule_based_recommend
from app.ml.models.model_loader import load_latest_model, get_model_version
=======
    TrendPoint,
    TrendsResponse,
    TrendsSeries,
)
from app.ml.models.model_loader import load_latest_models
from app.ml.models.rule_based_recommender import recommend
>>>>>>> 57703a5 (Initial commit - Whoop Insights Pro)

logger = logging.getLogger(__name__)


<<<<<<< HEAD
def compute_risk_flags(db: Session, user_id: str, today_metric: DailyMetrics) -> List[str]:
    """
    Compute risk flags based on current metrics and patterns.
    
    Returns:
        List of risk flag messages
    """
    flags = []
    
    # High acute/chronic ratio
    if today_metric.acute_chronic_ratio and today_metric.acute_chronic_ratio > 1.3:
        flags.append("High acute load vs chronic load - risk of overtraining")
    
    # Sustained low HRV
    if today_metric.hrv and today_metric.hrv_baseline_7d:
        hrv_ratio = today_metric.hrv / today_metric.hrv_baseline_7d
        if hrv_ratio < 0.85:
            # Check if this is sustained
            recent_metrics = (
                db.query(DailyMetrics)
                .filter(DailyMetrics.user_id == user_id)
                .filter(DailyMetrics.date <= today_metric.date)
                .order_by(DailyMetrics.date.desc())
                .limit(3)
                .all()
            )
            
            low_hrv_days = sum([
                1 for m in recent_metrics
                if m.hrv and m.hrv_baseline_7d and (m.hrv / m.hrv_baseline_7d) < 0.85
            ])
            
            if low_hrv_days >= 3:
                flags.append("Sustained low HRV vs baseline - may indicate stress or fatigue")
    
    # Sleep debt
    if today_metric.sleep_debt and today_metric.sleep_debt > 8:
        flags.append(f"Significant sleep debt ({today_metric.sleep_debt:.1f}h) - prioritize recovery")
    
    # Low sleep for multiple days
    recent_metrics = (
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .filter(DailyMetrics.date <= today_metric.date)
        .order_by(DailyMetrics.date.desc())
        .limit(3)
        .all()
    )
    
    low_sleep_days = sum([
        1 for m in recent_metrics
        if m.sleep_hours and m.sleep_hours < 6
    ])
    
    if low_sleep_days >= 3:
        flags.append("Sleep < 6h for 3+ days - recovery may be compromised")
    
    # Low recovery sustained
    low_recovery_days = sum([
        1 for m in recent_metrics
        if m.recovery_score and m.recovery_score < 34
    ])
    
    if low_recovery_days >= 3:
        flags.append("Low recovery (<34%) for 3+ days - consider rest period")
    
    # High strain without recovery
    if today_metric.strain_score and today_metric.strain_score > 15:
        if today_metric.recovery_score and today_metric.recovery_score < 50:
            flags.append("High strain with low recovery - risk of burnout")
    
    return flags


def predict_tomorrow_recovery(
    db: Session,
    user_id: str,
    today_metric: DailyMetrics
) -> Tuple[float, float]:
    """
    Predict tomorrow's recovery using ML model if available, else rule-based.
    
    Returns:
        Tuple of (predicted_recovery, confidence)
    """
    # Try ML model first
    model = load_latest_model(user_id, "recovery_predictor")
    
    if model:
        try:
            # Prepare features (same as training)
            features = pd.DataFrame([{
                'recovery_score': today_metric.recovery_score or 50,
                'strain_score': today_metric.strain_score or 0,
                'sleep_hours': today_metric.sleep_hours or 7,
                'hrv': today_metric.hrv or 0,
                'resting_hr': today_metric.resting_hr or 0,
                'strain_baseline_7d': today_metric.strain_baseline_7d or 0,
                'recovery_baseline_7d': today_metric.recovery_baseline_7d or 50,
                'sleep_baseline_7d': today_metric.sleep_baseline_7d or 7,
                'hrv_baseline_7d': today_metric.hrv_baseline_7d or 0,
                'rhr_baseline_7d': today_metric.rhr_baseline_7d or 0,
                'recovery_z_score': today_metric.recovery_z_score or 0,
                'strain_z_score': today_metric.strain_z_score or 0,
                'sleep_z_score': today_metric.sleep_z_score or 0,
                'hrv_z_score': today_metric.hrv_z_score or 0,
                'acute_chronic_ratio': today_metric.acute_chronic_ratio or 1.0,
                'sleep_debt': today_metric.sleep_debt or 0,
                'consistency_score': today_metric.consistency_score or 50,
            }])
            
            # Fill NaN with 0
            features = features.fillna(0)
            
            # Get model's expected feature order
            if hasattr(model, 'feature_names_in_'):
                feature_order = model.feature_names_in_
                features = features[feature_order]
            
            prediction = model.predict(features)[0]
            prediction = max(0, min(100, prediction))  # Clamp to 0-100
            
            # Confidence based on model quality (assume 0.7-0.9 for ML)
            confidence = 0.8
            
            logger.info(f"ML prediction for tomorrow: {prediction:.1f}% (confidence: {confidence})")
            return float(prediction), confidence
            
        except Exception as e:
            logger.warning(f"ML prediction failed, using rule-based: {e}")
    
    # Rule-based fallback
    recovery = today_metric.recovery_score or 50
    strain = today_metric.strain_score or 0
    sleep = today_metric.sleep_hours or 7
    
    # Simple heuristic
    predicted = recovery - (strain * 2) + (sleep - 7) * 5
    predicted = max(0, min(100, predicted))
    
    confidence = 0.4  # Lower confidence for rule-based
    
    logger.info(f"Rule-based prediction for tomorrow: {predicted:.1f}% (confidence: {confidence})")
    return float(predicted), confidence


def compute_health_scores(
    db: Session,
    user_id: str,
    today_metric: DailyMetrics
) -> HealthScores:
    """Compute health scores (consistency, burnout risk, sleep health)."""
    
    # Consistency score (from feature engineering)
    consistency = today_metric.consistency_score or 50
    
    # Burnout risk (0-100, higher = more risk)
    burnout_risk = 50.0
    
    # Try ML classifier
    burnout_model = load_latest_model(user_id, "burnout_classifier")
    if burnout_model:
        try:
            features = pd.DataFrame([{
                'recovery_score': today_metric.recovery_score or 50,
                'strain_score': today_metric.strain_score or 0,
                'sleep_hours': today_metric.sleep_hours or 7,
                'hrv': today_metric.hrv or 0,
                'strain_baseline_7d': today_metric.strain_baseline_7d or 0,
                'recovery_baseline_7d': today_metric.recovery_baseline_7d or 50,
                'recovery_z_score': today_metric.recovery_z_score or 0,
                'strain_z_score': today_metric.strain_z_score or 0,
                'sleep_z_score': today_metric.sleep_z_score or 0,
                'acute_chronic_ratio': today_metric.acute_chronic_ratio or 1.0,
                'sleep_debt': today_metric.sleep_debt or 0,
                'consistency_score': today_metric.consistency_score or 50,
            }])
            features = features.fillna(0)
            
            if hasattr(burnout_model, 'feature_names_in_'):
                feature_order = burnout_model.feature_names_in_
                features = features[feature_order]
            
            prediction = burnout_model.predict(features)[0]
            # Map 0=low, 1=medium, 2=high to 0-100 scale
            burnout_risk = float(prediction * 50)  # 0->0, 1->50, 2->100
            
        except Exception as e:
            logger.warning(f"Burnout classifier failed: {e}")
    
    # Rule-based fallback for burnout
    if burnout_risk == 50.0:
        recovery = today_metric.recovery_score or 50
        strain = today_metric.strain_score or 0
        acute_chronic = today_metric.acute_chronic_ratio or 1.0
        
        # Higher risk if low recovery + high strain + high acute/chronic
        burnout_risk = max(0, min(100, 
            50 - (recovery * 0.5) + (strain * 3) + ((acute_chronic - 1) * 20)
        ))
    
    # Sleep health (0-100, higher = better)
    sleep_health = 70.0
    
    # Try ML classifier
    sleep_model = load_latest_model(user_id, "sleep_classifier")
    if sleep_model:
        try:
            features = pd.DataFrame([{
                'sleep_hours': today_metric.sleep_hours or 7,
                'recovery_score': today_metric.recovery_score or 50,
                'strain_score': today_metric.strain_score or 0,
                'hrv': today_metric.hrv or 0,
                'sleep_baseline_7d': today_metric.sleep_baseline_7d or 7,
                'sleep_z_score': today_metric.sleep_z_score or 0,
                'sleep_debt': today_metric.sleep_debt or 0,
                'consistency_score': today_metric.consistency_score or 50,
            }])
            features = features.fillna(0)
            
            if hasattr(sleep_model, 'feature_names_in_'):
                feature_order = sleep_model.feature_names_in_
                features = features[feature_order]
            
            prediction = sleep_model.predict(features)[0]
            # Map 0=good, 1=moderate, 2=poor to 0-100 scale (inverted)
            sleep_health = float(100 - (prediction * 50))  # 0->100, 1->50, 2->0
            
        except Exception as e:
            logger.warning(f"Sleep classifier failed: {e}")
    
    # Rule-based fallback for sleep
    if sleep_health == 70.0:
        sleep = today_metric.sleep_hours or 7
        sleep_debt = today_metric.sleep_debt or 0
        
        if sleep >= 8:
            sleep_health = 90
        elif sleep >= 7:
            sleep_health = 75
        elif sleep >= 6:
            sleep_health = 60
        else:
            sleep_health = 40
        
        # Penalize for sleep debt
        sleep_health = max(0, sleep_health - (sleep_debt * 2))
    
    return HealthScores(
        consistency=float(consistency),
        burnout_risk=float(burnout_risk),
        sleep_health=float(sleep_health),
    )


def build_dashboard(db: Session, user_id: str) -> DashboardSummary:
    """
    Build comprehensive dashboard summary.
    
    Returns:
        DashboardSummary with today's metrics, recommendations, predictions, scores, and risk flags
    """
    logger.info(f"Building dashboard for user {user_id}")
    
    # Get today's (most recent) metrics
    today_metric = (
=======
def _latest_daily_metrics(db: Session, user_id: str) -> Optional[DailyMetrics]:
    return (
>>>>>>> 57703a5 (Initial commit - Whoop Insights Pro)
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .order_by(DailyMetrics.date.desc())
        .first()
    )
<<<<<<< HEAD
    
    if not today_metric:
        # Return empty dashboard
        return DashboardSummary(
            today=TodayMetrics(
                date=date.today(),
                recovery_score=None,
                strain_score=None,
                sleep_hours=None,
                hrv=None,
                workouts_count=0,
            ),
            recommendation=TodayRecommendation(
                intensity_level=IntensityLevel.LIGHT,
                focus="Data collection",
                workout_type="Light activity",
                notes="No data available yet. Upload your WHOOP export to get started.",
                optimal_time=None,
            ),
            tomorrow=TomorrowPrediction(
                recovery_forecast=50.0,
                confidence=0.1,
            ),
            scores=HealthScores(
                consistency=0.0,
                burnout_risk=0.0,
                sleep_health=0.0,
            ),
            risk_flags=[],
        )
    
    # Build today's metrics
    today = TodayMetrics(
        date=today_metric.date,
        recovery_score=today_metric.recovery_score,
        strain_score=today_metric.strain_score,
        sleep_hours=today_metric.sleep_hours,
        hrv=today_metric.hrv,
        workouts_count=today_metric.workouts_count or 0,
    )
    
    # Get recommendation (rule-based + ML blend)
    intensity, focus, workout_type, notes, optimal_time = rule_based_recommend(
        db, user_id, today_metric
    )
    
    recommendation = TodayRecommendation(
        intensity_level=intensity,
        focus=focus,
        workout_type=workout_type,
        notes=notes,
        optimal_time=optimal_time,
    )
    
    # Predict tomorrow's recovery
    predicted_recovery, confidence = predict_tomorrow_recovery(db, user_id, today_metric)

    tomorrow = TomorrowPrediction(
        recovery_forecast=predicted_recovery,
        confidence=confidence,
=======


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

    rule_plan = recommend(dm)
    models = load_latest_models(user_id)

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
        rec_forecast = float(recovery_model.predict(feature_vector)[0])
        # Confidence calculation: XGBoost provides better calibrated predictions
        try:
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
>>>>>>> 57703a5 (Initial commit - Whoop Insights Pro)
    )
    
    # Compute health scores
    scores = compute_health_scores(db, user_id, today_metric)
    
    # Compute risk flags
    risk_flags = compute_risk_flags(db, user_id, today_metric)

    tomorrow = TomorrowPrediction(recovery_forecast=rec_forecast, confidence=confidence)
    risk_flags = sorted(set(rule_plan["risk_flags"] + _derive_risk_flags(dm)))

    return DashboardSummary(
<<<<<<< HEAD
        today=today,
        recommendation=recommendation,
        tomorrow=tomorrow,
        scores=scores,
        risk_flags=risk_flags,
=======
        today=_to_today_metrics(dm),
        recommendation=TodayRecommendation(
            intensity_level=rule_plan["intensity_level"],
            focus=rule_plan["focus"],
            workout_type=rule_plan["workout_type"],
            optimal_time=rule_plan["optimal_time"],
            notes=rule_plan["notes"],
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

    def _series(values: List[DailyMetrics], attr: str) -> List[TrendPoint]:
        return [TrendPoint(date=row.date, value=getattr(row, attr)) for row in values]

    return TrendsResponse(
        user_id=user_id,
        series=TrendsSeries(
            recovery=_series(rows, "recovery_score"),
            strain=_series(rows, "strain_score"),
            sleep=_series(rows, "sleep_hours"),
            hrv=_series(rows, "hrv"),
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
>>>>>>> 57703a5 (Initial commit - Whoop Insights Pro)
    )
