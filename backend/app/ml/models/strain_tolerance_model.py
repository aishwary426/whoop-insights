"""
Strain Tolerance Modeling
Learns individual strain thresholds (when strain becomes harmful) for each user.
"""
from __future__ import annotations

import logging
from typing import Optional, Dict
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

try:
    from sklearn.linear_model import LogisticRegression
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


def train_strain_tolerance_model(db: Session, user_id: str) -> Optional[Dict]:
    """
    Train a model to predict burnout risk based on strain level.
    Learns individual strain thresholds.
    
    Returns:
        Dictionary with safe strain threshold and risk curve, or None if insufficient data
    """
    if not SKLEARN_AVAILABLE or not JOBLIB_AVAILABLE:
        logger.warning("ML libraries not available for strain tolerance modeling")
        return None
    
    # Get daily metrics with varied strain levels
    rows = (
        db.query(DailyMetrics)
        .filter(
            DailyMetrics.user_id == user_id,
            DailyMetrics.strain_score.isnot(None),
            DailyMetrics.recovery_score.isnot(None)
        )
        .order_by(DailyMetrics.date.asc())
        .all()
    )
    
    if len(rows) < 14:
        logger.info(f"Insufficient data for strain tolerance model: {len(rows)} days")
        return None
    
    # Feature engineering: strain + context → burnout risk
    features = []
    targets = []
    
    for row in rows:
        # Skip if missing key metrics
        if row.recovery_score is None or row.strain_score is None:
            continue
        
        # Features: strain score, recovery before strain, sleep, HRV, acute/chronic ratio
        features.append([
            float(row.strain_score),
            float(row.recovery_score),
            float(row.sleep_hours or 7.5),
            float(row.hrv or 50),
            float(row.acute_chronic_ratio or 1.0),
        ])
        
        # Target: burnout risk (binary: 1 if recovery < 34, else 0)
        # Alternative: 1 if recovery drops significantly next day (if we have next day data)
        targets.append(1 if row.recovery_score < 34 else 0)
    
    if len(features) < 10:
        logger.info(f"Not enough data pairs for strain tolerance model: {len(features)}")
        return None
    
    try:
        # Use logistic regression (lightweight, interpretable)
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(features)
        
        model = LogisticRegression(
            max_iter=1000,
            random_state=7,
            class_weight='balanced'  # Handle class imbalance
        )
        model.fit(X_scaled, targets)
        
        # Find safe strain threshold by testing different strain levels
        strain_risk_curve = {}
        
        # Get median values for other features
        median_recovery = pd.Series([f[1] for f in features]).median()
        median_sleep = pd.Series([f[2] for f in features]).median()
        median_hrv = pd.Series([f[3] for f in features]).median()
        median_ratio = pd.Series([f[4] for f in features]).median()
        
        # Test strain levels from 0 to 20
        test_strains = np.arange(0, 21, 0.5)
        test_features = []
        
        for strain in test_strains:
            test_features.append([
                float(strain),
                float(median_recovery),
                float(median_sleep),
                float(median_hrv),
                float(median_ratio),
            ])
        
        # Scale test features
        test_scaled = scaler.transform(test_features)
        
        # Get burnout risk probabilities
        risk_probas = model.predict_proba(test_scaled)[:, 1]  # Probability of burnout
        
        for idx, strain in enumerate(test_strains):
            strain_risk_curve[float(strain)] = float(risk_probas[idx])
        
        # Find safe strain threshold (where risk exceeds 30%)
        safe_threshold = None
        for strain, risk in sorted(strain_risk_curve.items()):
            if risk > 0.3:
                safe_threshold = strain
                break
        
        # Fallback: use 75th percentile of user's historical strain
        if safe_threshold is None:
            historical_strains = [f[0] for f in features]
            safe_threshold = float(np.percentile(historical_strains, 75))
        
        # Calculate risk at current threshold
        risk_at_threshold = strain_risk_curve.get(safe_threshold, 0.3)
        
        # Calculate how much exceeding threshold increases risk
        risk_below = strain_risk_curve.get(max(0, safe_threshold - 2), 0.1)
        risk_increase_pct = ((risk_at_threshold - risk_below) / risk_below * 100) if risk_below > 0 else 50
        
        result = {
            'model': model,
            'scaler': scaler,
            'safe_threshold': float(safe_threshold),
            'risk_at_threshold': float(risk_at_threshold),
            'risk_increase_pct': float(risk_increase_pct),
            'strain_risk_curve': {str(k): v for k, v in list(strain_risk_curve.items())[:10]},  # Sample
            'sample_size': len(features),
            'avg_strain': float(pd.Series([f[0] for f in features]).mean()),
            'max_safe_strain': float(pd.Series([f[0] for f in features if targets[features.index(f)] == 0]).quantile(0.75)) if any(t == 0 for t in targets) else safe_threshold
        }
        
        logger.info(
            f"Strain tolerance model trained for user {user_id}: "
            f"safe threshold = {safe_threshold:.1f} (risk: {risk_at_threshold:.1%})"
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error training strain tolerance model: {e}", exc_info=True)
        return None


def predict_burnout_risk(
    db: Session,
    user_id: str,
    strain_score: float,
    current_recovery: float,
    sleep_hours: float,
    hrv: float,
    acute_chronic_ratio: float
) -> Optional[Dict]:
    """
    Predict burnout risk for a given strain level.
    
    Args:
        db: Database session
        user_id: User identifier
        strain_score: Proposed strain score
        current_recovery: Current recovery score
        sleep_hours: Sleep hours
        hrv: HRV value
        acute_chronic_ratio: Acute/chronic load ratio
    
    Returns:
        Dictionary with burnout risk prediction, or None if model not available
    """
    # Rule-based fallback
    rows = (
        db.query(DailyMetrics)
        .filter(
            DailyMetrics.user_id == user_id,
            DailyMetrics.strain_score.isnot(None),
            DailyMetrics.recovery_score.isnot(None)
        )
        .order_by(DailyMetrics.date.desc())
        .limit(30)
        .all()
    )
    
    if len(rows) < 7:
        return None
    
    # Analyze historical strain → recovery relationship
    high_strain_recoveries = []
    low_strain_recoveries = []
    
    for row in rows:
        if row.recovery_score is None or row.strain_score is None:
            continue
        
        if row.strain_score >= strain_score:
            high_strain_recoveries.append(row.recovery_score)
        elif row.strain_score < strain_score - 2:
            low_strain_recoveries.append(row.recovery_score)
    
    if not high_strain_recoveries:
        return None
    
    avg_recovery_high_strain = sum(high_strain_recoveries) / len(high_strain_recoveries)
    avg_recovery_low_strain = sum(low_strain_recoveries) / len(low_strain_recoveries) if low_strain_recoveries else 67
    
    # Calculate risk (lower recovery = higher risk)
    burnout_risk = max(0, min(100, (34 - avg_recovery_high_strain) / 34 * 100))
    
    # Estimate safe threshold (where recovery drops below 67)
    historical_strains = [r.strain_score for r in rows if r.strain_score is not None]
    if historical_strains:
        safe_threshold = float(np.percentile(historical_strains, 75))
    else:
        safe_threshold = 14.0
    
    risk_increase = ((avg_recovery_low_strain - avg_recovery_high_strain) / avg_recovery_low_strain * 100) if avg_recovery_low_strain > 0 else 0
    
    return {
        'burnout_risk': burnout_risk,
        'safe_threshold': safe_threshold,
        'predicted_recovery': avg_recovery_high_strain,
        'recovery_drop_pct': risk_increase,
        'confidence': min(0.8, len(rows) / 30.0),
        'recommendation': (
            f"Safe strain threshold is {safe_threshold:.1f}. "
            f"Exceeding this increases burnout risk by {abs(risk_increase):.0f}%."
        ) if strain_score > safe_threshold else f"Strain level {strain_score:.1f} is within safe range."
    }

