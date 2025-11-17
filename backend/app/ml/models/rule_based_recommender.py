"""
Rule-based recommendation engine.
Provides recommendations when ML models aren't available or as a fallback.
"""
import logging
from typing import Tuple, Optional
from datetime import time
from app.models.database import DailyMetrics, IntensityLevel, Workout
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def recommend(
    db: Session,
    user_id: str,
    daily_metric: DailyMetrics
) -> Tuple[IntensityLevel, str, str, str, Optional[str]]:
    """
    Generate rule-based recommendation for today.
    
    Returns:
        Tuple of (intensity_level, focus, workout_type, notes, optimal_time)
    """
    recovery = daily_metric.recovery_score or 50
    strain = daily_metric.strain_score or 0
    sleep = daily_metric.sleep_hours or 7
    hrv = daily_metric.hrv
    rhr = daily_metric.resting_hr
    acute_chronic = daily_metric.acute_chronic_ratio or 1.0
    sleep_debt = daily_metric.sleep_debt or 0
    consistency = daily_metric.consistency_score or 50
    
    # Determine intensity level
    if recovery >= 67 and strain < 10 and sleep >= 7:
        intensity = IntensityLevel.HIGH
    elif recovery >= 34 and strain < 12:
        intensity = IntensityLevel.MODERATE
    elif recovery < 34 or sleep < 6 or (acute_chronic > 1.3):
        intensity = IntensityLevel.REST
    else:
        intensity = IntensityLevel.LIGHT
    
    # Determine focus
    if recovery < 34:
        focus = "Recovery"
    elif acute_chronic > 1.3:
        focus = "Recovery"
    elif sleep_debt > 5:
        focus = "Sleep hygiene"
    elif consistency < 50:
        focus = "Consistency"
    elif recovery >= 67:
        focus = "Overload"
    else:
        focus = "Maintenance"
    
    # Determine workout type
    if intensity == IntensityLevel.REST:
        workout_type = "Rest day / Mobility"
    elif intensity == IntensityLevel.LIGHT:
        workout_type = "Zone 2 cardio / Light strength"
    elif intensity == IntensityLevel.MODERATE:
        if recovery >= 50:
            workout_type = "Zone 3-4 intervals / Moderate strength"
        else:
            workout_type = "Zone 2 cardio / Bodyweight"
    else:  # HIGH
        if recovery >= 67:
            workout_type = "HIIT / Heavy strength / Sport-specific"
        else:
            workout_type = "Zone 3-4 intervals / Moderate strength"
    
    # Generate notes
    notes_parts = []
    
    if recovery >= 67:
        notes_parts.append("High recovery - great day for intense training.")
    elif recovery < 34:
        notes_parts.append("Low recovery - prioritize rest and recovery.")
    
    if acute_chronic > 1.3:
        notes_parts.append("Acute load is high vs chronic - reduce intensity.")
    elif acute_chronic < 0.7:
        notes_parts.append("Acute load is low - can safely increase volume.")
    
    if sleep < 6:
        notes_parts.append("Sleep was insufficient - focus on recovery.")
    elif sleep >= 8:
        notes_parts.append("Good sleep - body is well-recovered.")
    
    if sleep_debt > 5:
        notes_parts.append(f"Sleep debt is {sleep_debt:.1f}h - prioritize sleep.")
    
    if hrv and daily_metric.hrv_baseline_7d:
        hrv_pct = (hrv / daily_metric.hrv_baseline_7d - 1) * 100
        if hrv_pct < -10:
            notes_parts.append("HRV is below baseline - may indicate stress.")
        elif hrv_pct > 10:
            notes_parts.append("HRV is above baseline - good recovery signal.")
    
    if not notes_parts:
        notes_parts.append("Maintain consistency with your training plan.")
    
    notes = " ".join(notes_parts)
    
    # Determine optimal time (based on historical workout patterns)
    optimal_time = get_optimal_workout_time(db, user_id)
    
    return intensity, focus, workout_type, notes, optimal_time


def get_optimal_workout_time(db: Session, user_id: str) -> Optional[str]:
    """
    Determine optimal workout time based on user's historical patterns.
    
    Returns:
        String like "Late afternoon (4-7pm)" or None
    """
    # Get recent workouts with times
    workouts = (
        db.query(Workout)
        .filter(Workout.user_id == user_id)
        .filter(Workout.start_time.isnot(None))
        .order_by(Workout.start_time.desc())
        .limit(30)
        .all()
    )
    
    if not workouts:
        return None
    
    # Extract hours
    hours = []
    for w in workouts:
        if w.start_time:
            hours.append(w.start_time.hour)
    
    if not hours:
        return None
    
    # Find most common hour range
    avg_hour = sum(hours) / len(hours)
    
    if 5 <= avg_hour < 10:
        return "Early morning (5-10am)"
    elif 10 <= avg_hour < 14:
        return "Late morning (10am-2pm)"
    elif 14 <= avg_hour < 17:
        return "Early afternoon (2-5pm)"
    elif 17 <= avg_hour < 20:
        return "Late afternoon (4-7pm)"
    elif 20 <= avg_hour < 22:
        return "Evening (7-10pm)"
    else:
        return "Late evening (10pm+)"
