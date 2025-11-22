import os
import zipfile
from pathlib import Path
from typing import List, Optional
import logging

from app.core_config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def save_upload_file(user_id: str, upload_id: str, file_obj, max_size: Optional[int] = None) -> str:
    """
    Save uploaded ZIP file to disk.
    
    Args:
        user_id: User identifier
        upload_id: Unique upload identifier
        file_obj: File-like object (from FastAPI UploadFile)
        max_size: Optional maximum file size in bytes
    
    Returns:
        Path to saved file
    
    Raises:
        ValueError: If file size exceeds max_size
    """
    folder = Path(settings.upload_dir) / user_id
    try:
        folder.mkdir(parents=True, exist_ok=True)
    except (OSError, PermissionError) as e:
        logger.error(f"Failed to create upload directory {folder}: {e}")
        raise ValueError(f"Failed to create upload directory: {e}")
    path = folder / f"{upload_id}.zip"

    logger.info(f"Saving upload {upload_id} for user {user_id} to {path}")
    
    total_size = 0
    chunk_size = 1024 * 1024  # 1MB chunks
    
    with open(path, "wb") as f:
        while True:
            chunk = file_obj.read(chunk_size)
            if not chunk:
                break
            
            total_size += len(chunk)
            
            # Check size limit if specified
            if max_size and total_size > max_size:
                # Clean up partial file
                try:
                    path.unlink()
                except Exception:
                    pass
                raise ValueError(f"File size ({total_size / 1024 / 1024:.2f} MB) exceeds maximum allowed size ({max_size / 1024 / 1024:.2f} MB). Vercel serverless functions have a 4.5MB body size limit.")
            
            f.write(chunk)

    file_size = path.stat().st_size
    logger.info(f"Saved {file_size / 1024 / 1024:.2f} MB to {path}")
    
    return str(path)


def unzip_whoop_export(zip_path: str, extract_to: Optional[str] = None) -> str:
    """
    Extract WHOOP export ZIP file.
    
    Args:
        zip_path: Path to ZIP file
        extract_to: Optional destination directory (defaults to zip parent / extracted)
    
    Returns:
        Path to extracted directory
    """
    zip_path_obj = Path(zip_path)
    
    if extract_to:
        extract_dir = Path(extract_to)
    else:
        extract_dir = zip_path_obj.parent / "extracted"
    
    extract_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Extracting {zip_path} to {extract_dir}")
    
    try:
        with zipfile.ZipFile(zip_path, "r") as z:
            z.extractall(extract_dir)
        
        extracted_files = list(extract_dir.rglob("*"))
        logger.info(f"Extracted {len(extracted_files)} files/directories")
        
        return str(extract_dir)
    except zipfile.BadZipFile:
        logger.error(f"Invalid ZIP file: {zip_path}")
        raise ValueError("Invalid ZIP file format")
    except Exception as e:
        logger.error(f"Error extracting ZIP: {e}")
        raise


def discover_csv_files(extracted_dir: str) -> dict[str, Path]:
    """
    Discover and categorize CSV files in extracted directory.
    
    WHOOP exports typically contain:
    - sleep.csv / Sleep.csv
    - recovery.csv / Recovery.csv
    - strain.csv / Strain.csv
    - workout.csv / Workout.csv
    - etc.
    
    Args:
        extracted_dir: Path to extracted directory
    
    Returns:
        Dictionary mapping file type to Path: {'sleep': Path(...), 'recovery': Path(...), ...}
    """
    extracted_path = Path(extracted_dir)
    csv_files = {}
    
    # Common WHOOP CSV patterns
    patterns = {
        'sleep': ['sleep', 'Sleep'],
        'recovery': ['recovery', 'Recovery'],
        'strain': ['strain', 'Strain'],
        'workout': ['workout', 'Workout', 'workouts', 'Workouts'],
        'hrv': ['hrv', 'HRV'],
        'rhr': ['rhr', 'RHR', 'resting_heart_rate'],
    }
    
    # Find all CSV files
    all_csvs = list(extracted_path.rglob("*.csv"))
    
    logger.info(f"Found {len(all_csvs)} CSV files")
    
    for csv_path in all_csvs:
        filename_lower = csv_path.name.lower()
        
        # Match against patterns
        for file_type, keywords in patterns.items():
            if any(keyword.lower() in filename_lower for keyword in keywords):
                if file_type not in csv_files:
                    csv_files[file_type] = csv_path
                    logger.info(f"Identified {file_type} CSV: {csv_path.name}")
                break
    
    # Log any unmatched CSVs
    matched_paths = set(csv_files.values())
    unmatched = [p for p in all_csvs if p not in matched_paths]
    if unmatched:
        logger.warning(f"Unmatched CSV files: {[p.name for p in unmatched]}")
    
    return csv_files
