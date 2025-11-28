import httpx
from urllib.parse import urlencode
from typing import Dict, Any, Optional
import os
import logging
from dotenv import load_dotenv

# Explicitly load .env file to ensure variables are picked up even if server isn't restarted
load_dotenv()

logger = logging.getLogger(__name__)

class WhoopClient:
    BASE_URL = "https://api.prod.whoop.com/developer"
    AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth"
    TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token"

    def __init__(self):
        # Reload env vars to be sure
        load_dotenv()
        self.client_id = os.getenv("WHOOP_CLIENT_ID")
        self.client_secret = os.getenv("WHOOP_CLIENT_SECRET")
        self.redirect_uri = os.getenv("WHOOP_REDIRECT_URI")

    def get_authorization_url(self, state: str = "random_state_string") -> str:
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": "offline read:profile read:recovery read:cycles read:sleep read:workout",
            "state": state
        }
        url = f"{self.AUTH_URL}?{urlencode(params)}"
        logger.info(f"DEBUG: Generated Whoop Auth URL: {url}")
        return url

    async def get_access_token(self, code: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            data = {
                "grant_type": "authorization_code",
                "code": code,
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "redirect_uri": self.redirect_uri,
            }
            logger.info(f"DEBUG: Exchanging code for token. Client ID: {self.client_id}, Redirect URI: {self.redirect_uri}")
            response = await client.post(self.TOKEN_URL, data=data)
            logger.info(f"DEBUG: Token exchange response status: {response.status_code}")
            if response.status_code != 200:
                logger.info(f"DEBUG: Token exchange error body: {response.text}")
            response.raise_for_status()
            token_data = response.json()
            logger.info(f"DEBUG: Token data keys: {token_data.keys()}")
            return token_data

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            data = {
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": self.client_id,
                "client_secret": self.client_secret,
            }
            response = await client.post(self.TOKEN_URL, data=data)
            response.raise_for_status()
            return response.json()

    async def get_profile(self, access_token: str) -> Dict[str, Any]:
        return await self._get(access_token, "/v2/user/profile/basic")

    async def get_body_measurements(self, access_token: str) -> Dict[str, Any]:
        return await self._get(access_token, "/v2/user/measurement/body")

    async def get_cycle_data(self, access_token: str, start: str, end: str) -> list[Dict[str, Any]]:
        # start and end should be ISO 8601 strings
        params = {"start": start, "end": end}
        return await self._get_paginated(access_token, "/v2/cycle", params)

    async def get_sleep_data(self, access_token: str, start: str, end: str) -> list[Dict[str, Any]]:
        params = {"start": start, "end": end}
        return await self._get_paginated(access_token, "/v2/activity/sleep", params)
    
    async def get_recovery_data(self, access_token: str, start: str, end: str) -> list[Dict[str, Any]]:
        params = {"start": start, "end": end}
        return await self._get_paginated(access_token, "/v2/recovery", params)

    async def get_workout_data(self, access_token: str, start: str, end: str) -> list[Dict[str, Any]]:
        params = {"start": start, "end": end}
        return await self._get_paginated(access_token, "/v2/activity/workout", params)

    async def _get_paginated(self, access_token: str, endpoint: str, params: Dict[str, Any]) -> list[Dict[str, Any]]:
        all_records = []
        next_token = None
        
        # Ensure we request max limit to minimize calls
        if "limit" not in params:
            params["limit"] = 25

        while True:
            current_params = params.copy()
            if next_token:
                current_params["nextToken"] = next_token
            
            response_data = await self._get(access_token, endpoint, current_params)
            
            # Handle case where endpoint might return list directly (unlikely for V2 collections but good safety)
            if isinstance(response_data, list):
                all_records.extend(response_data)
                break
            
            records = response_data.get("records", [])
            all_records.extend(records)
            
            next_token = response_data.get("next_token")
            if not next_token:
                break
                
        return all_records

    async def _get(self, access_token: str, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {access_token}"}
        # Mask token for logging
        masked_token = access_token[:5] + "..." + access_token[-5:] if len(access_token) > 10 else "***"
        logger.info(f"DEBUG: Calling {endpoint} with token {masked_token}")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.BASE_URL}{endpoint}", headers=headers, params=params)
            if response.status_code != 200:
                logger.info(f"DEBUG: API Error {response.status_code} for {endpoint}: {response.text}")
            response.raise_for_status()
            return response.json()

whoop_client = WhoopClient()
