from __future__ import annotations

import numpy as np
from app.models.database import DailyMetrics, IntensityLevel


def recommend(dm: DailyMetrics, models: dict | None = None) -> dict:
    """Simple guard-rail rules to return an actionable plan."""
    strain = float(dm.strain_score or 0)
    recovery = float(dm.recovery_score or 50)
    sleep = float(dm.sleep_hours or 0)
    hrv_z = float(dm.hrv_z_score or 0)
    has_high_debt = (dm.sleep_debt or 0) > 4

    if recovery < 40 or hrv_z <= -1.0 or has_high_debt:
        intensity = IntensityLevel.REST
        focus = "recovery"
        workout_type = "Mobility + easy walk"
        notes = "Prioritise recovery (hydration, mobility, early night)."
    elif recovery < 65 or sleep < 6.5:
        intensity = IntensityLevel.LIGHT
        focus = "aerobic_base"
        workout_type = "Zone 2 cardio or light full-body"
        notes = "Keep effort comfortable; protect sleep tonight."
    elif strain < 8:
        intensity = IntensityLevel.MODERATE
        focus = "progressive_load"
        workout_type = "Moderate intervals or strength split"
        notes = "Good window to build; stay within RPE 7."
    else:
        intensity = IntensityLevel.HIGH
        focus = "overload"
        workout_type = "Heavy strength or VO2 max intervals"
        notes = "Push today, but extend cooldown and refuel."

    # Estimate target strain for calorie prediction
    target_strain = {
        IntensityLevel.REST: 4.0,
        IntensityLevel.LIGHT: 8.0,
        IntensityLevel.MODERATE: 12.0,
        IntensityLevel.HIGH: 16.0,
    }.get(intensity, 10.0)

    predicted_calories = None
    if models and (cal_model := models.get("calorie")):
        try:
            # Features: ["strain_score", "sleep_hours", "hrv", "acute_chronic_ratio", "sleep_debt", "consistency_score"]
            features = np.array([[
                target_strain,
                float(dm.sleep_hours or 0),
                float(dm.hrv or 0),
                float(dm.acute_chronic_ratio or 0),
                float(dm.sleep_debt or 0),
                float(dm.consistency_score or 0),
            ]])
            predicted_calories = float(cal_model.predict(features)[0])
        except Exception:
            pass

    # Fallback if no model or prediction failed
    if predicted_calories is None:
        # Simple heuristic: ~50 cals per strain point? (Very rough)
        predicted_calories = target_strain * 40 + 200

    optimal_time = "Late afternoon (4-7pm)" if sleep < 7 else "Mid-morning (9-11am)"

    risk_flags = []
    if has_high_debt:
        risk_flags.append("Sleep debt >4h past 7 days")
    if strain > 14:
        risk_flags.append("High strain vs typical week")
    if hrv_z <= -1:
        risk_flags.append("HRV below baseline")

    return {
        "intensity_level": intensity,
        "focus": focus,
        "workout_type": workout_type,
        "notes": notes,
        "optimal_time": optimal_time,
        "risk_flags": risk_flags,
        "predicted_calories": int(predicted_calories),
    }
