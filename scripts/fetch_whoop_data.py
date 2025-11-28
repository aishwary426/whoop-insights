import asyncio
import os
import sys
import json
from datetime import datetime, timedelta

import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.whoop_client import whoop_client

async def main():
    # Check for token in env
    access_token = os.getenv("WHOOP_ACCESS_TOKEN")
    
    if not access_token:
        print("No access token found in environment.")
        auth_url = whoop_client.get_authorization_url()
        print(f"\nPlease visit this URL to authorize:\n{auth_url}\n")
        # Flush stdout to ensure the user sees the URL immediately
        sys.stdout.flush()
        code = input("Paste the code from the callback URL here: ").strip()
        
        print("\nExchanging code for token...")
        try:
            token_data = await whoop_client.get_access_token(code)
            access_token = token_data["access_token"]
            print(f"Access Token obtained: {access_token[:5]}...")
        except Exception as e:
            print(f"Error exchanging code: {e}")
            return

    print("\nFetching data...")
    
    # Collect all data
    all_data = {}

    # Fetch Profile
    print("\n--- Profile ---")
    try:
        profile = await whoop_client.get_profile(access_token)
        print(json.dumps(profile, indent=2))
        all_data["profile"] = profile
    except Exception as e:
        print(f"Error fetching profile: {e}")
        all_data["profile_error"] = str(e)

    # Fetch Body Measurements
    print("\n--- Body Measurements ---")
    try:
        body = await whoop_client.get_body_measurements(access_token)
        print(json.dumps(body, indent=2))
        all_data["body_measurements"] = body
    except Exception as e:
        print(f"Error fetching body measurements: {e}")
        all_data["body_measurements_error"] = str(e)

    # Dates
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    start_str = start_date.isoformat() + "Z"
    end_str = end_date.isoformat() + "Z"

    # Fetch Cycles
    print(f"\n--- Cycles (Latest) ---")
    try:
        cycles = await whoop_client.get_cycle_data(access_token, start_str, end_str)
        if cycles:
            print(json.dumps(cycles[0], indent=2))
        else:
            print("No cycle data found.")
        all_data["cycles"] = cycles
    except Exception as e:
        print(f"Error fetching cycles: {e}")
        all_data["cycles_error"] = str(e)

    # Fetch Sleep
    print(f"\n--- Sleep (Latest) ---")
    try:
        sleep = await whoop_client.get_sleep_data(access_token, start_str, end_str)
        if sleep:
            print(json.dumps(sleep[0], indent=2))
        else:
            print("No sleep data found.")
        all_data["sleep"] = sleep
    except Exception as e:
        print(f"Error fetching sleep: {e}")
        all_data["sleep_error"] = str(e)

    # Fetch Recovery
    print(f"\n--- Recovery (Latest) ---")
    try:
        recovery = await whoop_client.get_recovery_data(access_token, start_str, end_str)
        if recovery:
            print(json.dumps(recovery[0], indent=2))
        else:
            print("No recovery data found.")
        all_data["recovery"] = recovery
    except Exception as e:
        print(f"Error fetching recovery: {e}")
        all_data["recovery_error"] = str(e)

    # Fetch Workouts
    print(f"\n--- Workouts (Latest) ---")
    try:
        workouts = await whoop_client.get_workout_data(access_token, start_str, end_str)
        if workouts:
            print(json.dumps(workouts[0], indent=2))
        else:
            print("No workout data found.")
        all_data["workouts"] = workouts
    except Exception as e:
        print(f"Error fetching workouts: {e}")
        all_data["workouts_error"] = str(e)

    # Save to file
    output_file = "whoop_data.json"
    with open(output_file, "w") as f:
        json.dump(all_data, f, indent=2)
    print(f"\n✅ All data saved to {output_file}")

if __name__ == "__main__":
    asyncio.run(main())
