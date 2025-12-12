"""
Explainable AI (XAI) Service
Provides SHAP values, LIME explanations, and feature importance for factor impact analysis.
"""
from __future__ import annotations

import logging
from typing import Optional, Dict, List, Any
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False

try:
    import lime
    import lime.lime_tabular
    LIME_AVAILABLE = True
except ImportError:
    LIME_AVAILABLE = False

try:
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.preprocessing import StandardScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

from app.models.database import DailyMetrics
from app.core_config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def _prepare_factor_data(
    db: Session,
    user_id: str,
    factor_key: str
) -> Optional[tuple[pd.DataFrame, np.ndarray, List[str]]]:
    """Prepare data for XAI analysis."""
    rows = (
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .order_by(DailyMetrics.date.asc())
        .all()
    )
    
    if len(rows) < 10:
        return None
    
    features_list = []
    targets = []
    
    for i, r in enumerate(rows[:-1]):
        next_day = rows[i+1]
        if next_day.recovery_score is None:
            continue
        
        # Check if factor occurred - try multiple key formats
        is_present = False
        if r.extra:
            # Try exact match
            val = r.extra.get(factor_key)
            if val is None:
                # Try with "Question: " prefix
                val = r.extra.get(f"Question: {factor_key}")
            if val is None:
                # Try case-insensitive match
                for key, v in r.extra.items():
                    if key.lower() == factor_key.lower() or key.lower().replace(' ', '_') == factor_key.lower():
                        val = v
                        break
            
            if val is not None:
                if isinstance(val, str):
                    is_present = val.lower() in ['yes', 'true', '1']
                elif isinstance(val, (int, float)):
                    is_present = val > 0
                elif isinstance(val, bool):
                    is_present = val
        
        # Features: current day metrics + factor flag
        features = [
            float(r.recovery_score or 50),
            float(r.strain_score or 0),
            float(r.sleep_hours or 7.5),
            float(r.hrv or 50),
            float(r.resting_hr or 60),
            float(r.acute_chronic_ratio or 1.0),
            float(r.sleep_debt or 0),
            float(r.consistency_score or 50),
            float(1.0 if is_present else 0.0),  # Factor flag
        ]
        
        features_list.append(features)
        targets.append(float(next_day.recovery_score))
    
    if len(features_list) < 10:
        return None
    
    feature_names = [
        'recovery_score',
        'strain_score',
        'sleep_hours',
        'hrv',
        'resting_hr',
        'acute_chronic_ratio',
        'sleep_debt',
        'consistency_score',
        f'{factor_key}_present'
    ]
    
    X = pd.DataFrame(features_list, columns=feature_names)
    y = np.array(targets)
    
    return X, y, feature_names


