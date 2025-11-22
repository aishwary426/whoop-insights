"""
Strain Tolerance Modeling
Learns individual strain thresholds (when strain becomes harmful) for each user.
"""
from __future__ import annotations

import logging
from typing import Optional, Dict, List
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
from app.ml.models.model_loader import load_latest_models
from datetime import date, timedelta

logger = logging.getLogger(__name__)
settings = get_settings()


def _get_strain_threshold_examples(db: Session, user_id: str, threshold: float, max_examples: int = 5) -> List[Dict]:
    """
    Get historical examples showing why the strain threshold is optimal.
    
    Returns examples of:
    - Days where strain was below threshold and NEXT DAY's recovery was good
    - Days where strain exceeded threshold and NEXT DAY's recovery dropped
    
    Note: Recovery is measured in the morning and reflects the previous day's strain.
    So we look at Day N's strain → Day N+1's recovery.
    """
    examples = []
    
    # Get historical data sorted by date descending to get most recent days first
    # Then reverse to iterate forward (needing consecutive days for pairing)
    rows = (
        db.query(DailyMetrics)
        .filter(
            DailyMetrics.user_id == user_id,
            DailyMetrics.strain_score.isnot(None),
            DailyMetrics.recovery_score.isnot(None)
        )
        .order_by(DailyMetrics.date.desc())
        .limit(60)  # Get most recent 60 days
        .all()
    )
    
    # Reverse to get chronological order (oldest to newest) for proper day pairing
    rows = list(reversed(rows))
    
    if len(rows) < 5:
        return examples
    
    # Find examples where strain was below threshold with good NEXT DAY recovery
    good_examples = []
    from datetime import date as date_class
    today_date = date_class.today()
    
    # Collect ALL matching examples (don't break early)
    for i in range(len(rows) - 1):  # -1 because we need next day's recovery
        strain_day_row = rows[i]
        recovery_day_row = rows[i + 1]
        
        # Skip if recovery day is today (we don't have tomorrow's recovery yet)
        # Also skip if strain day is today (strain might be 0 or incomplete)
        if recovery_day_row.date >= today_date or strain_day_row.date >= today_date:
            continue
            
        if (strain_day_row.strain_score is not None and 
            recovery_day_row.recovery_score is not None):
            if strain_day_row.strain_score <= threshold and recovery_day_row.recovery_score >= 67:
                good_examples.append({
                    'date': recovery_day_row.date.isoformat() if isinstance(recovery_day_row.date, date) else str(recovery_day_row.date),
                    'strain': float(strain_day_row.strain_score),
                    'recovery': float(recovery_day_row.recovery_score),
                    'type': 'good',
                    'message': f"Strain {strain_day_row.strain_score:.1f} → Recovery {recovery_day_row.recovery_score:.0f}%"
                })
    
    # Find examples where strain exceeded threshold with poor NEXT DAY recovery
    bad_examples = []
    # Collect ALL matching examples (don't break early)
    for i in range(len(rows) - 1):  # -1 because we need next day's recovery
        strain_day_row = rows[i]
        recovery_day_row = rows[i + 1]
        
        # Skip if recovery day is today (we don't have tomorrow's recovery yet)
        # Also skip if strain day is today (strain might be 0 or incomplete)
        if recovery_day_row.date >= today_date or strain_day_row.date >= today_date:
            continue
            
        if (strain_day_row.strain_score is not None and 
            recovery_day_row.recovery_score is not None):
            if strain_day_row.strain_score > threshold and recovery_day_row.recovery_score < 67:
                bad_examples.append({
                    'date': recovery_day_row.date.isoformat() if isinstance(recovery_day_row.date, date) else str(recovery_day_row.date),
                    'strain': float(strain_day_row.strain_score),
                    'recovery': float(recovery_day_row.recovery_score),
                    'type': 'bad',
                    'message': f"Strain {strain_day_row.strain_score:.1f} → Recovery {recovery_day_row.recovery_score:.0f}%"
                })
    
    # Sort each list by date (most recent first) before combining
    def get_date_for_sorting(example):
        date_str = example['date']
        if isinstance(date_str, str):
            try:
                return date.fromisoformat(date_str)
            except (ValueError, AttributeError):
                return date_str
        elif isinstance(date_str, date):
            return date_str
        return date.min
    
    good_examples.sort(key=get_date_for_sorting, reverse=True)
    bad_examples.sort(key=get_date_for_sorting, reverse=True)
    
    # Combine and take top examples from each (most recent first)
    all_examples = good_examples[:3] + bad_examples[:3]
    
    # Final sort to ensure most recent examples are shown first
    all_examples.sort(key=get_date_for_sorting, reverse=True)
    
    return all_examples[:max_examples]


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
    Predict burnout risk for a given strain level using trained model if available.
    
    Args:
        db: Database session
        user_id: User identifier
        strain_score: Proposed strain score
        current_recovery: Current recovery score
        sleep_hours: Sleep hours
        hrv: HRV value
        acute_chronic_ratio: Acute/chronic load ratio
    
    Returns:
        Dictionary with burnout risk prediction, safe threshold, and recommendation.
        Format: "Your safe strain threshold is 14.5 - exceeding this increases burnout risk by 60%"
    """
    # Try to load trained model first
    if JOBLIB_AVAILABLE:
        models = load_latest_models(user_id)
        strain_model_data = models.get("strain_tolerance")
        
        if strain_model_data and isinstance(strain_model_data, dict):
            try:
                model = strain_model_data.get('model')
                scaler = strain_model_data.get('scaler')
                saved_threshold = strain_model_data.get('safe_threshold')
                
                if model and scaler:
                    # Use trained model to predict burnout risk
                    features = np.array([[
                        float(strain_score),
                        float(current_recovery),
                        float(sleep_hours),
                        float(hrv),
                        float(acute_chronic_ratio),
                    ]])
                    
                    # Scale features
                    features_scaled = scaler.transform(features)
                    
                    # Predict burnout risk probability
                    burnout_prob = model.predict_proba(features_scaled)[0, 1]
                    burnout_risk = float(burnout_prob * 100)  # Convert to percentage
                    
                    # Calculate risk curve by testing different strain levels
                    # This is needed to find threshold and calculate risk increase
                    median_recovery = current_recovery
                    test_strains = np.arange(0, 21, 0.5)
                    test_features = []
                    
                    for test_strain in test_strains:
                        test_features.append([
                            float(test_strain),
                            float(median_recovery),
                            float(sleep_hours),
                            float(hrv),
                            float(acute_chronic_ratio),
                        ])
                    
                    test_scaled = scaler.transform(test_features)
                    test_probas = model.predict_proba(test_scaled)[:, 1]
                    
                    # Use saved threshold or calculate from model
                    safe_threshold = saved_threshold
                    if safe_threshold is None:
                        # Find threshold where risk exceeds 30%
                        for idx, test_strain in enumerate(test_strains):
                            if test_probas[idx] > 0.3:
                                safe_threshold = float(test_strain)
                                break
                        
                        if safe_threshold is None:
                            safe_threshold = 14.0
                    
                    # Calculate risk increase percentage
                    # Risk at threshold vs risk 2 points below threshold
                    threshold_idx = int(safe_threshold * 2)
                    risk_at_threshold = float(test_probas[threshold_idx]) if threshold_idx < len(test_probas) else 0.3
                    
                    below_threshold_strain = max(0, safe_threshold - 2)
                    below_idx = int(below_threshold_strain * 2)
                    risk_below = float(test_probas[below_idx]) if below_idx < len(test_probas) else 0.1
                    
                    risk_increase_pct = ((risk_at_threshold - risk_below) / risk_below * 100) if risk_below > 0 else 50
                    
                    # Get historical examples to show why this threshold is optimal
                    examples = _get_strain_threshold_examples(db, user_id, safe_threshold)
                    
                    # Format recommendation message
                    recommendation = (
                        f"Your safe strain threshold is {safe_threshold:.1f} - "
                        f"exceeding this increases burnout risk by {abs(risk_increase_pct):.0f}%"
                    )
                    
                    logger.debug(
                        f"Strain tolerance prediction for user {user_id}: "
                        f"threshold={safe_threshold:.1f}, risk={burnout_risk:.1f}%, "
                        f"increase={risk_increase_pct:.0f}%"
                    )
                    
                    return {
                        'burnout_risk': burnout_risk,
                        'safe_threshold': float(safe_threshold),
                        'risk_at_threshold': float(risk_at_threshold * 100),
                        'risk_increase_pct': float(risk_increase_pct),
                        'confidence': 0.85,  # High confidence for ML model
                        'recommendation': recommendation,
                        'predicted_recovery': None,  # Not directly predicted by this model
                        'examples': examples,  # Historical examples
                    }
            except Exception as e:
                logger.warning(f"Error using trained strain tolerance model: {e}", exc_info=True)
                # Fall through to rule-based fallback
    
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
    
    # Get historical examples
    examples = _get_strain_threshold_examples(db, user_id, safe_threshold)
    
    # Format recommendation message to match requirement
    recommendation = (
        f"Your safe strain threshold is {safe_threshold:.1f} - "
        f"exceeding this increases burnout risk by {abs(risk_increase):.0f}%"
    )
    
    return {
        'burnout_risk': burnout_risk,
        'safe_threshold': safe_threshold,
        'predicted_recovery': avg_recovery_high_strain,
        'recovery_drop_pct': risk_increase,
        'confidence': min(0.7, len(rows) / 30.0),  # Lower confidence for rule-based
        'recommendation': recommendation,
        'examples': examples,  # Historical examples
    }

