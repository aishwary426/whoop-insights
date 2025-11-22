# Railway Deployment Guide

## Overview

This application runs both a Next.js frontend and a FastAPI backend using supervisord to manage both processes.

## Architecture

- **Frontend (Next.js)**: Runs on PORT environment variable (provided by Railway, typically 8080)
- **Backend (FastAPI)**: Runs on port 8000 (internal only)
- **Process Manager**: supervisord manages both services

## Health Check Endpoints

Railway uses health checks to verify your application is responding:

- **Frontend Health Check**: `http://your-app.railway.app/health`
- **Alternative Health Check**: `http://your-app.railway.app/healthz`
- **Backend Health Check**: `http://your-app.railway.app/api/v1/healthz` (proxied through frontend)

## Configuration

### Environment Variables

Set these in your Railway project:

```
PORT=8080              # Set by Railway automatically
API_URL=http://localhost:8000  # Backend URL (optional, defaults to this)
```

### Important Files

1. **Dockerfile**: Multi-stage build that creates both frontend and backend
2. **start-railway.sh**: Startup script that configures supervisord with the runtime PORT
3. **next.config.js**: Configures API rewrites to proxy /api/v1/* to the backend

## Troubleshooting

### "Application failed to respond" Error

This usually means:

1. **Health check timeout**: Railway couldn't reach your health endpoint within the timeout period
   - **Solution**: We've configured `railway.json` with:
     - `healthcheckPath: "/health"` - Points to our Next.js health route
     - `healthcheckTimeout: 300` - Gives app 300 seconds to start
   - Railway's default timeout (~10-30s) was too short for our dual-service app

2. **Wrong PORT binding**: Application not listening on the PORT environment variable
   - Solution: Verify supervisord config uses `PORT` env var for frontend

3. **Services not starting**: Backend or frontend failed to start
   - Solution: Check Railway logs for startup errors

**Key Fix Applied**: The `railway.json` configuration explicitly tells Railway:
- Which endpoint to check (`/health`)
- How long to wait (300 seconds)
- To use our custom startup script

This prevents premature timeout failures during deployment.

### Common Issues

#### 1. Backend not reachable from frontend

**Symptoms**: Frontend loads but API calls fail

**Solution**:
- Verify `next.config.js` rewrites are configured correctly
- Check that backend is running on port 8000
- Use `http://localhost:8000` (not 127.0.0.1) in Railway environment

#### 2. Supervisord warnings about running as root

**Symptoms**: "CRIT Supervisor is running as root" warnings in logs

**Solution**: Already handled - we set `user=root` in supervisord.conf

#### 3. Database initialization errors

**Symptoms**: SQLAlchemy errors during startup

**Solution**:
- Database tables are created automatically on first run
- Check that `/app/backend/data` directory is writable
- SQLite database is stored locally (ephemeral in Railway)

## Deployment Steps

1. **Connect Repository**: Link your GitHub repo to Railway
2. **Configure Environment**: Set any custom environment variables
3. **Deploy**: Railway will automatically:
   - Build the Docker image
   - Run the container
   - Expose it on the public domain
4. **Verify**: Access your health endpoint to verify deployment

## Monitoring

Check these in Railway dashboard:

- **Deployment Logs**: View startup process and any errors
- **Metrics**: Monitor CPU, memory, and network usage
- **Health Checks**: Verify health endpoint is responding

## Architecture Diagram

```
Railway (Port 8080)
    │
    ├─> Next.js Frontend (PORT=8080)
    │     ├─> /health → Health check endpoint
    │     ├─> /healthz → Alternative health check
    │     └─> /api/v1/* → Proxied to backend
    │
    └─> FastAPI Backend (Port 8000)
          └─> /api/v1/* → API endpoints
          └─> /healthz → Backend health check
```

## Notes

- Both services run in a single container managed by supervisord
- Frontend proxies API requests to backend via next.config.js rewrites
- Health checks should respond within 10 seconds
- Port 8080 is exposed externally, port 8000 is internal only
