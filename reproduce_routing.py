
import sys
import os
from fastapi.testclient import TestClient

# Add current directory to sys.path
sys.path.insert(0, os.getcwd())
# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.getcwd(), "backend"))

# Mock environment variables
os.environ["VERCEL"] = "1"
os.environ["API_V1_PREFIX"] = "/api/v1"

try:
    from backend.app.main import app
    
    client = TestClient(app)
    
    print("="*50)
    print("TESTING ROUTING")
    print("="*50)
    
    # Test 1: GET /api/v1/whoop/ingest
    print("\nTest 1: GET /api/v1/whoop/ingest")
    response = client.get("/api/v1/whoop/ingest")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Test 2: POST /api/v1/whoop/ingest (without file, should be 422)
    print("\nTest 2: POST /api/v1/whoop/ingest (no body)")
    response = client.post("/api/v1/whoop/ingest")
    print(f"Status: {response.status_code}")
    # We expect 422 Unprocessable Entity, NOT 405 Method Not Allowed
    
    # Test 3: POST /whoop/ingest (without prefix - check if stripping is needed)
    print("\nTest 3: POST /whoop/ingest (no prefix)")
    response = client.post("/whoop/ingest")
    print(f"Status: {response.status_code}")
    
    print("="*50)

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
