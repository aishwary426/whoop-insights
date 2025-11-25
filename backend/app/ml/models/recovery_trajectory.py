"""
Recovery Trajectory Prediction
Predicts multi-day recovery trajectory after factor occurrence using sequence models.
"""
from __future__ import annotations

import logging
from typing import Optional, Dict, List, Tuple, Any
import pandas as pd
import numpy as np
from datetime import date, timedelta
from sqlalchemy.orm import Session

try:
    from sklearn.preprocessing import StandardScaler, MinMaxScaler
    from sklearn.model_selection import train_test_split
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

try:
    import joblib
    JOBLIB_AVAILABLE = True
except ImportError:
    JOBLIB_AVAILABLE = False

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False

from app.models.database import DailyMetrics
from app.core_config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def _create_sequences(data: np.ndarray, sequence_length: int = 7, prediction_days: int = 3) -> Tuple[np.ndarray, np.ndarray]:
    """Create sequences for LSTM training."""
    X, y = [], []
    for i in range(len(data) - sequence_length - prediction_days + 1):
        X.append(data[i:i + sequence_length])
        y.append(data[i + sequence_length:i + sequence_length + prediction_days])
    return np.array(X), np.array(y)


def train_recovery_trajectory_model(db: Session, user_id: str, factor_key: Optional[str] = None) -> Optional[Dict]:
    """
    Train a model to predict recovery trajectory after factor occurrence.
    
    Args:
        db: Database session
        user_id: User identifier
        factor_key: Optional specific factor to train on (e.g., 'alcohol')
    
    Returns:
        Dictionary with trained model and metadata, or None if insufficient data
    """
    if not SKLEARN_AVAILABLE or not JOBLIB_AVAILABLE:
        logger.warning("ML libraries not available for recovery trajectory modeling")
        return None
    
    # Get daily metrics
    rows = (
        db.query(DailyMetrics)
        .filter(
            DailyMetrics.user_id == user_id,
            DailyMetrics.recovery_score.isnot(None)
        )
        .order_by(DailyMetrics.date.asc())
        .all()
    )
    
    if len(rows) < 14:
        logger.info(f"Insufficient data for trajectory model: {len(rows)} days (need 14+)")
        return None
    
    # Build sequences: [day-6, day-5, ..., day-1, day0] -> [day+1, day+2, day+3]
    sequences = []
    targets = []
    factor_flags = []
    
    for i in range(6, len(rows) - 3):
        # Get 7 days of context (day-6 to day0)
        context_days = rows[i-6:i+1]
        
        # Get 3 days of future recovery (day+1 to day+3)
        future_days = rows[i+1:i+4]
        
        # Check if all required data exists
        if any(d.recovery_score is None for d in context_days + future_days):
            continue
        
        # Check if factor occurred on day 0 - try multiple key formats
        factor_occurred = False
        if factor_key and context_days[-1].extra:
            # Try exact match
            val = context_days[-1].extra.get(factor_key)
            if val is None:
                # Try with "Question: " prefix
                val = context_days[-1].extra.get(f"Question: {factor_key}")
            if val is None:
                # Try case-insensitive match
                for key, v in context_days[-1].extra.items():
                    if key.lower() == factor_key.lower() or key.lower().replace(' ', '_') == factor_key.lower():
                        val = v
                        break
            
            if val is not None:
                if isinstance(val, str):
                    factor_occurred = val.lower() in ['yes', 'true', '1']
                elif isinstance(val, (int, float)):
                    factor_occurred = val > 0
                elif isinstance(val, bool):
                    factor_occurred = val
        
        # Build feature sequence
        sequence_features = []
        for day in context_days:
            features = [
                float(day.recovery_score or 50),
                float(day.strain_score or 0),
                float(day.sleep_hours or 7.5),
                float(day.hrv or 50),
                float(day.resting_hr or 60),
                float(day.acute_chronic_ratio or 1.0),
                float(day.sleep_debt or 0),
                float(day.consistency_score or 50),
            ]
            sequence_features.append(features)
        
        # Target: recovery scores for next 3 days
        target_recovery = [float(d.recovery_score) for d in future_days]
        
        sequences.append(sequence_features)
        targets.append(target_recovery)
        factor_flags.append(factor_occurred)
    
    if len(sequences) < 5:
        logger.info(f"Insufficient sequences for trajectory model: {len(sequences)} sequences (need 5+)")
        return None
    
    X = np.array(sequences)
    y = np.array(targets)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scale features
    scaler_X = StandardScaler()
    scaler_y = MinMaxScaler()
    
    # Reshape for scaling
    n_samples, n_timesteps, n_features = X_train.shape
    X_train_reshaped = X_train.reshape(-1, n_features)
    X_train_scaled = scaler_X.fit_transform(X_train_reshaped)
    X_train_scaled = X_train_scaled.reshape(n_samples, n_timesteps, n_features)
    
    X_test_reshaped = X_test.reshape(-1, n_features)
    X_test_scaled = scaler_X.transform(X_test_reshaped)
    X_test_scaled = X_test_scaled.reshape(X_test.shape[0], X_test.shape[1], X_test.shape[2])
    
    y_train_scaled = scaler_y.fit_transform(y_train)
    y_test_scaled = scaler_y.transform(y_test)
    
    # Train XGBoost model (simpler alternative to LSTM)
    # Flatten sequences for XGBoost
    X_train_flat = X_train_scaled.reshape(X_train_scaled.shape[0], -1)
    X_test_flat = X_test_scaled.reshape(X_test_scaled.shape[0], -1)
    
    model_results = {}
    
    # Train XGBoost model
    if XGBOOST_AVAILABLE:
        try:
            xgb_model = xgb.XGBRegressor(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                random_state=42,
                objective='reg:squarederror'
            )
            xgb_model.fit(X_train_flat, y_train_scaled)
            
            # Evaluate
            train_pred = xgb_model.predict(X_train_flat)
            test_pred = xgb_model.predict(X_test_flat)
            
            # Calculate metrics
            train_mae = np.mean(np.abs(train_pred - y_train_scaled))
            test_mae = np.mean(np.abs(test_pred - y_test_scaled))
            
            # Calculate R²
            from sklearn.metrics import r2_score
            train_r2 = r2_score(y_train_scaled, train_pred)
            test_r2 = r2_score(y_test_scaled, test_pred)
            
            model_results['xgb_model'] = xgb_model
            model_results['xgb_train_mae'] = float(train_mae)
            model_results['xgb_test_mae'] = float(test_mae)
            model_results['xgb_train_r2'] = float(train_r2)
            model_results['xgb_test_r2'] = float(test_r2)
            
            logger.info(f"XGBoost trajectory model trained: Test MAE={test_mae:.3f}, R²={test_r2:.3f}")
        except Exception as e:
            logger.error(f"Error training XGBoost trajectory model: {e}", exc_info=True)
    
    # Train LSTM if TensorFlow is available
    if TENSORFLOW_AVAILABLE:
        try:
            lstm_model = keras.Sequential([
                layers.LSTM(64, return_sequences=True, input_shape=(n_timesteps, n_features)),
                layers.Dropout(0.2),
                layers.LSTM(32, return_sequences=False),
                layers.Dropout(0.2),
                layers.Dense(16, activation='relu'),
                layers.Dense(3)  # Predict 3 days ahead
            ])
            
            lstm_model.compile(
                optimizer=keras.optimizers.Adam(learning_rate=0.001),
                loss='mse',
                metrics=['mae']
            )
            
            # Train with early stopping
            early_stopping = keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=10,
                restore_best_weights=True
            )
            
            history = lstm_model.fit(
                X_train_scaled, y_train_scaled,
                validation_data=(X_test_scaled, y_test_scaled),
                epochs=50,
                batch_size=16,
                verbose=0,
                callbacks=[early_stopping]
            )
            
            # Evaluate
            test_loss, test_mae_lstm = lstm_model.evaluate(X_test_scaled, y_test_scaled, verbose=0)
            test_pred_lstm = lstm_model.predict(X_test_scaled, verbose=0)
            
            from sklearn.metrics import r2_score
            test_r2_lstm = r2_score(y_test_scaled, test_pred_lstm)
            
            model_results['lstm_model'] = lstm_model
            model_results['lstm_test_mae'] = float(test_mae_lstm)
            model_results['lstm_test_r2'] = float(test_r2_lstm)
            
            logger.info(f"LSTM trajectory model trained: Test MAE={test_mae_lstm:.3f}, R²={test_r2_lstm:.3f}")
        except Exception as e:
            logger.error(f"Error training LSTM trajectory model: {e}", exc_info=True)
    
    if not model_results:
        return None
    
    # Save scalers
    model_results['scaler_X'] = scaler_X
    model_results['scaler_y'] = scaler_y
    model_results['sequence_length'] = 7
    model_results['prediction_days'] = 3
    model_results['n_features'] = n_features
    model_results['sample_size'] = len(sequences)
    
    return model_results


