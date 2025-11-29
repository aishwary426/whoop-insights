# Fix Railway Health Check Failure

## Goal

Resolve the "Service Unavailable" error during Railway deployment health checks. The issue was caused by the missing `node` executable in the runtime stage of the Dockerfile, preventing the Next.js frontend server from starting.

## Proposed Changes

### Dockerfile

#### [MODIFY] [Dockerfile](file:///Users/aishwary/Downloads/whoop-insights/Dockerfile)

- Install Node.js 20 in the runtime stage (Stage 2).
- This ensures that `node server.js` can execute successfully in the `start-railway.sh` script.

## Verification Plan

### Automated Tests

- Deploy to Railway and monitor the deployment logs.
- Verify that the health check at `/health` passes (returns 200 OK).
- Verify that both frontend (port 3000) and backend (port 8000) are running.
