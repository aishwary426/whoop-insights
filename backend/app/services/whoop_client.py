import httpx
from urllib.parse import urlencode
from typing import Dict, Any, Optional
import os
import logging
import asyncio
from datetime import datetime, timedelta
from collections import deque
from dotenv import load_dotenv

# Explicitly load .env file to ensure variables are picked up even if server isn't restarted
load_dotenv()

logger = logging.getLogger(__name__)

# Whoop API Rate Limits
# 100 requests per minute
# 10,000 requests per day
RATE_LIMIT_PER_MINUTE = 100
RATE_LIMIT_PER_DAY = 10000
MIN_DELAY_BETWEEN_REQUESTS = 0.6  # 600ms = ~100 requests per minute with safety margin

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
        logger.info(f"DEBUG: Initialized WhoopClient with redirect_uri: {self.redirect_uri}")
        
        # Rate limiting tracking
        # Track request timestamps for per-minute limit
        self.request_timestamps = deque()
        # Track daily request count
        self.daily_request_count = 0
        self.daily_reset_time = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        # Lock for thread-safe rate limiting (will be initialized on first use)
        self._rate_limit_lock = None
    
    def get_redirect_uri(self, request=None):
        """
        Get redirect URI, with fallback to auto-detect from request if not set in env.
        """
        if self.redirect_uri:
            return self.redirect_uri
        
        # Fallback: try to auto-detect from request
        if request:
            try:
                # Build callback URL from request
                base_url = str(request.base_url).rstrip('/')
                callback_path = "/api/v1/whoop/callback"
                detected_uri = f"{base_url}{callback_path}"
                logger.info(f"DEBUG: Auto-detected redirect_uri from request: {detected_uri}")
                return detected_uri
            except Exception as e:
                logger.warning(f"Failed to auto-detect redirect_uri: {e}")
        
        # Last resort: log error
        logger.error("WHOOP_REDIRECT_URI not set and could not auto-detect from request")
        raise ValueError(
            "WHOOP_REDIRECT_URI environment variable is not set. "
            "Please set it to your backend URL + /api/v1/whoop/callback (e.g., "
            "https://your-app.up.railway.app/api/v1/whoop/callback)"
        )

    def get_authorization_url(self, state: str = "random_state_string", request=None) -> str:
        redirect_uri = self.get_redirect_uri(request)
        params = {
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "offline read:profile read:recovery read:cycles read:sleep read:workout",
            "state": state
        }
        url = f"{self.AUTH_URL}?{urlencode(params)}"
        logger.info(f"DEBUG: Generated Whoop Auth URL: {url}")
        return url

    async def get_access_token(self, code: str, request=None) -> Dict[str, Any]:
        redirect_uri = self.get_redirect_uri(request)
        async with httpx.AsyncClient() as client:
            data = {
                "grant_type": "authorization_code",
                "code": code,
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "redirect_uri": redirect_uri,
            }
            logger.info(f"DEBUG: Exchanging code for token. Client ID: {self.client_id}, Redirect URI: {redirect_uri}")
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

    async def _wait_for_rate_limit(self):
        """
        Wait if necessary to respect rate limits.
        Ensures we don't exceed 100 requests per minute.
        """
        # Initialize lock on first use (can't do this in __init__ for async code)
        if self._rate_limit_lock is None:
            self._rate_limit_lock = asyncio.Lock()
        
        async with self._rate_limit_lock:
            now = datetime.utcnow()
            
            # Reset daily counter if needed
            if now >= self.daily_reset_time:
                self.daily_request_count = 0
                self.daily_reset_time = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
                logger.info(f"DEBUG: Daily rate limit reset. New limit: {RATE_LIMIT_PER_DAY}")
            
            # Check daily limit
            if self.daily_request_count >= RATE_LIMIT_PER_DAY:
                wait_seconds = (self.daily_reset_time - now).total_seconds()
                if wait_seconds > 0:
                    logger.warning(f"DEBUG: Daily rate limit reached ({RATE_LIMIT_PER_DAY}). Waiting {wait_seconds:.1f} seconds until reset.")
                    await asyncio.sleep(wait_seconds + 1)
                    # Reset after waiting
                    self.daily_request_count = 0
                    self.daily_reset_time = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
            
            # Remove timestamps older than 1 minute
            one_minute_ago = now - timedelta(minutes=1)
            while self.request_timestamps and self.request_timestamps[0] < one_minute_ago:
                self.request_timestamps.popleft()
            
            # Check per-minute limit
            if len(self.request_timestamps) >= RATE_LIMIT_PER_MINUTE:
                # Calculate wait time until oldest request is 1 minute old
                oldest_request = self.request_timestamps[0]
                wait_until = oldest_request + timedelta(minutes=1)
                wait_seconds = (wait_until - now).total_seconds()
                if wait_seconds > 0:
                    logger.info(f"DEBUG: Rate limit approaching ({len(self.request_timestamps)}/{RATE_LIMIT_PER_MINUTE} per minute). Waiting {wait_seconds:.1f} seconds.")
                    await asyncio.sleep(wait_seconds + 0.1)  # Small buffer
            
            # Add current request timestamp
            self.request_timestamps.append(now)
            self.daily_request_count += 1
            
            # Always wait minimum delay between requests to be safe
            await asyncio.sleep(MIN_DELAY_BETWEEN_REQUESTS)

    async def _get_paginated(self, access_token: str, endpoint: str, params: Dict[str, Any]) -> list[Dict[str, Any]]:
        all_records = []
        next_token = None
        
        # WHOOP API limit: Maximum 25 records per single call
        MAX_RECORDS = 25
        
        # Ensure we request max limit to minimize calls
        if "limit" not in params:
            params["limit"] = 25

        page_count = 0
        while True:
            # Stop if we've reached the maximum records limit
            if len(all_records) >= MAX_RECORDS:
                logger.info(f"DEBUG: Reached maximum records limit ({MAX_RECORDS}). Stopping pagination.")
                # Return only the first 25 records
                return all_records[:MAX_RECORDS]
            
            page_count += 1
            current_params = params.copy()
            if next_token:
                current_params["nextToken"] = next_token
            
            # Adjust limit for this page to not exceed MAX_RECORDS total
            remaining = MAX_RECORDS - len(all_records)
            if remaining < current_params.get("limit", 25):
                current_params["limit"] = remaining
            
            logger.info(f"DEBUG: Fetching page {page_count} for {endpoint} with params: {current_params}")
            
            # Wait for rate limit before making request
            await self._wait_for_rate_limit()
            
            response_data = await self._get_with_retry(access_token, endpoint, current_params)
            
            # Handle case where endpoint might return list directly (unlikely for V2 collections but good safety)
            if isinstance(response_data, list):
                logger.info(f"DEBUG: Page {page_count} returned list of {len(response_data)} records")
                all_records.extend(response_data)
                # Limit to MAX_RECORDS
                if len(all_records) > MAX_RECORDS:
                    all_records = all_records[:MAX_RECORDS]
                break
            
            records = response_data.get("records", [])
            logger.info(f"DEBUG: Page {page_count} returned {len(records)} records")
            all_records.extend(records)
            
            # Limit to MAX_RECORDS if we exceeded it
            if len(all_records) > MAX_RECORDS:
                logger.info(f"DEBUG: Limiting records to {MAX_RECORDS} (had {len(all_records)})")
                all_records = all_records[:MAX_RECORDS]
                break
            
            # Try both camelCase (API standard) and snake_case (just in case)
            next_token = response_data.get("nextToken") or response_data.get("next_token")
            logger.info(f"DEBUG: Next token: {next_token}")
            
            if not next_token:
                logger.info(f"DEBUG: No next token, stopping pagination after {page_count} pages. Total records: {len(all_records)}")
                break
                
        return all_records

    async def _get_with_retry(self, access_token: str, endpoint: str, params: Optional[Dict[str, Any]] = None, max_retries: int = 3) -> Dict[str, Any]:
        """
        Make GET request with retry logic for rate limiting (429 errors).
        """
        headers = {"Authorization": f"Bearer {access_token}"}
        # Mask token for logging
        masked_token = access_token[:5] + "..." + access_token[-5:] if len(access_token) > 10 else "***"
        
        for attempt in range(max_retries):
            try:
                logger.info(f"DEBUG: Calling {endpoint} with token {masked_token} (attempt {attempt + 1}/{max_retries})")
                
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.get(f"{self.BASE_URL}{endpoint}", headers=headers, params=params)
                    
                    # Handle rate limiting (429 Too Many Requests)
                    if response.status_code == 429:
                        retry_after = response.headers.get("Retry-After")
                        if retry_after:
                            wait_seconds = int(retry_after)
                        else:
                            # Exponential backoff: 2^attempt seconds
                            wait_seconds = 2 ** attempt
                        
                        if attempt < max_retries - 1:
                            logger.warning(f"DEBUG: Rate limited (429). Waiting {wait_seconds} seconds before retry {attempt + 1}/{max_retries}")
                            await asyncio.sleep(wait_seconds)
                            continue
                        else:
                            logger.error(f"DEBUG: Rate limited (429) after {max_retries} attempts")
                            response.raise_for_status()
                    
                    if response.status_code != 200:
                        logger.info(f"DEBUG: API Error {response.status_code} for {endpoint}: {response.text}")
                    
                    response.raise_for_status()
                    return response.json()
                    
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429 and attempt < max_retries - 1:
                    # Already handled above, but catch here too
                    continue
                raise
            except Exception as e:
                if attempt < max_retries - 1:
                    logger.warning(f"DEBUG: Request failed: {e}. Retrying in {2 ** attempt} seconds...")
                    await asyncio.sleep(2 ** attempt)
                    continue
                raise
        
        # Should not reach here, but just in case
        raise Exception(f"Failed to fetch {endpoint} after {max_retries} attempts")

    async def _get(self, access_token: str, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Make GET request with rate limiting.
        For paginated requests, use _get_paginated which handles rate limits.
        For single requests, wait for rate limit first.
        """
        await self._wait_for_rate_limit()
        return await self._get_with_retry(access_token, endpoint, params)

whoop_client = WhoopClient()
