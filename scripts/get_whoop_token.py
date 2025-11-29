#!/usr/bin/env python3
"""
Helper script to get a Whoop access token via OAuth.
This script will guide you through the OAuth flow and save the token.
"""
import asyncio
import os
import sys
import json
from urllib.parse import urlparse, parse_qs

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.services.whoop_client import whoop_client

async def main():
    print("=" * 80)
    print("  Whoop OAuth Token Helper")
    print("=" * 80)
    print("\nThis script will help you get a Whoop access token.\n")
    
    # Generate authorization URL
    auth_url = whoop_client.get_authorization_url()
    
    print("Step 1: Visit this URL in your browser:")
    print(f"\n{auth_url}\n")
    print("=" * 80)
    
    # Wait for user to paste the callback URL
    print("\nStep 2: After authorizing, you'll be redirected to a callback URL.")
    print("The URL will look like:")
    print("http://localhost:8000/api/v1/whoop/callback?code=XXXXX&state=...")
    print("\nPlease paste the FULL callback URL here:")
    
    callback_url = input("> ").strip()
    
    # Extract code from URL
    try:
        parsed = urlparse(callback_url)
        params = parse_qs(parsed.query)
        code = params.get('code', [None])[0]
        
        if not code:
            print("\n❌ Error: Could not find 'code' parameter in the URL.")
            print("Please make sure you paste the complete callback URL.")
            return
        
        print(f"\n✅ Found authorization code: {code[:20]}...")
        print("\nStep 3: Exchanging code for access token...")
        
        # Exchange code for token
        token_data = await whoop_client.get_access_token(code)
        access_token = token_data["access_token"]
        refresh_token = token_data.get("refresh_token")
        
        print(f"\n✅ Success! Access token obtained: {access_token[:20]}...")
        
        # Save token to environment file or print it
        print("\n" + "=" * 80)
        print("  Access Token (save this for future use):")
        print("=" * 80)
        print(f"\nWHOOP_ACCESS_TOKEN={access_token}\n")
        
        if refresh_token:
            print(f"WHOOP_REFRESH_TOKEN={refresh_token}\n")
        
        print("=" * 80)
        print("\nYou can now use this token with the fetch script:")
        print(f"python scripts/fetch_whoop_data.py --token {access_token}\n")
        
        # Optionally save to .env file
        save = input("Save token to .env file? (y/n): ").strip().lower()
        if save == 'y':
            env_file = os.path.join(os.path.dirname(__file__), '..', '.env')
            with open(env_file, 'a') as f:
                f.write(f"\nWHOOP_ACCESS_TOKEN={access_token}\n")
                if refresh_token:
                    f.write(f"WHOOP_REFRESH_TOKEN={refresh_token}\n")
            print(f"✅ Token saved to {env_file}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(1)