def get_shap_explanations(
    db: Session,
    user_id: str,
    factor_key: str,
    model: Optional[Any] = None
) -> Optional[Dict]:
    """
    Get SHAP values for factor importance and explanations.
    
    Returns:
        Dictionary with SHAP values, feature importance, and explanations
    """
    if not SHAP_AVAILABLE or not SKLEARN_AVAILABLE:
        logger.warning("SHAP not available for XAI explanations")
        return None
    
    # Prepare data
    data = _prepare_factor_data(db, user_id, factor_key)
    if not data:
        return None
    
    X, y, feature_names = data
    
    # Train model if not provided
    if model is None:
        if XGBOOST_AVAILABLE:
            model = xgb.XGBRegressor(n_estimators=50, random_state=42)
        else:
            model = RandomForestRegressor(n_estimators=50, random_state=42)
        model.fit(X, y)
    
    # Calculate SHAP values
    try:
        # Use TreeExplainer for tree-based models
        if isinstance(model, (xgb.XGBRegressor, RandomForestRegressor)) and SHAP_AVAILABLE:
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(X)
        else:
            # Use KernelExplainer as fallback
            explainer = shap.KernelExplainer(model.predict, X.iloc[:50])
            shap_values = explainer.shap_values(X.iloc[:100])
        
        # Calculate mean absolute SHAP values (feature importance)
        if isinstance(shap_values, list):
            shap_values = np.array(shap_values)
        
        mean_shap = np.abs(shap_values).mean(axis=0)
        
        # Get feature importance ranking
        feature_importance = dict(zip(feature_names, mean_shap.tolist()))
        sorted_importance = sorted(
            feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        # Calculate interaction effects (if factor is present)
        factor_idx = feature_names.index(f'{factor_key}_present')
        factor_shap = shap_values[:, factor_idx]
        
        # Get examples where factor had high/low impact
        high_impact_indices = np.where(factor_shap < -2)[0]  # Negative impact
        low_impact_indices = np.where(np.abs(factor_shap) < 0.5)[0]  # Minimal impact
        
        return {
            'feature_importance': feature_importance,
            'sorted_importance': sorted_importance,
            'factor_importance': float(mean_shap[factor_idx]),
            'factor_rank': next(
                (i for i, (name, _) in enumerate(sorted_importance) if name == f'{factor_key}_present'),
                len(sorted_importance)
            ) + 1,
            'shap_values': shap_values.tolist() if len(shap_values) < 1000 else shap_values[:100].tolist(),
            'feature_names': feature_names,
            'model_type': type(model).__name__,
            'explanation': _generate_shap_explanation(feature_importance, factor_key, sorted_importance)
        }
    except Exception as e:
        logger.error(f"Error calculating SHAP values: {e}", exc_info=True)
        return None


def _generate_shap_explanation(
    feature_importance: Dict[str, float],
    factor_key: str,
    sorted_importance: List[tuple]
) -> str:
    """Generate human-readable explanation from SHAP values."""
    factor_name = factor_key.replace('_', ' ').title()
    factor_importance = feature_importance.get(f'{factor_key}_present', 0)
    
    # Find rank
    rank = next(
        (i + 1 for i, (name, _) in enumerate(sorted_importance) if name == f'{factor_key}_present'),
        len(sorted_importance)
    )
    
    # Get top 3 most important features
    top_features = [name for name, _ in sorted_importance[:3] if name != f'{factor_key}_present']
    
    if rank <= 3:
        explanation = f"{factor_name} is among the top {rank} most important factors affecting your recovery. "
    elif rank <= 5:
        explanation = f"{factor_name} has moderate importance (ranked #{rank}) in affecting your recovery. "
    else:
        explanation = f"{factor_name} has lower importance (ranked #{rank}) compared to other factors. "
    
    if top_features:
        top_feature_names = [f.replace('_', ' ').title() for f in top_features]
        explanation += f"The most important factors for your recovery are: {', '.join(top_feature_names)}. "
    
    if factor_importance > 2.0:
        explanation += f"{factor_name} has a strong impact on your recovery patterns."
    elif factor_importance > 1.0:
        explanation += f"{factor_name} has a moderate impact on your recovery."
    else:
        explanation += f"{factor_name} has a relatively minor impact compared to other factors."
    
    return explanation


def get_lime_explanation(
    db: Session,
    user_id: str,
    factor_key: str,
    instance_idx: Optional[int] = None,
    model: Optional[Any] = None
) -> Optional[Dict]:
    """
    Get LIME explanation for a specific instance.
    
    Args:
        db: Database session
        user_id: User identifier
        factor_key: Factor to explain
        instance_idx: Index of instance to explain (defaults to most recent with factor)
        model: Pre-trained model (optional)
    
    Returns:
        Dictionary with LIME explanation
    """
    if not LIME_AVAILABLE or not SKLEARN_AVAILABLE:
        logger.warning("LIME not available for XAI explanations")
        return None
    
    # Prepare data
    data = _prepare_factor_data(db, user_id, factor_key)
    if not data:
        return None
    
    X, y, feature_names = data
    
    # Train model if not provided
    if model is None:
        if XGBOOST_AVAILABLE:
            model = xgb.XGBRegressor(n_estimators=50, random_state=42)
        else:
            model = RandomForestRegressor(n_estimators=50, random_state=42)
        model.fit(X, y)
    
    # Find instance to explain
    if instance_idx is None:
        # Find most recent instance where factor was present
        factor_col = f'{factor_key}_present'
        factor_instances = X[X[factor_col] > 0.5]
        if len(factor_instances) > 0:
            instance_idx = factor_instances.index[-1]
        else:
            instance_idx = len(X) - 1
    
    if instance_idx >= len(X):
        instance_idx = len(X) - 1
    
    try:
        # Create LIME explainer
        explainer = lime.lime_tabular.LimeTabularExplainer(
            X.values,
            feature_names=feature_names,
            mode='regression',
            discretize_continuous=True
        )
        
        # Explain instance
        instance = X.iloc[instance_idx].values
        explanation = explainer.explain_instance(
            instance,
            model.predict,
            num_features=len(feature_names)
        )
        
        # Extract explanation data
        exp_list = explanation.as_list()
        exp_dict = {name: weight for name, weight in exp_list}
        
        # Get prediction
        prediction = model.predict([instance])[0]
        actual = y[instance_idx]
        
        return {
            'instance_idx': int(instance_idx),
            'feature_contributions': exp_dict,
            'predicted_recovery': float(prediction),
            'actual_recovery': float(actual),
            'prediction_error': float(abs(prediction - actual)),
            'top_positive_features': [
                (name, weight) for name, weight in exp_list if weight > 0
            ][:5],
            'top_negative_features': [
                (name, weight) for name, weight in exp_list if weight < 0
            ][:5],
            'factor_contribution': exp_dict.get(f'{factor_key}_present', 0.0),
            'explanation_text': _generate_lime_explanation(exp_dict, factor_key, prediction, actual)
        }
    except Exception as e:
        logger.error(f"Error calculating LIME explanation: {e}", exc_info=True)
        return None


def _generate_lime_explanation(
    contributions: Dict[str, float],
    factor_key: str,
    prediction: float,
    actual: float
) -> str:
    """Generate human-readable explanation from LIME."""
    factor_name = factor_key.replace('_', ' ').title()
    factor_contrib = contributions.get(f'{factor_key}_present', 0.0)
    
    explanation = f"For this specific instance, the model predicted a recovery of {prediction:.1f}% "
    explanation += f"(actual: {actual:.1f}%). "
    
    if factor_contrib < -2:
        explanation += f"{factor_name} significantly lowered the predicted recovery by {abs(factor_contrib):.1f} points. "
    elif factor_contrib < -0.5:
        explanation += f"{factor_name} moderately lowered the predicted recovery by {abs(factor_contrib):.1f} points. "
    elif factor_contrib > 0.5:
        explanation += f"{factor_name} increased the predicted recovery by {factor_contrib:.1f} points. "
    else:
        explanation += f"{factor_name} had minimal impact ({factor_contrib:.2f} points) on this prediction. "
    
    # Get top contributing factors
    sorted_contribs = sorted(contributions.items(), key=lambda x: abs(x[1]), reverse=True)
    top_contribs = [name for name, _ in sorted_contribs[:3] if name != f'{factor_key}_present']
    
    if top_contribs:
        top_names = [name.replace('_', ' ').title() for name in top_contribs]
        explanation += f"Other key factors were: {', '.join(top_names)}."
    
    return explanation


def get_feature_interactions(
    db: Session,
    user_id: str,
    factor_key: str,
    model: Optional[Any] = None
) -> Optional[Dict]:
    """
    Analyze feature interactions, especially with the factor.
    
    Returns:
        Dictionary with interaction analysis
    """
    if not SKLEARN_AVAILABLE:
        return None
    
    # Prepare data
    data = _prepare_factor_data(db, user_id, factor_key)
    if not data:
        return None
    
    X, y, feature_names = data
    
    # Train model if not provided
    if model is None:
        if XGBOOST_AVAILABLE:
            model = xgb.XGBRegressor(n_estimators=50, random_state=42)
        else:
            model = RandomForestRegressor(n_estimators=50, random_state=42)
        model.fit(X, y)
    
    # Calculate correlations with factor
    factor_col = f'{factor_key}_present'
    if factor_col not in X.columns:
        return None
    
    interactions = {}
    
    for col in X.columns:
        if col == factor_col:
            continue
        
        # Calculate correlation
        corr = X[col].corr(X[factor_col])
        
        # Calculate interaction: recovery when both factor and this feature are high
        factor_high = X[X[factor_col] > 0.5]
        factor_low = X[X[factor_col] <= 0.5]
        
        if len(factor_high) > 0 and len(factor_low) > 0:
            # Get indices
            high_idx = factor_high.index
            low_idx = factor_low.index
            
            # Get corresponding recovery scores
            high_recovery = y[high_idx]
            low_recovery = y[low_idx]
            
            # Calculate interaction when this feature is also high
            feature_median = X[col].median()
            high_both = factor_high[factor_high[col] > feature_median]
            
            if len(high_both) > 0:
                both_idx = high_both.index
                both_recovery = y[both_idx]
                
                interactions[col] = {
                    'correlation_with_factor': float(corr),
                    'recovery_with_factor_only': float(np.mean(high_recovery)),
                    'recovery_without_factor': float(np.mean(low_recovery)),
                    'recovery_with_both_high': float(np.mean(both_recovery)),
                    'interaction_effect': float(np.mean(both_recovery) - np.mean(high_recovery))
                }
    
    # Sort by interaction effect
    sorted_interactions = sorted(
        interactions.items(),
        key=lambda x: abs(x[1]['interaction_effect']),
        reverse=True
    )
    
    return {
        'interactions': interactions,
        'top_interactions': sorted_interactions[:5],
        'factor_key': factor_key
    }