def predict_recovery_trajectory(
    db: Session,
    user_id: str,
    factor_key: str,
    current_date: Optional[date] = None,
    model_data: Optional[Dict] = None
) -> Optional[Dict]:
    """
    Predict recovery trajectory after factor occurrence.
    
    Args:
        db: Database session
        user_id: User identifier
        factor_key: Factor to predict for (e.g., 'alcohol')
        current_date: Date when factor occurred (defaults to latest)
        model_data: Pre-loaded model data (optional)
    
    Returns:
        Dictionary with predicted recovery trajectory and confidence
    """
    if not model_data:
        # Try to load model
        from app.ml.models.model_loader import load_latest_models
        models = load_latest_models(user_id)
        model_data = models.get('recovery_trajectory')
    
    if not model_data:
        logger.warning("No trajectory model available for prediction")
        return None
    
    # Get recent context (last 7 days)
    if current_date is None:
        latest = (
            db.query(DailyMetrics)
            .filter(DailyMetrics.user_id == user_id)
            .order_by(DailyMetrics.date.desc())
            .first()
        )
        if not latest:
            return None
        current_date = latest.date
    
    context_start = current_date - timedelta(days=6)
    context_rows = (
        db.query(DailyMetrics)
        .filter(
            DailyMetrics.user_id == user_id,
            DailyMetrics.date >= context_start,
            DailyMetrics.date <= current_date
        )
        .order_by(DailyMetrics.date.asc())
        .all()
    )
    
    if len(context_rows) < 7:
        logger.warning(f"Insufficient context data: {len(context_rows)} days")
        return None
    
    # Build feature sequence
    sequence_features = []
    for day in context_rows:
        features = [
            float(day.recovery_score or 50),
            float(day.strain_score or 0),
            float(day.sleep_hours or 7.5),
            float(day.hrv or 50),
            float(day.resting_hr or 60),
            float(day.acute_chronic_ratio or 1.0),
            float(day.sleep_debt or 0),
            float(day.consistency_score or 50),
        ]
        sequence_features.append(features)
    
    X = np.array([sequence_features])
    
    # Scale features
    scaler_X = model_data['scaler_X']
    scaler_y = model_data['scaler_y']
    
    n_timesteps, n_features = X.shape[1], X.shape[2]
    X_reshaped = X.reshape(-1, n_features)
    X_scaled = scaler_X.transform(X_reshaped)
    X_scaled = X_scaled.reshape(1, n_timesteps, n_features)
    
    # Predict
    predictions = {}
    
    # Use XGBoost if available
    if 'xgb_model' in model_data:
        X_flat = X_scaled.reshape(1, -1)
        y_pred_scaled = model_data['xgb_model'].predict(X_flat)
        y_pred = scaler_y.inverse_transform(y_pred_scaled)
        predictions['xgb'] = {
            'trajectory': [float(x) for x in y_pred[0]],
            'confidence': float(model_data.get('xgb_test_r2', 0.7))
        }
    
    # Use LSTM if available
    if 'lstm_model' in model_data:
        y_pred_scaled = model_data['lstm_model'].predict(X_scaled, verbose=0)
        y_pred = scaler_y.inverse_transform(y_pred_scaled)
        predictions['lstm'] = {
            'trajectory': [float(x) for x in y_pred[0]],
            'confidence': float(model_data.get('lstm_test_r2', 0.7))
        }
    
    # Use best model (prefer LSTM if available, else XGBoost)
    if 'lstm' in predictions:
        best_pred = predictions['lstm']
        model_type = 'LSTM'
    elif 'xgb' in predictions:
        best_pred = predictions['xgb']
        model_type = 'XGBoost'
    else:
        return None
    
    # Generate dates
    prediction_dates = [current_date + timedelta(days=i+1) for i in range(3)]
    
    return {
        'trajectory': best_pred['trajectory'],
        'dates': [d.isoformat() for d in prediction_dates],
        'confidence': best_pred['confidence'],
        'model_type': model_type,
        'all_predictions': predictions
    }


