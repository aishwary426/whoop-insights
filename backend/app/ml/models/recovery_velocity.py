"""
Recovery Velocity Prediction
Predicts how fast user recovers from low recovery states.
"""
from __future__ import annotations

import logging
from typing import Optional, Dict, List
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

try:
    from sklearn.linear_model import LinearRegression
    from sklearn.preprocessing import StandardScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

try:
    import joblib
    JOBLIB_AVAILABLE = True
except ImportError:
    JOBLIB_AVAILABLE = False

from app.models.database import DailyMetrics
from app.core_config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def get_historical_recovery_episodes(
    db: Session,
    user_id: str,
    current_recovery: float,
    strain_score: float,
    limit: int = 5
) -> List[Dict]:
    """
    Get historical recovery episodes similar to current state for context.
    
    Returns list of examples showing previous recovery instances.
    """
    # Get recent recovery episodes where recovery was low (< 67%)
    rows = (
        db.query(DailyMetrics)
        .filter(
            DailyMetrics.user_id == user_id,
            DailyMetrics.recovery_score.isnot(None),
            DailyMetrics.recovery_score < 67
        )
        .order_by(DailyMetrics.date.desc())
        .limit(30)
        .all()
    )
    
    if len(rows) < 2:
        return []
    
    examples = []
    target_recovery = 67.0
    
    # Find recovery episodes (low recovery -> recovery to 67%)
    for i in range(len(rows) - 1):
        if len(examples) >= limit:
            break
            
        today = rows[i]
        if today.recovery_score is None or today.recovery_score >= target_recovery:
            continue
        
        # Find when recovery reached 67% (or close to it)
        start_recovery = today.recovery_score
        start_date = today.date
        start_strain = today.strain_score or 0
        
        # Look ahead to find recovery completion
        days_to_recover = None
        end_recovery = None
        end_date = None
        
        for j in range(i + 1, min(i + 8, len(rows))):
            future_day = rows[j]
            if future_day.recovery_score is None:
                break
            
            if future_day.recovery_score >= target_recovery:
                if isinstance(start_date, pd.Timestamp):
                    days_to_recover = (future_day.date - start_date).days
                else:
                    from datetime import date
                    if isinstance(start_date, date):
                        days_to_recover = (future_day.date - start_date).days
                    else:
                        days_to_recover = 1
                end_recovery = future_day.recovery_score
                end_date = future_day.date
                break
        
        # If we didn't reach 67%, estimate based on improvement rate
        if days_to_recover is None and i < len(rows) - 1:
            next_day = rows[i + 1]
            if next_day.recovery_score and next_day.recovery_score > start_recovery:
                recovery_delta = next_day.recovery_score - start_recovery
                if recovery_delta > 0:
                    remaining = target_recovery - start_recovery
                    estimated_days = remaining / recovery_delta
                    days_to_recover = max(1, int(estimated_days))
                    end_recovery = min(target_recovery, start_recovery + recovery_delta * estimated_days)
                    from datetime import timedelta
                    if isinstance(start_date, pd.Timestamp):
                        end_date = start_date + pd.Timedelta(days=days_to_recover)
                    else:
                        end_date = start_date + timedelta(days=days_to_recover)
        
        if days_to_recover and days_to_recover > 0:
            # Format message
            if start_strain >= 12:
                message = f"Recovered from {start_recovery:.0f}% in {days_to_recover} day{'s' if days_to_recover > 1 else ''} after high strain ({start_strain:.1f})"
            else:
                message = f"Recovered from {start_recovery:.0f}% to {end_recovery:.0f if end_recovery else target_recovery:.0f}% in {days_to_recover} day{'s' if days_to_recover > 1 else ''}"
            
            # Format date properly
            date_str = None
            if hasattr(start_date, 'isoformat'):
                date_str = start_date.isoformat()
            elif hasattr(start_date, 'strftime'):
                date_str = start_date.strftime('%Y-%m-%d')
            else:
                date_str = str(start_date)
            
            examples.append({
                'date': date_str,
                'start_recovery': float(start_recovery),
                'end_recovery': float(end_recovery) if end_recovery else float(target_recovery),
                'days_taken': int(days_to_recover),
                'strain': float(start_strain),
                'message': message,
                'type': 'historical',
            })
    
    # Sort by relevance (similar recovery and strain)
    examples.sort(key=lambda x: (
        abs(x['start_recovery'] - current_recovery) +
        abs(x['strain'] - strain_score) * 0.5
    ))
    
    return examples[:limit]


