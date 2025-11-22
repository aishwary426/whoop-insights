"""
Personalized Sleep Windows Optimizer
Learns optimal bedtime for each user based on recovery outcomes.
"""
from __future__ import annotations

import logging
from typing import Optional, Dict
import pandas as pd
from sqlalchemy.orm import Session

try:
    from sklearn.ensemble import RandomForestClassifier
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


def train_sleep_optimizer(db: Session, user_id: str) -> Optional[Dict]:
    """
    Train a model to predict optimal bedtime based on recovery outcomes.
    
    Returns:
        Dictionary with optimal bedtime and confidence, or None if insufficient data
    """
    if not SKLEARN_AVAILABLE or not JOBLIB_AVAILABLE:
        logger.warning("ML libraries not available for sleep optimization")
        return None
    
    # Get sleep and recovery data
    rows = (
        db.query(DailyMetrics)
        .filter(
            DailyMetrics.user_id == user_id,
            DailyMetrics.sleep_hours.isnot(None)
        )
        .order_by(DailyMetrics.date.asc())
        .all()
    )
    
    if len(rows) < 14:
        logger.info(f"Insufficient data for sleep optimizer: {len(rows)} days")
        return None
    
    # Feature engineering: extract bedtime from sleep data
    features = []
    targets = []
    
    for i, row in enumerate(rows[:-1]):
        next_row = rows[i+1]
        if next_row.recovery_score is None:
            continue
        
        # Try to extract bedtime from extra JSON (WHOOP may have this)
        bedtime_hour = 22  # Default 10 PM
        if row.extra:
            # Look for bedtime indicators in extra JSON
            for key in ['bedtime_hour', 'sleep_start_hour', 'lights_out_hour']:
                if key in row.extra:
                    try:
                        bedtime_hour = int(float(row.extra[key]))
                        break
                    except (ValueError, TypeError):
                        continue
        
        # Features: bedtime hour, sleep duration, strain, current recovery, day of week
        features.append([
            float(bedtime_hour),
            float(row.sleep_hours or 7.5),
            float(row.strain_score or 0),
            float(row.recovery_score or 50),
            float(row.date.weekday()),  # 0=Monday, 6=Sunday
        ])
        
        # Target: high recovery next day (binary: 1 if recovery >= 67, else 0)
        targets.append(1 if next_row.recovery_score >= 67 else 0)
    
    if len(features) < 10:
        logger.info(f"Not enough data pairs for sleep optimizer: {len(features)}")
        return None
    
    try:
        # Train lightweight model
        model = RandomForestClassifier(
            n_estimators=50,  # Keep small for Render free tier
            max_depth=5,
            random_state=7,
            n_jobs=1  # Single thread for Render
        )
        model.fit(features, targets)
        
        # Find optimal bedtime range by testing different hours
        bedtime_scores = {}
        test_features = []
        
        # Test bedtime hours from 8 PM to 12 AM
        for hour in range(20, 25):
            # Use median values from user's data
            median_sleep = pd.Series([f[1] for f in features]).median()
            median_strain = pd.Series([f[2] for f in features]).median()
            median_recovery = pd.Series([f[3] for f in features]).median()
            
            # Test for Tuesday (typical workout day)
            test_features.append([
                float(hour),
                float(median_sleep),
                float(median_strain),
                float(median_recovery),
                1.0  # Tuesday
            ])
        
        # Get probabilities for each bedtime
        probas = model.predict_proba(test_features)
        for idx, hour in enumerate(range(20, 25)):
            bedtime_scores[hour] = float(probas[idx][1])  # Probability of high recovery
        
        # Find optimal bedtime
        optimal_hour = max(bedtime_scores.items(), key=lambda x: x[1])[0]
        optimal_confidence = bedtime_scores[optimal_hour]
        
        # Convert hour to readable time
        bedtime_str = f"{optimal_hour % 24}:00"
        if optimal_hour >= 24:
            bedtime_str = f"{optimal_hour - 24}:00 (next day)"
        
        result = {
            'model': model,
            'optimal_bedtime_hour': optimal_hour,
            'optimal_bedtime': bedtime_str,
            'confidence': optimal_confidence,
            'bedtime_scores': bedtime_scores,
            'sample_size': len(features)
        }
        
        logger.info(f"Sleep optimizer trained for user {user_id}: optimal bedtime {bedtime_str} (confidence: {optimal_confidence:.2f})")
        
        return result
        
    except Exception as e:
        logger.error(f"Error training sleep optimizer: {e}", exc_info=True)
        return None


def predict_optimal_bedtime(
    db: Session,
    user_id: str,
    today_strain: float,
    today_recovery: float,
    day_of_week: int
) -> Optional[Dict]:
    """
    Predict optimal bedtime for today based on trained model.
    
    Args:
        db: Database session
        user_id: User identifier
        today_strain: Today's strain score
        today_recovery: Today's recovery score
        day_of_week: Day of week (0=Monday, 6=Sunday)
    
    Returns:
        Dictionary with bedtime recommendation, or None if model not available
    """
    # Try to load trained model (would need model persistence layer)
    # For now, use rule-based fallback with user's historical pattern
    
    rows = (
        db.query(DailyMetrics)
        .filter(
            DailyMetrics.user_id == user_id,
            DailyMetrics.sleep_hours.isnot(None)
        )
        .order_by(DailyMetrics.date.desc())
        .limit(30)
        .all()
    )
    
    if len(rows) < 7:
        return None
    
    # Simple rule-based: analyze historical bedtime patterns for high recovery days
    high_recovery_bedtimes = []
    
    for i, row in enumerate(rows[:-1]):
        next_row = rows[i+1]
        if next_row.recovery_score and next_row.recovery_score >= 67:
            bedtime_hour = 22
            if row.extra:
                for key in ['bedtime_hour', 'sleep_start_hour']:
                    if key in row.extra:
                        try:
                            bedtime_hour = int(float(row.extra[key]))
                            break
                        except (ValueError, TypeError):
                            continue
            high_recovery_bedtimes.append(bedtime_hour)
    
    if not high_recovery_bedtimes:
        return None
    
    # Calculate median bedtime for high recovery days
    optimal_hour = int(pd.Series(high_recovery_bedtimes).median())
    
    # Adjust based on today's strain
    if today_strain > 15:
        optimal_hour -= 1  # Sleep earlier after high strain
    elif today_strain < 8:
        optimal_hour += 0.5  # Can stay up a bit later
    
    # Convert to readable format
    bedtime_str = f"{int(optimal_hour)}:{int((optimal_hour % 1) * 60):02d}"
    
    return {
        'optimal_bedtime': bedtime_str,
        'optimal_bedtime_hour': optimal_hour,
        'reasoning': f"Based on your {len(high_recovery_bedtimes)} high-recovery days, optimal bedtime is {bedtime_str}",
        'confidence': min(0.8, len(high_recovery_bedtimes) / 20.0)  # Increases with more data
    }