def _simple_trajectory_prediction(
    db: Session,
    user_id: str,
    factor_insight: Any,
    current_date: Optional[date] = None
) -> Optional[Dict]:
    """
    Simple rule-based trajectory prediction using historical patterns.
    Fallback when ML model is not available.
    """
    from datetime import timedelta
    
    if not factor_insight or not factor_insight.data:
        return None
    
    # Get current recovery
    if current_date is None:
        latest = (
            db.query(DailyMetrics)
            .filter(DailyMetrics.user_id == user_id)
            .order_by(DailyMetrics.date.desc())
            .first()
        )
        if not latest or latest.recovery_score is None:
            return None
        current_recovery = latest.recovery_score
        current_date = latest.date
    else:
        latest = (
            db.query(DailyMetrics)
            .filter(
                DailyMetrics.user_id == user_id,
                DailyMetrics.date == current_date
            )
            .first()
        )
        if not latest or latest.recovery_score is None:
            return None
        current_recovery = latest.recovery_score
    
    # Get impact from insight
    impact = factor_insight.data.get('impact_val', 0)
    avg_with = factor_insight.data.get('avg_with', current_recovery)
    avg_without = factor_insight.data.get('avg_without', current_recovery)
    
    # Simple trajectory: assume recovery improves by 1/3 of impact each day
    # If factor has negative impact, recovery gradually improves
    # If factor has positive impact, recovery gradually declines (returning to baseline)
    
    if impact < 0:  # Negative impact (factor lowers recovery)
        # Recovery gradually improves back toward baseline
        day1 = current_recovery + abs(impact) * 0.3
        day2 = current_recovery + abs(impact) * 0.6
        day3 = current_recovery + abs(impact) * 0.9
        # Cap at baseline (avg_without)
        day1 = min(day1, avg_without)
        day2 = min(day2, avg_without)
        day3 = min(day3, avg_without)
    else:  # Positive impact (factor increases recovery)
        # Recovery gradually returns to baseline
        day1 = current_recovery - impact * 0.3
        day2 = current_recovery - impact * 0.6
        day3 = current_recovery - impact * 0.9
        # Floor at baseline (avg_without)
        day1 = max(day1, avg_without)
        day2 = max(day2, avg_without)
        day3 = max(day3, avg_without)
    
    # Ensure values are in valid range
    day1 = max(0, min(100, day1))
    day2 = max(0, min(100, day2))
    day3 = max(0, min(100, day3))
    
    prediction_dates = [current_date + timedelta(days=i+1) for i in range(3)]
    
    return {
        'trajectory': [float(day1), float(day2), float(day3)],
        'dates': [d.isoformat() for d in prediction_dates],
        'confidence': 0.6,  # Lower confidence for rule-based
        'model_type': 'Rule-Based (Simple)',
        'note': 'Using historical patterns. Train ML model for more accurate predictions.'
    }

