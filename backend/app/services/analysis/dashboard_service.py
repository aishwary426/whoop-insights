"""
Comprehensive dashboard service.
Generates dashboard summaries with recommendations, predictions, scores, and risk flags.
"""
import logging
from datetime import date, timedelta
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
import numpy as np
import pandas as pd

from app.models.database import DailyMetrics, Workout
from app.schemas.api import (
    DashboardSummary,
    TodayMetrics,
    TodayRecommendation,
    TomorrowPrediction,
    HealthScores,
    IntensityLevel,
)
from app.ml.models.rule_based_recommender import recommend as rule_based_recommend
from app.ml.models.model_loader import load_latest_model, get_model_version

logger = logging.getLogger(__name__)


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
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .order_by(DailyMetrics.date.desc())
        .first()
    )
    
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
    )
    
    # Compute health scores
    scores = compute_health_scores(db, user_id, today_metric)
    
    # Compute risk flags
    risk_flags = compute_risk_flags(db, user_id, today_metric)

    return DashboardSummary(
        today=today,
        recommendation=recommendation,
        tomorrow=tomorrow,
        scores=scores,
        risk_flags=risk_flags,
    )
