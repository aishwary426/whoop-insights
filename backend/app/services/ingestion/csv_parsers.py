"""
CSV parsers for WHOOP export files.
Each parser handles a specific CSV type and maps it to our internal schema.
"""
import pandas as pd
import logging
from datetime import datetime, date
from typing import List, Dict, Optional
from pathlib import Path

logger = logging.getLogger(__name__)


def normalize_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize column names: lowercase, strip, replace spaces with underscores."""
    df.columns = df.columns.str.lower().str.strip().str.replace(" ", "_")
    return df


def parse_sleep_csv(csv_path: Path) -> pd.DataFrame:
    """
    Parse sleep CSV file.
    
    Expected columns (WHOOP format):
    - Date / date
    - Sleep Performance / sleep_performance
    - Sleep Need / sleep_need
    - Hours in Bed / hours_in_bed
    - Hours Slept / hours_slept
    - Sleep Debt / sleep_debt
    - Deep Sleep / deep_sleep (minutes)
    - REM Sleep / rem_sleep (minutes)
    - Light Sleep / light_sleep (minutes)
    - Awake / awake (minutes)
    - Respiratory Rate / respiratory_rate
    """
    try:
        df = pd.read_csv(csv_path)
        df = normalize_column_names(df)
        
        logger.info(f"Parsed sleep CSV: {len(df)} rows, columns: {list(df.columns)}")
        
        # Map common column variations
        date_col = None
        for col in ['date', 'sleep_date', 'day']:
            if col in df.columns:
                date_col = col
                break
        
        if not date_col:
            raise ValueError("No date column found in sleep CSV")
        
        # Convert date
        df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
        df = df.dropna(subset=[date_col])
        
        # Extract sleep hours (try multiple column names)
        sleep_hours_col = None
        for col in ['hours_slept', 'sleep_hours', 'total_sleep', 'sleep_duration']:
            if col in df.columns:
                sleep_hours_col = col
                break
        
        if sleep_hours_col:
            df['sleep_hours'] = pd.to_numeric(df[sleep_hours_col], errors='coerce')
        else:
            # Try to calculate from minutes
            for col in ['sleep_minutes', 'total_sleep_minutes']:
                if col in df.columns:
                    df['sleep_hours'] = pd.to_numeric(df[col], errors='coerce') / 60
                    break
        
        return df[[date_col, 'sleep_hours']].rename(columns={date_col: 'date'})
        
    except Exception as e:
        logger.error(f"Error parsing sleep CSV {csv_path}: {e}")
        raise


def parse_recovery_csv(csv_path: Path) -> pd.DataFrame:
    """
    Parse recovery CSV file.
    
    Expected columns:
    - Date / date
    - Recovery Score / recovery_score / Recovery
    - HRV / hrv
    - RHR / rhr / resting_heart_rate
    - Skin Temp / skin_temp
    - Blood Oxygen / blood_oxygen
    """
    try:
        df = pd.read_csv(csv_path)
        df = normalize_column_names(df)
        
        logger.info(f"Parsed recovery CSV: {len(df)} rows, columns: {list(df.columns)}")
        
        # Find date column
        date_col = None
        for col in ['date', 'recovery_date', 'day', 'cycle_date']:
            if col in df.columns:
                date_col = col
                break
        
        if not date_col:
            raise ValueError("No date column found in recovery CSV")
        
        df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
        df = df.dropna(subset=[date_col])
        
        # Extract recovery score
        recovery_col = None
        for col in ['recovery_score', 'recovery', 'recovery_percentage']:
            if col in df.columns:
                recovery_col = col
                break
        
        # Extract HRV
        hrv_col = None
        for col in ['hrv', 'hrv_rmssd', 'hrv_score']:
            if col in df.columns:
                hrv_col = col
                break
        
        # Extract RHR
        rhr_col = None
        for col in ['rhr', 'resting_heart_rate', 'resting_hr', 'rhr_bpm']:
            if col in df.columns:
                rhr_col = col
                break
        
        result = pd.DataFrame({'date': df[date_col]})
        
        if recovery_col:
            result['recovery_score'] = pd.to_numeric(df[recovery_col], errors='coerce')
        if hrv_col:
            result['hrv'] = pd.to_numeric(df[hrv_col], errors='coerce')
        if rhr_col:
            result['resting_hr'] = pd.to_numeric(df[rhr_col], errors='coerce')
        
        return result
        
    except Exception as e:
        logger.error(f"Error parsing recovery CSV {csv_path}: {e}")
        raise


def parse_strain_csv(csv_path: Path) -> pd.DataFrame:
    """
    Parse strain CSV file.
    
    Expected columns:
    - Date / date
    - Strain / strain_score / Strain Score
    - Day Strain / day_strain
    """
    try:
        df = pd.read_csv(csv_path)
        df = normalize_column_names(df)
        
        logger.info(f"Parsed strain CSV: {len(df)} rows")
        
        # Find date column
        date_col = None
        for col in ['date', 'strain_date', 'day']:
            if col in df.columns:
                date_col = col
                break
        
        if not date_col:
            raise ValueError("No date column found in strain CSV")
        
        df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
        df = df.dropna(subset=[date_col])
        
        # Extract strain
        strain_col = None
        for col in ['strain', 'strain_score', 'day_strain', 'strain_value']:
            if col in df.columns:
                strain_col = col
                break
        
        result = pd.DataFrame({'date': df[date_col]})
        
        if strain_col:
            result['strain_score'] = pd.to_numeric(df[strain_col], errors='coerce')
        
        return result
        
    except Exception as e:
        logger.error(f"Error parsing strain CSV {csv_path}: {e}")
        raise


def parse_workout_csv(csv_path: Path) -> pd.DataFrame:
    """
    Parse workout CSV file.
    
    Expected columns:
    - Date / date / Workout Date
    - Start Time / start_time
    - End Time / end_time
    - Duration / duration / Duration (minutes)
    - Sport / sport / Sport Type
    - Strain / strain
    - Avg HR / avg_hr / Average Heart Rate
    - Max HR / max_hr / Maximum Heart Rate
    - Calories / calories
    """
    try:
        df = pd.read_csv(csv_path)
        df = normalize_column_names(df)
        
        logger.info(f"Parsed workout CSV: {len(df)} rows, columns: {list(df.columns)}")
        
        # Find date column
        date_col = None
        for col in ['date', 'workout_date', 'day', 'start_date']:
            if col in df.columns:
                date_col = col
                break
        
        if not date_col:
            raise ValueError("No date column found in workout CSV")
        
        df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
        df = df.dropna(subset=[date_col])
        
        # Extract fields
        result = pd.DataFrame({'date': df[date_col]})
        
        # Start/end time
        for col in ['start_time', 'start']:
            if col in df.columns:
                result['start_time'] = pd.to_datetime(df[col], errors='coerce')
                break
        
        for col in ['end_time', 'end']:
            if col in df.columns:
                result['end_time'] = pd.to_datetime(df[col], errors='coerce')
                break
        
        # Duration
        for col in ['duration', 'duration_minutes', 'duration_(minutes)']:
            if col in df.columns:
                result['duration_minutes'] = pd.to_numeric(df[col], errors='coerce')
                break
        
        # Sport type
        for col in ['sport', 'sport_type', 'exercise_type', 'activity']:
            if col in df.columns:
                result['sport_type'] = df[col].astype(str)
                break
        
        # Strain
        for col in ['strain', 'strain_score', 'workout_strain']:
            if col in df.columns:
                result['strain'] = pd.to_numeric(df[col], errors='coerce')
                break
        
        # Heart rate
        for col in ['avg_hr', 'average_heart_rate', 'avg_heart_rate', 'heart_rate_avg']:
            if col in df.columns:
                result['avg_hr'] = pd.to_numeric(df[col], errors='coerce')
                break
        
        for col in ['max_hr', 'maximum_heart_rate', 'max_heart_rate', 'heart_rate_max']:
            if col in df.columns:
                result['max_hr'] = pd.to_numeric(df[col], errors='coerce')
                break
        
        # Calories
        for col in ['calories', 'calories_burned', 'total_calories']:
            if col in df.columns:
                result['calories'] = pd.to_numeric(df[col], errors='coerce')
                break
        
        return result
        
    except Exception as e:
        logger.error(f"Error parsing workout CSV {csv_path}: {e}")
        raise

