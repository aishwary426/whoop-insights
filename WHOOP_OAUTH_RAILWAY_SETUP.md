# Whoop OAuth Setup for Railway Deployment

## Problem
When deploying to Railway, clicking "Connect with Whoop" shows an error:
```
Error: invalid_request
Description: The request is missing a required parameter, includes an invalid parameter value, includes a parameter more than once, or is otherwise malformed
Hint: The "redirect_uri" parameter does not match any of the OAuth 2.0 Client's pre-registered redirect urls.
```

This happens because the `redirect_uri` used in the OAuth request doesn't match what's registered in your Whoop OAuth application.

## Solution

You need to:
1. **Set the `WHOOP_REDIRECT_URI` environment variable in Railway** to your Railway backend URL
2. **Register the same URL in your Whoop OAuth application settings**

### Step 1: Determine Your Redirect URI

Since your frontend at `https://www.data-insights.cloud/` proxies API requests to the backend, the redirect URI should use your frontend domain:

**Production Redirect URI:**
```
https://www.data-insights.cloud/api/v1/whoop/callback
```

**Note:** If your backend is accessible via a separate Railway URL (not proxied through Next.js), use that URL instead. Check your Railway service settings to see if you have a separate backend domain.

### Step 2: Set Environment Variable in Railway

1. In your Railway backend service, go to the **Variables** tab
2. Add or update the `WHOOP_REDIRECT_URI` variable:
   ```
   WHOOP_REDIRECT_URI=https://www.data-insights.cloud/api/v1/whoop/callback
   ```
   **Important:** 
   - Use your production frontend domain if API is proxied through Next.js
   - Or use your Railway backend URL if backend is directly accessible
   - Make sure there are no trailing slashes

3. Make sure you also have these variables set:
   - `WHOOP_CLIENT_ID` - Your Whoop OAuth Client ID
   - `WHOOP_CLIENT_SECRET` - Your Whoop OAuth Client Secret

### Step 3: Register Redirect URI in Whoop Developer Portal

1. Go to [Whoop Developer Portal](https://developer.whoop.com/)
2. Log in to your developer account
3. Navigate to your OAuth application
4. Find the **Redirect URIs** or **Allowed Redirect URIs** section
5. Add your production callback URL:
   ```
   https://www.data-insights.cloud/api/v1/whoop/callback
   ```
   **Important:** 
   - The URL must match **exactly** (including `https://`, no trailing slash)
   - If you have multiple environments, add each one:
     - Production: `https://www.data-insights.cloud/api/v1/whoop/callback`
     - Local dev: `http://localhost:8000/api/v1/whoop/callback` (if testing locally)

6. Save the changes

### Step 4: Verify the Setup

1. Restart your Railway service (to pick up the new environment variable)
2. Try clicking "Connect with Whoop" again
3. You should be redirected to Whoop's authorization page

## Troubleshooting

### Still getting the error?

1. **Check the exact redirect URI being used:**
   - Check your Railway logs to see what redirect URI is being sent
   - Look for log lines like: `DEBUG: Initialized WhoopClient with redirect_uri: ...`
   - Make sure it matches exactly what's in Whoop (including `https://` vs `http://`)

2. **Verify environment variables:**
   - In Railway, go to Variables tab
   - Make sure `WHOOP_REDIRECT_URI` is set correctly
   - Make sure there are no extra spaces or quotes

3. **Check Whoop OAuth settings:**
   - The redirect URI in Whoop must match exactly
   - No trailing slashes
   - Must use `https://` for production (not `http://`)

4. **Restart the service:**
   - After changing environment variables, restart your Railway service

### For Local Development

If you're testing locally, you'll need:
- `WHOOP_REDIRECT_URI=http://localhost:8000/api/v1/whoop/callback`
- Add `http://localhost:8000/api/v1/whoop/callback` to your Whoop OAuth app's redirect URIs

## Example Configuration

**Railway Environment Variables:**
```
WHOOP_CLIENT_ID=your_client_id_here
WHOOP_CLIENT_SECRET=your_client_secret_here
WHOOP_REDIRECT_URI=https://www.data-insights.cloud/api/v1/whoop/callback
```

**Whoop OAuth App Redirect URIs:**
```
https://www.data-insights.cloud/api/v1/whoop/callback
http://localhost:8000/api/v1/whoop/callback
```

## Your Specific Configuration

Based on your production URL `https://www.data-insights.cloud/`:

1. **Set in Railway Variables:**
   ```
   WHOOP_REDIRECT_URI=https://www.data-insights.cloud/api/v1/whoop/callback
   ```

2. **Add to Whoop OAuth App:**
   ```
   https://www.data-insights.cloud/api/v1/whoop/callback
   ```

3. **Restart your Railway service** after setting the environment variable

## Notes

- The callback endpoint is at `/api/v1/whoop/callback` (defined in `backend/app/api/v1/endpoints/whoop.py`)
- The redirect URI must point to your **backend** URL, not your frontend URL
- Whoop will redirect users back to this URL after they authorize your application
- The callback endpoint handles the OAuth code exchange and data synchronization

