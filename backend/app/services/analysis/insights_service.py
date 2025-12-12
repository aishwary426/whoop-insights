"""
Insights generation service.
Analyzes patterns in user data and generates actionable insights.
"""
import logging
from datetime import date, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np

from app.models.database import Insight, InsightType, DailyMetrics, Workout

logger = logging.getLogger(__name__)


def generate_insights_for_user(db: Session, user_id: str, max_insights: int = 10) -> List[Insight]:
    """
    Generate insights for a user based on their data patterns.
    
    Args:
        db: Database session
        user_id: User identifier
        max_insights: Maximum number of insights to generate
    
    Returns:
        List of Insight records
    """
    logger.info(f"Generating insights for user {user_id}")
    
    # Get historical data
    metrics = (
        db.query(DailyMetrics)
        .filter(DailyMetrics.user_id == user_id)
        .order_by(DailyMetrics.date.asc())
        .all()
    )
    
    if len(metrics) < 14:  # Need at least 2 weeks
        logger.warning(f"Insufficient data for insights: {len(metrics)} days")
        return []
    
    insights = []
    
    # Convert to DataFrame for analysis
    df = pd.DataFrame([{
        'date': m.date,
        'recovery': m.recovery_score,
        'strain': m.strain_score,
        'sleep': m.sleep_hours,
        'hrv': m.hrv,
        'workouts_count': m.workouts_count or 0,
    } for m in metrics])
    
    df['date'] = pd.to_datetime(df['date'])
    df['weekday'] = df['date'].dt.dayofweek  # 0=Monday, 6=Sunday
    df['is_weekend'] = df['weekday'].isin([5, 6])
    
    # Insight 1: Weekday vs Weekend Consistency
    weekday_consistency = df[~df['is_weekend']]['workouts_count'].mean()
    weekend_consistency = df[df['is_weekend']]['workouts_count'].mean()
    
    if abs(weekday_consistency - weekend_consistency) > 0.5:
        if weekday_consistency > weekend_consistency:
            insights.append(Insight(
                user_id=user_id,
                insight_type=InsightType.CONSISTENCY,
                title="Weekday vs Weekend Training Pattern",
                description=f"You are more consistent on weekdays ({weekday_consistency:.1f} workouts/day) vs weekends ({weekend_consistency:.1f} workouts/day). Consider balancing your training schedule.",
                confidence=0.7,
                period_start=df['date'].min().date(),
                period_end=df['date'].max().date(),
                data={'weekday_avg': float(weekday_consistency), 'weekend_avg': float(weekend_consistency)},
            ))
    
    # Insight 2: Sleep and Recovery Correlation
    if len(df) >= 28:
        sleep_recovery_corr = df[['sleep', 'recovery']].corr().iloc[0, 1]
        
        if sleep_recovery_corr > 0.3:
            # Find optimal sleep for recovery
            df_with_sleep = df[df['sleep'].notna() & df['recovery'].notna()]
            if len(df_with_sleep) >= 10:
                high_recovery_days = df_with_sleep[df_with_sleep['recovery'] >= 67]
                if len(high_recovery_days) >= 5:
                    optimal_sleep = high_recovery_days['sleep'].mean()
                    
                    insights.append(Insight(
                        user_id=user_id,
                        insight_type=InsightType.RECOVERY_PATTERN,
                        title="Sleep and Recovery Correlation",
                        description=f"Your best recovery days (≥67%) correlate with {optimal_sleep:.1f}h of sleep on average. Aim for this target for optimal recovery.",
                        confidence=0.75,
                        period_start=df['date'].min().date(),
                        period_end=df['date'].max().date(),
                        data={'correlation': float(sleep_recovery_corr), 'optimal_sleep': float(optimal_sleep)},
                    ))
    
    # Insight 3: Late Night Workouts Impact
    workouts = (
        db.query(Workout)
        .filter(Workout.user_id == user_id)
        .filter(Workout.start_time.isnot(None))
        .all()
    )
    
    if workouts:
        workout_df = pd.DataFrame([{
            'date': w.date,
            'hour': w.start_time.hour if w.start_time else None,
            'recovery_next': None,
        } for w in workouts])
        
        # Get next day recovery for each workout
        for idx, row in workout_df.iterrows():
            next_day = row['date'] + timedelta(days=1)
            next_metric = db.query(DailyMetrics).filter(
                DailyMetrics.user_id == user_id,
                DailyMetrics.date == next_day
            ).first()
            
            if next_metric:
                workout_df.at[idx, 'recovery_next'] = next_metric.recovery_score
        
        late_workouts = workout_df[workout_df['hour'] >= 20]  # After 8pm
        early_workouts = workout_df[workout_df['hour'] < 20]
        
        if len(late_workouts) >= 5 and len(early_workouts) >= 5:
            late_recovery = late_workouts['recovery_next'].mean()
            early_recovery = early_workouts['recovery_next'].mean()
            
            if late_recovery < early_recovery - 10:
                insights.append(Insight(
                    user_id=user_id,
                    insight_type=InsightType.RECOVERY_PATTERN,
                    title="Late Night Workouts Impact Recovery",
                    description=f"Workouts after 8pm are associated with lower next-day recovery ({late_recovery:.0f}% vs {early_recovery:.0f}%). Consider scheduling earlier when possible.",
                    confidence=0.65,
                    period_start=workout_df['date'].min(),
                    period_end=workout_df['date'].max(),
                    data={'late_avg_recovery': float(late_recovery), 'early_avg_recovery': float(early_recovery)},
                ))
    
    # Insight 4: Strain and Recovery Balance
    if len(df) >= 28:
        high_strain_days = df[df['strain'] >= 12]
        if len(high_strain_days) >= 10:
            avg_recovery_after_high_strain = high_strain_days['recovery'].mean()
            
            if avg_recovery_after_high_strain < 50:
                insights.append(Insight(
                    user_id=user_id,
                    insight_type=InsightType.WORKOUT_EFFICIENCY,
                    title="High Strain Days Impact Recovery",
                    description=f"On days with high strain (≥12), your average recovery is {avg_recovery_after_high_strain:.0f}%. Consider spacing high-intensity days with recovery periods.",
                    confidence=0.7,
                    period_start=df['date'].min().date(),
                    period_end=df['date'].max().date(),
                    data={'avg_recovery': float(avg_recovery_after_high_strain)},
                ))
    
    # Insight 5: HRV Trends
    if len(df) >= 30:
        recent_hrv = df['hrv'].tail(14).mean()
        earlier_hrv = df['hrv'].head(14).mean()
        
        if pd.notna(recent_hrv) and pd.notna(earlier_hrv):
            hrv_change = ((recent_hrv - earlier_hrv) / earlier_hrv) * 100
            
            if abs(hrv_change) > 10:
                if hrv_change > 0:
                    insights.append(Insight(
                        user_id=user_id,
                        insight_type=InsightType.RECOVERY_PATTERN,
                        title="Improving HRV Trend",
                        description=f"Your HRV has improved by {hrv_change:.1f}% over the last 2 weeks, indicating better recovery capacity.",
                        confidence=0.7,
                        period_start=df['date'].tail(14).iloc[0].date(),
                        period_end=df['date'].max().date(),
                        data={'hrv_change_pct': float(hrv_change)},
                    ))
                else:
                    insights.append(Insight(
                        user_id=user_id,
                        insight_type=InsightType.RECOVERY_PATTERN,
                        title="Declining HRV Trend",
                        description=f"Your HRV has decreased by {abs(hrv_change):.1f}% over the last 2 weeks. Consider reducing training load or prioritizing recovery.",
                        confidence=0.7,
                        period_start=df['date'].tail(14).iloc[0].date(),
                        period_end=df['date'].max().date(),
                        data={'hrv_change_pct': float(hrv_change)},
                    ))
    
    # Limit to max_insights
    insights = insights[:max_insights]
    
    # Save to database
    for insight in insights:
        # Check if similar insight already exists
        existing = db.query(Insight).filter(
            Insight.user_id == user_id,
            Insight.insight_type == insight.insight_type,
            Insight.title == insight.title
        ).first()
        
        if not existing:
            db.add(insight)
    
    db.commit()
    
    logger.info(f"Generated {len(insights)} insights for user {user_id}")
    
    return insights

