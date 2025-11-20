import sys
import os
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("repro_test")

print("--- STARTING REPRODUCTION SCRIPT ---")

# Simulate Vercel env
os.environ['VERCEL'] = '1'

# Add backend to sys.path (simulating api/index.py logic)
current_dir = os.getcwd()
backend_path = os.path.join(current_dir, 'backend')

print(f"Adding {backend_path} to sys.path")
sys.path.insert(0, backend_path)

try:
    print("Attempting to import app.main...")
    from app.main import app
    print("SUCCESS: app.main imported")
except Exception as e:
    print(f"CRASH: Failed to import app.main: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("--- FINISHED REPRODUCTION SCRIPT ---")
