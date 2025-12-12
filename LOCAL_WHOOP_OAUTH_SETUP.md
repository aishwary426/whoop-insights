# Whoop OAuth Setup for Local Development

## Problem
When running locally, clicking "Connect with Whoop" shows an error:
```
Error: invalid_request
Description: The request is missing a required parameter...
Hint: The "redirect_uri" parameter does not match any of the OAuth 2.0 Client's pre-registered redirect urls.
```

This happens because the `redirect_uri` used in the OAuth request doesn't match what's registered in your Whoop OAuth application.

## Quick Fix

### Step 1: Create/Update `.env` file

Create a `.env` file in the **root directory** of your project (same level as `package.json`) with:

```bash
# Whoop OAuth Configuration
WHOOP_CLIENT_ID=your_client_id_here
WHOOP_CLIENT_SECRET=your_client_secret_here
WHOOP_REDIRECT_URI=http://localhost:8000/api/v1/whoop/callback
```

**Important:** 
- The redirect URI must be exactly: `http://localhost:8000/api/v1/whoop/callback`
- No trailing slashes
- Use `http://` (not `https://`) for local development
- Port 8000 is the default backend port (as defined in `start-backend.sh`)

### Step 2: Register Redirect URI in Whoop Developer Portal

1. Go to [Whoop Developer Portal](https://developer.whoop.com/)
2. Log in to your developer account
3. Navigate to your OAuth application
4. Find the **Redirect URIs** or **Allowed Redirect URIs** section
5. Add your local callback URL:
   ```
   http://localhost:8000/api/v1/whoop/callback
   ```
6. **Save the changes**

### Step 3: Restart Your Backend

After setting the environment variable, restart your backend server:

```bash
# Stop the current backend (Ctrl+C)
# Then restart it
./start-backend.sh
# or
cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000
```

### Step 4: Verify

1. Check the backend logs when it starts - you should see:
   ```
   DEBUG: Initialized WhoopClient with redirect_uri: http://localhost:8000/api/v1/whoop/callback
   ```

2. Try clicking "Connect with Whoop" again
3. You should be redirected to Whoop's authorization page

## Troubleshooting

### Still getting the error?

1. **Check your `.env` file location:**
   - The `.env` file should be in the **root directory** (where `package.json` is)
   - Not in the `backend/` directory
   - The backend loads it via `dotenv` which looks for it in the project root

2. **Verify the exact redirect URI:**
   - Check your backend logs when it starts
   - Look for: `DEBUG: Initialized WhoopClient with redirect_uri: ...`
   - Make sure it matches exactly what's in Whoop (including `http://` vs `https://`)

3. **Check Whoop OAuth settings:**
   - The redirect URI in Whoop must match **exactly**
   - No trailing slashes
   - Must use `http://` for local (not `https://`)
   - Case-sensitive

4. **Verify environment variables are loaded:**
   ```bash
   # In your backend directory, check if variables are loaded
   cd backend
   source venv/bin/activate
   python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('WHOOP_REDIRECT_URI:', os.getenv('WHOOP_REDIRECT_URI'))"
   ```

5. **Check the port:**
   - Make sure your backend is running on port 8000
   - Check `start-backend.sh` or your uvicorn command
   - If you're using a different port, update both `.env` and Whoop settings

### Using a Different Port?

If your backend runs on a different port (e.g., 8001), update:

1. **`.env` file:**
   ```bash
   WHOOP_REDIRECT_URI=http://localhost:8001/api/v1/whoop/callback
   ```

2. **Whoop OAuth App:** Add the new URL to redirect URIs

3. **Restart backend**

## Example `.env` File

```bash
# Database (optional - defaults to SQLite)
DATABASE_URL=sqlite:///./backend/whoop.db

# Whoop OAuth (REQUIRED for OAuth to work)
WHOOP_CLIENT_ID=your_actual_client_id
WHOOP_CLIENT_SECRET=your_actual_client_secret
WHOOP_REDIRECT_URI=http://localhost:8000/api/v1/whoop/callback

# Other optional settings
DEBUG=True
SECRET_KEY=dev-secret-key-change-in-production
```

## Notes

- The callback endpoint is at `/api/v1/whoop/callback` (defined in `backend/app/api/v1/endpoints/whoop.py`)
- The redirect URI must point to your **backend** URL, not your frontend URL
- Whoop will redirect users back to this URL after they authorize your application
- The callback endpoint handles the OAuth code exchange and data synchronization
- For production, use `https://` and your production domain (see `WHOOP_OAUTH_RAILWAY_SETUP.md`)





