# Upload 500 Error - Debugging Guide

## Changes Made

1. **Improved Error Messages**: Backend now returns detailed error messages instead of generic "Internal Server Error"
2. **Better Logging**: Added logging at each step of the upload process
3. **Database Connection Test**: Added a test before ingestion to catch database issues early
4. **Render Detection**: Improved detection of Render environment for proper /tmp directory usage

## How to Debug

### 1. Check Render Logs
Go to your Render dashboard → Service → Logs and look for:
- `[upload_id]` entries showing where the process fails
- Database connection errors
- File system permission errors
- Any exception tracebacks

### 2. Common Issues

#### Issue: Database Connection Failed
**Symptoms**: Error mentions "Database connection failed" or SQLite errors
**Solution**: 
- Check if `/tmp/whoop.db` is writable
- Verify DATABASE_URL environment variable
- On Render, SQLite should use `/tmp/whoop.db`

#### Issue: File System Permission Error
**Symptoms**: Error mentions "permission" or "Permission denied"
**Solution**:
- Ensure `/tmp/data/raw` directory is writable
- Check Render service has write permissions to /tmp

#### Issue: Timeout
**Symptoms**: Request times out after 30 seconds
**Solution**:
- Render free tier has 30s timeout
- Upgrade to paid plan or optimize processing

#### Issue: Missing Dependencies
**Symptoms**: Import errors in logs
**Solution**:
- Check `requirements.txt` includes all needed packages
- Verify packages are installed in Render environment

### 3. Test the Endpoint

Try accessing the health check:
```
GET https://your-render-url.com/healthz
```

Should return: `{"status": "ok", "version": "1.0.0"}`

### 4. Check Environment Variables

In Render dashboard, verify these are set:
- `RENDER=true` (or `RENDER_SERVICE_NAME` should be auto-set)
- `DATABASE_URL` (if using PostgreSQL)
- `DEBUG=True` (for detailed error messages)

### 5. Next Steps

After deploying these changes:
1. Try uploading again
2. Check the error message - it should now be more specific
3. Check Render logs for the detailed error
4. Share the specific error message for further debugging

## Expected Error Messages

The new error handling will show messages like:
- `"Database connection failed: [specific error]"`
- `"Failed to save uploaded file: [specific error]"`
- `"Ingestion failed: [specific error]"`
- `"Unexpected error (ErrorType): [specific error]"`

These will help identify the exact issue.






















