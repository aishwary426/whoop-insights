# Render Deployment Guide

## Issues Fixed

Your app was getting 500 errors because:
1. **Missing PostgreSQL driver** - `psycopg2-binary` was not in requirements.txt
2. **Backend not starting** - The FastAPI backend was crashing on startup
3. **Connection refused errors** - Frontend couldn't connect to backend at port 8000

## Required Environment Variables on Render

You MUST set these environment variables in your Render dashboard:

### Critical Variables:
```bash
# Database - Get this from your Supabase project settings
DATABASE_URL=postgresql://user:password@host:5432/database

# Render Platform Detection
RENDER=true

# API Configuration
DEBUG=false
LOG_LEVEL=INFO
SECRET_KEY=your-secure-random-key-here

# Supabase (for frontend - set as build args too!)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### How to Get Supabase DATABASE_URL:
1. Go to your Supabase project dashboard
2. Click on "Project Settings" (gear icon)
3. Go to "Database" section
4. Look for "Connection String" > "URI"
5. Copy the connection string (it starts with `postgresql://`)
6. Replace `[YOUR-PASSWORD]` with your actual database password

Example:
```
postgresql://postgres.xyz123:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

## Deployment Steps

### 1. Set Environment Variables in Render Dashboard

**Critical**: You must set environment variables in TWO places:

#### A. Regular Environment Variables
Go to your Render service → Environment → Add the variables listed above

#### B. Build-Time Environment Variables
For the Supabase variables that Next.js needs during build:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Deploy

After setting environment variables, trigger a new deployment:
- Push your code to GitHub
- Or manually trigger deploy in Render dashboard

### 3. Monitor Logs

Watch the deployment logs for:

**✓ Success indicators:**
```
============================================================
WHOOP Insights API Starting Up
============================================================
Database URL: postgresql://postgres...
PostgreSQL driver (psycopg2) is available
Created directory: /tmp/data/raw
Backend health check passed!
Frontend health check passed!
Services are ready!
```

**✗ Error indicators:**
- `psycopg2 not installed` → requirements.txt issue (should be fixed now)
- `Could not connect to database` → Check DATABASE_URL is correct
- `ECONNREFUSED ::1:8000` → Backend isn't starting (check earlier logs)
- `Permission denied` → Directory creation issue (should use /tmp now)

## Troubleshooting

### Backend Still Not Starting?

1. **Check Render Logs**: Look for the actual Python error message
2. **Verify DATABASE_URL**: Test it locally:
   ```bash
   # In backend directory
   export DATABASE_URL="your-supabase-url"
   python -c "from app.core_config import get_settings; print(get_settings().database_url)"
   ```

3. **Test PostgreSQL Connection**:
   ```python
   import psycopg2
   conn = psycopg2.connect("your-database-url")
   print("Connected!")
   ```

### Still Getting 500 Errors?

Check these in order:
1. ✓ Environment variables are set in Render dashboard
2. ✓ Build completed successfully
3. ✓ Backend logs show "WHOOP Insights API Starting Up"
4. ✓ Backend logs show "health check passed"
5. ✓ DATABASE_URL is correct and accessible
6. ✓ All dependencies installed (`psycopg2-binary` in logs)

### Common Errors and Fixes

**Error**: `relation "users" does not exist`
**Fix**: Database tables need to be created. The app should auto-create them, but if not:
```bash
# Run migrations or let the app create tables on first request
```

**Error**: `could not connect to server`
**Fix**:
- Check DATABASE_URL is correct
- Verify Supabase database is accessible
- Check if you need to allowlist Render's IP in Supabase

**Error**: `disk quota exceeded`
**Fix**: `/tmp` directory is full (unlikely but possible on long-running instances)

## Testing the Deployment

Once deployed, test:

1. **Health Check**:
   ```bash
   curl https://your-app.onrender.com/api/v1/healthz
   ```
   Should return: `{"status":"ok","version":"1.0.0"}`

2. **Frontend**:
   Visit `https://your-app.onrender.com`
   Should load without errors

3. **Upload**:
   Try uploading a ZIP file through the UI
   Check logs for processing

## File Structure on Render

```
/app/
├── backend/           # FastAPI backend
├── .next/            # Next.js build
├── server.js         # Next.js server
├── public/           # Static assets
├── start-railway.sh  # Startup script
└── /tmp/
    └── data/
        ├── raw/       # Upload directory
        ├── processed/ # Processed data
        └── models/    # ML models
```

## Important Notes

- **Ephemeral Storage**: Files in `/tmp` are wiped on each deployment
- **Database**: Use Supabase PostgreSQL for persistent data
- **Logs**: Check both backend and frontend logs in Render dashboard
- **Build Time**: First build may take 5-10 minutes
- **Health Checks**: Render uses `/health` endpoint with 300s timeout

## Next Steps After Deployment

1. Test all features thoroughly
2. Monitor error logs for any issues
3. Set up Render's auto-deploy from GitHub
4. Configure custom domain (optional)
5. Set up monitoring/alerts

## Support

If issues persist:
1. Check Render logs for the actual error
2. Verify all environment variables are set correctly
3. Test database connection separately
4. Check Supabase dashboard for connection errors
