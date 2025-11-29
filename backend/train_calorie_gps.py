#!/usr/bin/env python3
"""
Local training script for Calorie GPS model.

This script trains the Calorie GPS model locally using data from the database.
Run this after uploading WHOOP data to train the model.

Usage:
    python train_calorie_gps.py <user_id>
    
Example:
    python train_calorie_gps.py 7b2c5289-6328-4e9c-a71a-5883fe291b7c
"""

import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

import logging
from sqlalchemy.orm import Session
from app.db_session import SessionLocal
from app.ml.models.trainer import train_user_models
from app.ml.models.calorie_gps_model import train_calorie_gps_model

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    if len(sys.argv) < 2:
        print("Usage: python train_calorie_gps.py <user_id>")
        print("\nExample:")
        print("  python train_calorie_gps.py 7b2c5289-6328-4e9c-a71a-5883fe291b7c")
        sys.exit(1)
    
    user_id = sys.argv[1]
    
    logger.info(f"Training Calorie GPS model for user: {user_id}")
    
    db: Session = SessionLocal()
    try:
        # Train all models (including Calorie GPS)
        logger.info("Training all user models...")
        result = train_user_models(db, user_id, is_mobile=False)
        
        if result:
            logger.info(f"Training status: {result.get('status')}")
            logger.info(f"Trained models: {result.get('trained_models', [])}")
            logger.info(f"Days used: {result.get('days_used', 0)}")
            
            if 'calorie_gps' in result.get('trained_models', []):
                logger.info("✅ Calorie GPS model trained successfully!")
                logger.info(f"Model saved to: {result.get('calorie_gps_path')}")
            else:
                logger.warning("⚠️  Calorie GPS model was not trained")
                logger.info("This might be because:")
                logger.info("  - Insufficient workout data (< 10 workouts with calories and duration)")
                logger.info("  - Missing required data (recovery, HRV, etc.)")
                
                # Try training just Calorie GPS model directly
                logger.info("\nAttempting to train Calorie GPS model directly...")
                calorie_gps_result = train_calorie_gps_model(db, user_id, is_mobile=False)
                
                if calorie_gps_result and calorie_gps_result.get('status') == 'ok':
                    logger.info("✅ Calorie GPS model trained successfully!")
                    logger.info(f"  MAE: {calorie_gps_result.get('mae', 0):.2f}")
                    logger.info(f"  R²: {calorie_gps_result.get('r2', 0):.3f}")
                    logger.info(f"  Sample size: {calorie_gps_result.get('sample_size', 0)}")
                else:
                    logger.error("❌ Failed to train Calorie GPS model")
                    if calorie_gps_result:
                        logger.error(f"  Reason: {calorie_gps_result.get('message', 'Unknown')}")
                        logger.error(f"  Workouts available: {calorie_gps_result.get('workouts_available', 0)}")
        else:
            logger.error("❌ Training failed - no result returned")
            logger.error("Check logs for more details")
            
    except Exception as e:
        logger.error(f"Error training models: {e}", exc_info=True)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()























