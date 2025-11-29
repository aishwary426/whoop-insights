
import pytest
import pandas as pd
from datetime import date
from app.services.ingestion.whoop_ingestion import parse_physiological_cycles
import tempfile
import os

def test_csv_timezone_handling():
    # Create a temporary CSV file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
        # Simulate a cycle starting at 1:00 AM IST (19:30 UTC previous day)
        # 2023-10-26 01:00:00 IST = 2023-10-25 19:30:00 UTC
        # We expect the date to be 2023-10-26 (IST)
        # But if we parse UTC date, it will be 2023-10-25
        
        # Whoop CSV export usually has "Cycle Start Time"
        f.write("Cycle Start Time,Recovery Score,Day Strain,Timezone Offset\n")
        f.write("2023-10-25T19:30:00.000Z,90,10.0,+05:30\n")
        csv_path = f.name
        
    try:
        # Parse the CSV
        df = parse_physiological_cycles([csv_path])
        
        if df.empty:
            pytest.fail("DataFrame is empty")
            
        row = df.iloc[0]
        print(f"Ingested Date: {row['date']}")
        
        # This assertion is expected to FAIL before the fix
        assert row['date'] == date(2023, 10, 26)
        
    finally:
        os.remove(csv_path)

if __name__ == "__main__":
    # Manually run the test function if executed directly
    try:
        test_csv_timezone_handling()
        print("Test PASSED")
    except AssertionError as e:
        print(f"Test FAILED: {e}")
    except Exception as e:
        print(f"Test ERROR: {e}")
