
import sys
import os
from pathlib import Path

# Add current directory to sys.path
sys.path.insert(0, os.getcwd())

# Mock environment variables if needed
os.environ["VERCEL"] = "1"

try:
    from backend.app.main import app
    
    print("="*50)
    print("REGISTERED ROUTES:")
    print("="*50)
    
    for route in app.routes:
        methods = ", ".join(route.methods) if hasattr(route, "methods") else "None"
        print(f"Path: {route.path} | Methods: {methods} | Name: {route.name}")
        
    print("="*50)
    
except Exception as e:
    print(f"Error importing app: {e}")
    import traceback
    traceback.print_exc()
