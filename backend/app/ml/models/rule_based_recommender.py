from app.models.database import IntensityLevel, DailyMetrics

def recommend(dm: DailyMetrics):
    strain = dm.strain_score or 0
    if strain < 5:
        return IntensityLevel.LIGHT, "mobility", "Light walk", "Low strain day."
    elif strain < 10:
        return IntensityLevel.MODERATE, "endurance", "Zone 2 cardio", "Good window for moderate work."
    else:
        return IntensityLevel.HIGH, "strength", "Intervals / heavy strength", "High strain window."
