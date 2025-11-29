# Render Upload Error Fix

## Issue
Getting "Internal Server Error" when uploading ZIP files on Render.

## Root Causes

### 1. Render Environment Detection
The code wasn't properly detecting Render environment, causing it to use local file paths instead of `/tmp`.

**Fix**: Improved Render detection to check for:
- `RENDER` environment variable
- `RENDER_SERVICE_NAME` 
- `RENDER_SERVICE_ID`

### 2. Request Timeout (Most Likely Issue)
**Render's free tier has a 30-second request timeout limit.** If your upload processing takes longer than 30 seconds, the request will be terminated, resulting in an Internal Server Error.

The upload process includes:
1. File upload
2. ZIP extraction
3. CSV parsing
4. Feature engineering
5. Model training

This can easily exceed 30 seconds for larger files.

## Solutions

### Option 1: Upgrade Render Plan (Recommended)
Upgrade to a paid Render plan which has longer timeout limits (up to 5 minutes on some plans).

### Option 2: Optimize Processing
- Reduce file size by exporting less data from WHOOP
- Optimize the ingestion pipeline to be faster
- Consider making the upload async (upload file first, process in background)

### Option 3: Use Different Platform
Consider using Railway or another platform with longer timeout limits for free tier.

## Changes Made

1. **Improved Render Detection** (`backend/app/core_config.py`):
   - Added `_is_cloud_platform()` function
   - Better detection of Render environment
   - Properly sets `/tmp` directories on cloud platforms

2. **Better Error Handling** (`backend/app/api/v1/endpoints/upload.py`):
   - Added timeout detection and helpful error messages
   - Better logging for debugging
   - More specific error messages for common issues

3. **Environment Variables**:
   - Ensure `RENDER=true` is set in Render dashboard (already in `render.yaml`)

## Testing

After deploying these changes:
1. Check Render logs to see if the timeout is the issue
2. Look for error messages mentioning "30s" or "timeout"
3. Monitor request duration in Render dashboard

## Next Steps

If timeout is confirmed:
1. Consider implementing async processing:
   - Upload file → return immediately
   - Process in background
   - Use webhooks/SSE to notify frontend when complete

2. Or optimize the sync processing to complete within 30 seconds






















