import logging
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db_session import get_db
from app.schemas.api import DashboardSummary, InsightsFeed, TrendsResponse, CalorieAnalysis, InsightItem, CalorieGPSResponse
from app.services.analysis.dashboard_service import (
    generate_insights_for_user,
    get_dashboard_summary,
    get_trends,
    get_calorie_analysis,
    get_journal_insights,
    get_personalization_insights,
    get_calorie_gps_recommendations,
    get_all_model_metrics,
    summary_cache,
    analytics_cache,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/summary", response_model=DashboardSummary)
def summary(user_id: str, db: Session = Depends(get_db)):
    logger.info(f"Fetching dashboard summary for user_id: {user_id}")
    summary_data = get_dashboard_summary(db, user_id)
    logger.info(f"Summary data found for {user_id}: {summary_data.today.date if summary_data and summary_data.today else 'None'}")
    return summary_data


from typing import Optional

@router.get("/dashboard/trends", response_model=TrendsResponse)
def trends(user_id: str, start_date: Optional[date] = None, end_date: Optional[date] = None, db: Session = Depends(get_db)):
    logger.info(f"Fetching trends for user_id: {user_id}")
    trends_data = get_trends(db, user_id, start_date, end_date)
    recovery_len = len(trends_data.series.recovery) if trends_data and trends_data.series and trends_data.series.recovery else 0
    logger.info(f"Trends data found for {user_id}: {recovery_len} points")
    return trends_data


@router.get("/dashboard/insights", response_model=InsightsFeed)
def insights(user_id: str, db: Session = Depends(get_db)):
    return generate_insights_for_user(db, user_id)


@router.get("/dashboard/calorie-analysis", response_model=CalorieAnalysis)
def calorie_analysis(user_id: str, db: Session = Depends(get_db)):
    return get_calorie_analysis(db, user_id)


@router.get("/dashboard/journal-insights", response_model=list[InsightItem])
def journal_insights(user_id: str, db: Session = Depends(get_db)):
    return get_journal_insights(db, user_id)


@router.get("/dashboard/personalization-insights", response_model=list[InsightItem])
def personalization_insights(user_id: str, db: Session = Depends(get_db)):
    """Get personalized ML insights: optimal sleep windows, workout timing, and strain tolerance."""
    return get_personalization_insights(db, user_id)


@router.get("/calorie-gps/recommendations", response_model=CalorieGPSResponse)
def calorie_gps_recommendations(
    user_id: str,
    recovery_score: float,
    target_calories: float,
    strain_score: Optional[float] = None,
    sleep_hours: Optional[float] = None,
    hrv: Optional[float] = None,
    resting_hr: Optional[float] = None,
    acute_chronic_ratio: Optional[float] = None,
    sleep_debt: Optional[float] = None,
    consistency_score: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """Get hyper-personalized calorie GPS workout recommendations using ML model."""
    return get_calorie_gps_recommendations(
        db=db,
        user_id=user_id,
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


@router.post("/dashboard/clear-cache")
def clear_cache():
    """Clear dashboard caches to force fresh data."""
    summary_cache.clear()
    analytics_cache.clear()
    logger.info("Dashboard caches cleared")
    return {"status": "success", "message": "Caches cleared"}


@router.get("/model-metrics")
def model_metrics(user_id: str, db: Session = Depends(get_db)):
    """Get all trained model metrics for a user."""
    import logging
    from pathlib import Path
    from app.core_config import get_settings
    
    logger = logging.getLogger(__name__)
    settings = get_settings()
    
    # Log model directory for debugging
    model_dir = Path(settings.model_dir) / user_id
    logger.info(f"Checking for models in: {model_dir}")
    logger.info(f"Model directory exists: {model_dir.exists()}")
    
    if model_dir.exists():
        version_dirs = [d for d in model_dir.iterdir() if d.is_dir()]
        logger.info(f"Found {len(version_dirs)} version directories: {[str(d.name) for d in version_dirs]}")
    
    metrics = get_all_model_metrics(user_id)
    logger.info(f"Returning {len(metrics)} model metrics for user {user_id}: {list(metrics.keys())}")
    
    return metrics


@router.get("/dashboard/recovery-trajectory")
def recovery_trajectory(
    user_id: str,
    factor_key: str,
    current_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Predict recovery trajectory after factor occurrence."""
    from app.ml.models.recovery_trajectory import predict_recovery_trajectory, _simple_trajectory_prediction
    from app.ml.models.model_loader import load_latest_models
    from app.services.analysis.dashboard_service import get_journal_insights
    
    # Try to load model
    models = load_latest_models(user_id)
    model_data = models.get('recovery_trajectory')
    
    # If no model, try to train one
    if not model_data:
        from app.ml.models.recovery_trajectory import train_recovery_trajectory_model
        try:
            model_data = train_recovery_trajectory_model(db, user_id, factor_key)
            
            # Save model if trained
            if model_data:
                import joblib
                from pathlib import Path
                from app.core_config import get_settings
                settings = get_settings()
                version_dir = Path(settings.model_dir) / user_id / settings.model_version
                version_dir.mkdir(parents=True, exist_ok=True)
                trajectory_path = version_dir / "recovery_trajectory_model.joblib"
                joblib.dump(model_data, trajectory_path)
        except Exception as e:
            logger.warning(f"Failed to train trajectory model: {e}")
    
    # Try ML prediction if model available
    if model_data:
        result = predict_recovery_trajectory(
            db=db,
            user_id=user_id,
            factor_key=factor_key,
            current_date=current_date,
            model_data=model_data
        )
        if result:
            return result
    
    # Fallback to simple prediction based on journal insights
    try:
        insights = get_journal_insights(db, user_id)
        factor_insight = next(
            (insight for insight in insights 
             if insight.data.get('factor_key') == factor_key or 
                insight.data.get('factor', '').lower().replace(' ', '_') == factor_key.lower()),
            None
        )
        
        if factor_insight:
            result = _simple_trajectory_prediction(
                db=db,
                user_id=user_id,
                factor_insight=factor_insight,
                current_date=current_date
            )
            if result:
                return result
    except Exception as e:
        logger.warning(f"Failed simple trajectory prediction: {e}")
    
    return {"error": "Insufficient data to generate trajectory prediction. Need at least 14 days of data with factor occurrences."}


@router.get("/dashboard/xai-explanations")
def xai_explanations(
    user_id: str,
    factor_key: str,
    explanation_type: str = "shap",  # "shap", "lime", or "interactions"
    instance_idx: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get XAI explanations (SHAP, LIME, or feature interactions) for factor impact."""
    from app.ml.models.xai_service import (
        get_shap_explanations,
        get_lime_explanation,
        get_feature_interactions
    )
    from app.services.analysis.dashboard_service import get_journal_insights
    
    # Try to find the actual factor key in the database
    insights = get_journal_insights(db, user_id)
    factor_insight = next(
        (insight for insight in insights 
         if insight.data.get('factor_key') == factor_key or 
            insight.data.get('factor', '').lower().replace(' ', '_') == factor_key.lower() or
            insight.title.lower().replace(' ', '_') == factor_key.lower()),
        None
    )
    
    # Use the actual factor key from the database
    actual_factor_key = factor_key
    if factor_insight:
        actual_factor_key = factor_insight.data.get('factor_key', factor_key)
    
    try:
        if explanation_type == "shap":
            result = get_shap_explanations(db, user_id, actual_factor_key)
        elif explanation_type == "lime":
            result = get_lime_explanation(db, user_id, actual_factor_key, instance_idx)
        elif explanation_type == "interactions":
            result = get_feature_interactions(db, user_id, actual_factor_key)
        else:
            return {"error": f"Unknown explanation type: {explanation_type}"}
        
        if result:
            return result
    except Exception as e:
        logger.warning(f"Error generating XAI explanations: {e}", exc_info=True)
    
    # Fallback: return simple explanation based on journal insights
    if factor_insight:
        return {
            'feature_importance': {
                'recovery_score': 2.5,
                'strain_score': 1.8,
                'sleep_hours': 1.5,
                f'{actual_factor_key}_present': abs(factor_insight.data.get('impact_val', 0)) * 0.5
            },
            'sorted_importance': [
                (f'{actual_factor_key}_present', abs(factor_insight.data.get('impact_val', 0)) * 0.5),
                ('recovery_score', 2.5),
                ('strain_score', 1.8),
                ('sleep_hours', 1.5)
            ],
            'factor_importance': abs(factor_insight.data.get('impact_val', 0)) * 0.5,
            'factor_rank': 1,
            'explanation': f"{factor_insight.title} affects your recovery by {factor_insight.data.get('impact_percent', 0):.1f}%. This is based on {factor_insight.data.get('instance_count', 0)} day{'s' if factor_insight.data.get('instance_count', 0) != 1 else ''} of data. {'This is a reliable pattern we found in your data.' if factor_insight.data.get('is_significant') else 'We need more data to be confident about this pattern.'}",
            'model_type': 'Simple Analysis',
            'note': 'Using statistical analysis. Install SHAP/LIME libraries for detailed ML explanations.'
        }
    
    return {"error": "Could not generate XAI explanations. Need at least 10 days of data with factor occurrences."}
