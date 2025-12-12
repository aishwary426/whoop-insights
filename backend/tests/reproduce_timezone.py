
import pytest
from datetime import datetime, date
from unittest.mock import MagicMock, patch
from app.api.v1.endpoints.whoop import whoop_callback
from app.models.database import DailyMetrics

# Mock Whoop Client
class MockWhoopClient:
    async def get_access_token(self, code):
        return {"access_token": "fake_token", "refresh_token": "fake_refresh"}
    
    async def get_profile(self, token):
        return {"email": "test@example.com", "first_name": "Test", "last_name": "User"}
    
    async def get_cycle_data(self, token, start, end):
        # Simulate a cycle that starts at 11 PM IST (UTC+5:30) on 2023-10-25
        # 11 PM IST = 17:30 UTC on 2023-10-25
        # End time: 7 AM IST on 2023-10-26
        # 7 AM IST = 01:30 UTC on 2023-10-26
        
        # If we use Start Time (UTC): 2023-10-25 (Wrong)
        # If we use End Time (UTC): 2023-10-26 (Correct)
        # If we use End Time (Local): 2023-10-26 (Correct)
        
        return [{
            "id": "cycle_1",
            "score": {"strain": 10.0, "kilojoule": 1000, "average_heart_rate": 60, "max_heart_rate": 120},
            "start": "2023-10-25T17:30:00.000Z", 
            "end": "2023-10-26T01:30:00.000Z",
            "timezone_offset": "+05:30" 
        }]

    async def get_sleep_data(self, token, start, end):
        return []
    
    async def get_recovery_data(self, token, start, end):
        return []

    async def get_workout_data(self, token, start, end):
        return []

@pytest.mark.asyncio
async def test_timezone_handling(db_session):
    # Patch the whoop_client used in the endpoint
    with patch("app.api.v1.endpoints.whoop.whoop_client", new=MockWhoopClient()):
        # Call the callback
        await whoop_callback(code="fake_code", state="test_user", db=db_session)
        
        # Check the ingested DailyMetrics
        metric = db_session.query(DailyMetrics).filter(DailyMetrics.user_id == "test_user").first()
        
        assert metric is not None
        # We expect the date to be 2023-10-26 (IST), but current buggy code will likely make it 2023-10-25 (UTC)
        print(f"Ingested Date: {metric.date}")
        
        # This assertion is expected to FAIL before the fix
        assert metric.date == date(2023, 10, 26)
