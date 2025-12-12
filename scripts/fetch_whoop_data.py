import asyncio
import os
import sys
import json
import argparse
from datetime import datetime, timedelta

import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.whoop_client import whoop_client

def print_section_header(title):
    """Print a formatted section header"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)

def print_summary(data_type, data_list):
    """Print summary statistics for a list of records"""
    if not data_list:
        print(f"No {data_type} records found.")
        return
    
    print(f"\n📊 Summary: Found {len(data_list)} {data_type} record(s)")
    
    # Try to extract date range if records have date fields
    dates = []
    for record in data_list:
        # Check common date fields
        for date_field in ['start', 'end', 'created_at', 'updated_at']:
            if date_field in record and record[date_field]:
                try:
                    dt = datetime.fromisoformat(record[date_field].replace("Z", "+00:00"))
                    dates.append(dt)
                    break
                except:
                    pass
    
    if dates:
        dates.sort()
        print(f"   Date range: {dates[0].strftime('%Y-%m-%d %H:%M:%S')} to {dates[-1].strftime('%Y-%m-%d %H:%M:%S')}")

async def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Fetch data from Whoop API')
    parser.add_argument('--token', type=str, help='Whoop access token')
    parser.add_argument('--code', type=str, help='Authorization code to exchange for token')
    parser.add_argument('--days', type=int, default=30, help='Number of days to fetch (default: 30)')
    args = parser.parse_args()
    
    # Check for token in command line args, then env
    access_token = args.token or os.getenv("WHOOP_ACCESS_TOKEN")
    
    if not access_token:
        if args.code:
            # Exchange code for token
            print("Exchanging authorization code for token...")
            try:
                token_data = await whoop_client.get_access_token(args.code)
                access_token = token_data["access_token"]
                print(f"✅ Access Token obtained: {access_token[:20]}...")
            except Exception as e:
                print(f"❌ Error exchanging code: {e}")
                return
        else:
            print("No access token found in environment or command line arguments.")
            print("\nTo get an access token:")
            print("1. Set WHOOP_ACCESS_TOKEN environment variable, OR")
            print("2. Use --token argument, OR")
            print("3. Use --code argument with an authorization code")
            print("\nTo get an authorization code:")
            auth_url = whoop_client.get_authorization_url()
            print(f"\nVisit this URL to authorize:\n{auth_url}\n")
            print("After authorization, you'll be redirected to a callback URL.")
            print("Extract the 'code' parameter from that URL and use it with --code")
            return

    print("\n🚀 Fetching data from Whoop API...")
    
    # Collect all data
    all_data = {}

    # Fetch Profile
    print_section_header("PROFILE")
    try:
        profile = await whoop_client.get_profile(access_token)
        print(json.dumps(profile, indent=2))
        all_data["profile"] = profile
        print("\n✅ Profile fetched successfully")
    except Exception as e:
        print(f"❌ Error fetching profile: {e}")
        all_data["profile_error"] = str(e)

    # Fetch Body Measurements
    print_section_header("BODY MEASUREMENTS")
    try:
        body = await whoop_client.get_body_measurements(access_token)
        print(json.dumps(body, indent=2))
        all_data["body_measurements"] = body
        print("\n✅ Body measurements fetched successfully")
    except Exception as e:
        print(f"❌ Error fetching body measurements: {e}")
        all_data["body_measurements_error"] = str(e)

    # Dates - fetch last N days (default 30, configurable via --days)
    end_date = datetime.utcnow() - timedelta(minutes=1)  # Small buffer for clock skew
    start_date = end_date - timedelta(days=args.days)
    start_date = start_date.replace(microsecond=0)
    end_date = end_date.replace(microsecond=0)
    start_str = start_date.isoformat() + "Z"
    end_str = end_date.isoformat() + "Z"
    
    print(f"\n📅 Fetching data from {start_date.date()} to {end_date.date()} (UTC)")

    # Fetch Cycles
    print_section_header("CYCLES")
    try:
        cycles = await whoop_client.get_cycle_data(access_token, start_str, end_str)
        print_summary("cycle", cycles)
        if cycles:
            print(f"\n📋 All {len(cycles)} cycle record(s):\n")
            for i, cycle in enumerate(cycles, 1):
                print(f"\n--- Cycle {i}/{len(cycles)} ---")
                print(json.dumps(cycle, indent=2))
        else:
            print("No cycle data found.")
        all_data["cycles"] = cycles
        print(f"\n✅ Cycles fetched successfully")
    except Exception as e:
        print(f"❌ Error fetching cycles: {e}")
        all_data["cycles_error"] = str(e)

    # Fetch Sleep
    print_section_header("SLEEP")
    try:
        sleep = await whoop_client.get_sleep_data(access_token, start_str, end_str)
        print_summary("sleep", sleep)
        if sleep:
            print(f"\n📋 All {len(sleep)} sleep record(s):\n")
            for i, sleep_record in enumerate(sleep, 1):
                print(f"\n--- Sleep Record {i}/{len(sleep)} ---")
                print(json.dumps(sleep_record, indent=2))
        else:
            print("No sleep data found.")
        all_data["sleep"] = sleep
        print(f"\n✅ Sleep data fetched successfully")
    except Exception as e:
        print(f"❌ Error fetching sleep: {e}")
        all_data["sleep_error"] = str(e)

    # Fetch Recovery
    print_section_header("RECOVERY")
    try:
        recovery = await whoop_client.get_recovery_data(access_token, start_str, end_str)
        print_summary("recovery", recovery)
        if recovery:
            print(f"\n📋 All {len(recovery)} recovery record(s):\n")
            for i, recovery_record in enumerate(recovery, 1):
                print(f"\n--- Recovery Record {i}/{len(recovery)} ---")
                print(json.dumps(recovery_record, indent=2))
        else:
            print("No recovery data found.")
        all_data["recovery"] = recovery
        print(f"\n✅ Recovery data fetched successfully")
    except Exception as e:
        print(f"❌ Error fetching recovery: {e}")
        all_data["recovery_error"] = str(e)

    # Fetch Workouts
    print_section_header("WORKOUTS")
    try:
        workouts = await whoop_client.get_workout_data(access_token, start_str, end_str)
        print_summary("workout", workouts)
        if workouts:
            print(f"\n📋 All {len(workouts)} workout record(s):\n")
            for i, workout in enumerate(workouts, 1):
                print(f"\n--- Workout {i}/{len(workouts)} ---")
                print(json.dumps(workout, indent=2))
        else:
            print("No workout data found.")
        all_data["workouts"] = workouts
        print(f"\n✅ Workouts fetched successfully")
    except Exception as e:
        print(f"❌ Error fetching workouts: {e}")
        all_data["workouts_error"] = str(e)

    # Final Summary
    print_section_header("FINAL SUMMARY")
    print(f"✅ Profile: {'✓' if 'profile' in all_data else '✗'}")
    print(f"✅ Body Measurements: {'✓' if 'body_measurements' in all_data else '✗'}")
    print(f"✅ Cycles: {len(all_data.get('cycles', []))} records")
    print(f"✅ Sleep: {len(all_data.get('sleep', []))} records")
    print(f"✅ Recovery: {len(all_data.get('recovery', []))} records")
    print(f"✅ Workouts: {len(all_data.get('workouts', []))} records")

    # Save to file
    output_file = "whoop_data.json"
    with open(output_file, "w") as f:
        json.dump(all_data, f, indent=2)
    print(f"\n💾 All data saved to {output_file}")
    print("\n" + "=" * 80)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(1)