def train_recovery_velocity_model(db: Session, user_id: str) -> Optional[Dict]:
    """
    Train a model to predict recovery velocity (days to recover from low recovery states).
    
    Returns:
        Dictionary with trained model and metadata, or None if insufficient data
    """
    if not SKLEARN_AVAILABLE or not JOBLIB_AVAILABLE:
        logger.warning("ML libraries not available for recovery velocity modeling")
        return None
    
    # Get daily metrics with at least 21 days to see recovery patterns
    rows = (
        db.query(DailyMetrics)
        .filter(
            DailyMetrics.user_id == user_id,
            DailyMetrics.recovery_score.isnot(None),
            DailyMetrics.strain_score.isnot(None)
        )
        .order_by(DailyMetrics.date.asc())
        .all()
    )
    
    if len(rows) < 21:
        logger.info(f"Insufficient data for recovery velocity model: {len(rows)} days (need 21+)")
        return None
    
    # Calculate recovery deltas and recovery episodes
    features = []
    targets = []  # Days to recover to 67% (good recovery threshold)
    
    # Build sequences of recovery changes
    for i in range(len(rows) - 1):
        today = rows[i]
        tomorrow = rows[i + 1]
        
        if today.recovery_score is None or tomorrow.recovery_score is None:
            continue
        
        # Only train on low recovery states (< 67%)
        if today.recovery_score >= 67:
            continue
        
        # Calculate recovery delta (how much recovery improved)
        recovery_delta = tomorrow.recovery_score - today.recovery_score
        
        # Calculate days to reach 67% recovery
        # We'll track this by looking ahead in the sequence
        days_to_recover = None
        target_recovery = 67.0
        
        if tomorrow.recovery_score >= target_recovery:
            days_to_recover = 1.0
        else:
            # Look ahead to find when recovery reaches 67%
            current_recovery = tomorrow.recovery_score
            days_count = 1
            
            for j in range(i + 2, min(i + 8, len(rows))):  # Look up to 7 days ahead
                future_day = rows[j]
                if future_day.recovery_score is None:
                    break
                
                current_recovery = future_day.recovery_score
                days_count += 1
                
                if current_recovery >= target_recovery:
                    days_to_recover = float(days_count)
                    break
            
            # If we didn't reach 67% in the lookahead window, estimate based on current velocity
            if days_to_recover is None and recovery_delta > 0:
                remaining_recovery = target_recovery - tomorrow.recovery_score
                estimated_days = remaining_recovery / max(recovery_delta, 1.0)
                days_to_recover = 1.0 + estimated_days
            elif days_to_recover is None:
                # If recovery is not improving, estimate conservatively
                days_to_recover = 3.0
        
        if days_to_recover is None or days_to_recover <= 0:
            continue
        
        # Features: current recovery, strain, sleep, HRV, acute/chronic ratio, HRV trend
        # HRV trend: calculate 3-day average HRV change
        hrv_trend = 0.0
        if i >= 2:
            hrv_values = []
            for k in range(max(0, i - 2), i + 1):
                if rows[k].hrv is not None:
                    hrv_values.append(rows[k].hrv)
            if len(hrv_values) >= 2:
                hrv_trend = hrv_values[-1] - hrv_values[0]
        
        features.append([
            float(today.recovery_score),
            float(today.strain_score or 0),
            float(today.sleep_hours or 7.5),
            float(today.hrv or 50),
            float(today.acute_chronic_ratio or 1.0),
            float(hrv_trend),
        ])
        
        targets.append(float(days_to_recover))
    
    if len(features) < 10:
        logger.info(f"Not enough recovery episodes for velocity model: {len(features)}")
        return None
    
    try:
        # Use linear regression (lightweight, interpretable)
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(features)
        
        model = LinearRegression()
        model.fit(X_scaled, targets)
        
        # Calculate model performance metrics
        predictions = model.predict(X_scaled)
        mae = float(np.mean(np.abs(predictions - targets)))
        r2 = float(model.score(X_scaled, targets))
        
        # Get average recovery velocity for different scenarios
        avg_velocity_low_strain = np.mean([t for f, t in zip(features, targets) if f[1] < 10])
        avg_velocity_high_strain = np.mean([t for f, t in zip(features, targets) if f[1] >= 12])
        
        result = {
            'model': model,
            'scaler': scaler,
            'mae': mae,
            'r2': r2,
            'sample_size': len(features),
            'avg_velocity_low_strain': float(avg_velocity_low_strain) if not np.isnan(avg_velocity_low_strain) else None,
            'avg_velocity_high_strain': float(avg_velocity_high_strain) if not np.isnan(avg_velocity_high_strain) else None,
        }
        
        logger.info(
            f"Recovery velocity model trained for user {user_id}: "
            f"MAE={mae:.2f} days, R²={r2:.3f}, samples={len(features)}"
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error training recovery velocity model: {e}", exc_info=True)
        return None


def predict_recovery_days(
    db: Session,
    user_id: str,
    current_recovery: float,
    strain_score: float,
    sleep_hours: float,
    hrv: float,
    acute_chronic_ratio: float
) -> Optional[Dict]:
    """
    Predict how many days it will take to recover from current low recovery state.
    
    Args:
        db: Database session
        user_id: User identifier
        current_recovery: Current recovery score
        strain_score: Current strain score
        sleep_hours: Sleep hours
        hrv: HRV value
        acute_chronic_ratio: Acute/chronic load ratio
    
    Returns:
        Dictionary with recovery prediction, or None if model not available
    """
    # Only predict for low recovery states
    if current_recovery >= 67:
        return {
            'days_to_recover': 0,
            'message': 'You are already in good recovery!',
            'confidence': 1.0
        }
    
    # Try to load trained model first
    if JOBLIB_AVAILABLE:
        from app.ml.models.model_loader import load_latest_models
        models = load_latest_models(user_id)
        velocity_model_data = models.get("recovery_velocity")
        
        if velocity_model_data and isinstance(velocity_model_data, dict):
            try:
                model = velocity_model_data.get('model')
                scaler = velocity_model_data.get('scaler')
                
                if model and scaler:
                    # Calculate HRV trend (3-day average change)
                    rows = (
                        db.query(DailyMetrics)
                        .filter(
                            DailyMetrics.user_id == user_id,
                            DailyMetrics.hrv.isnot(None)
                        )
                        .order_by(DailyMetrics.date.desc())
                        .limit(3)
                        .all()
                    )
                    
                    hrv_trend = 0.0
                    if len(rows) >= 2:
                        hrv_values = [r.hrv for r in reversed(rows) if r.hrv is not None]
                        if len(hrv_values) >= 2:
                            hrv_trend = hrv_values[-1] - hrv_values[0]
                    
                    # Prepare features
                    features = np.array([[
                        float(current_recovery),
                        float(strain_score),
                        float(sleep_hours),
                        float(hrv),
                        float(acute_chronic_ratio),
                        float(hrv_trend),
                    ]])
                    
                    # Scale and predict
                    features_scaled = scaler.transform(features)
                    days_predicted = model.predict(features_scaled)[0]
                    days_predicted = max(0.5, min(7.0, float(days_predicted)))  # Clamp to reasonable range
                    
                    # Generate message based on strain level
                    if strain_score >= 12:
                        message = (
                            f"You typically need {days_predicted:.1f} days to recover from "
                            f"{current_recovery:.0f}% recovery after a high strain day"
                        )
                    else:
                        message = (
                            f"You typically need {days_predicted:.1f} days to recover from "
                            f"{current_recovery:.0f}% recovery"
                        )
                    
                    # Get historical examples for context
                    historical_examples = get_historical_recovery_episodes(
                        db, user_id, current_recovery, strain_score
                    )
                    
                    # Get model metadata for explanation
                    # The saved model includes model, scaler, mae, r2, and sample_size
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
                    
                    logger.debug(
                        f"Recovery velocity prediction for user {user_id}: "
                        f"{days_predicted:.1f} days from {current_recovery:.0f}% recovery"
                    )
                    
                    return {
                        'days_to_recover': days_predicted,
                        'message': message,
                        'confidence': 0.8,  # High confidence for ML model
                        'current_recovery': current_recovery,
                        'strain_score': strain_score,
                        'examples': historical_examples,
                        'model_metadata': model_metadata,
                    }
            except Exception as e:
                logger.warning(f"Error using trained recovery velocity model: {e}", exc_info=True)
                # Fall through to rule-based fallback
    
    # Rule-based fallback
    rows = (
        db.query(DailyMetrics)
        .filter(
            DailyMetrics.user_id == user_id,
            DailyMetrics.recovery_score.isnot(None),
            DailyMetrics.recovery_score < 67
        )
        .order_by(DailyMetrics.date.desc())
        .limit(30)
        .all()
    )
    
    if len(rows) < 5:
        return None
    
    # Calculate average recovery velocity from historical data
    recovery_episodes = []
    for i in range(len(rows) - 1):
        today = rows[i]
        tomorrow = rows[i + 1]
        
        if today.recovery_score is None or tomorrow.recovery_score is None:
            continue
        
        if tomorrow.recovery_score > today.recovery_score:
            delta = tomorrow.recovery_score - today.recovery_score
            remaining = 67 - today.recovery_score
            if delta > 0:
                estimated_days = remaining / delta
                recovery_episodes.append(estimated_days)
    
    if not recovery_episodes:
        # Conservative estimate
        days_estimate = 2.0
    else:
        days_estimate = float(np.median(recovery_episodes))
        days_estimate = max(0.5, min(5.0, days_estimate))  # Clamp to reasonable range
    
    if strain_score >= 12:
        message = (
            f"You typically need {days_estimate:.1f} days to recover from "
            f"{current_recovery:.0f}% recovery after a high strain day"
        )
    else:
        message = (
            f"You typically need {days_estimate:.1f} days to recover from "
            f"{current_recovery:.0f}% recovery"
        )
    
    # Get historical examples for context
    historical_examples = get_historical_recovery_episodes(
        db, user_id, current_recovery, strain_score
    )
    
    return {
        'days_to_recover': days_estimate,
        'message': message,
        'confidence': min(0.6, len(rows) / 30.0),  # Lower confidence for rule-based
        'current_recovery': current_recovery,
        'strain_score': strain_score,
        'examples': historical_examples,
        'model_metadata': {
            'method': 'Rule-based (Historical Average)',
            'features': ['Historical Recovery Episodes'],
            'sample_size': len(recovery_episodes) if recovery_episodes else 0,
        },
    }

