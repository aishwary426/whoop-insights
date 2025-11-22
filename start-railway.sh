#!/bin/bash
# Startup script for Railway deployment

# Don't exit on error - we want backend to start even if frontend has issues
set +e

# Set default PORT if not provided
export PORT=${PORT:-3000}

echo "Starting Railway deployment..."
echo "PORT=${PORT}"

# Check if server.js exists (Next.js standalone build)
SERVER_PATH="/app/server.js"
SERVER_DIR="/app"

if [ ! -f "$SERVER_PATH" ]; then
    echo "Warning: server.js not found in /app, checking alternative locations..."
    if [ -f "/app/.next/standalone/server.js" ]; then
        echo "Found server.js in .next/standalone"
        SERVER_PATH="/app/.next/standalone/server.js"
        SERVER_DIR="/app/.next/standalone"
    else
        echo "Error: server.js not found! Listing /app contents:"
        ls -la /app/ | head -20
        echo "Will attempt to start frontend anyway..."
    fi
fi

# Verify backend directory exists (critical - exit if missing)
if [ ! -d "/app/backend" ]; then
    echo "Error: /app/backend directory not found!"
    exit 1
fi

# Verify backend main.py exists
if [ ! -f "/app/backend/app/main.py" ]; then
    echo "Error: /app/backend/app/main.py not found!"
    exit 1
fi

# Create supervisord config with runtime PORT
{
    cat << EOF
[supervisord]
nodaemon=true
logfile=/dev/stdout
logfile_maxbytes=0
pidfile=/tmp/supervisord.pid
user=root

[program:backend]
command=uvicorn app.main:app --host 0.0.0.0 --port 8000
directory=/app/backend
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stdout
stderr_logfile_maxbytes=0
autorestart=true
startretries=3

EOF

    # Only add frontend program if server.js exists
    if [ -f "$SERVER_PATH" ]; then
        echo "Configuring frontend service..." >&2
        echo "Node version: $(node -v)" >&2
        cat << EOF
[program:frontend]
command=node server.js
directory=${SERVER_DIR}
environment=PORT="${PORT}",HOSTNAME="0.0.0.0",NODE_ENV="production"
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stdout
stderr_logfile_maxbytes=0
autorestart=true
startretries=3

EOF
    else
        echo "# Frontend program skipped - server.js not found"
    fi
} > /app/supervisord.conf

echo "Supervisord config created"

# Start supervisord in background
supervisord -c /app/supervisord.conf &
SUPER_PID=$!

# Wait for services to actually be ready
echo "Waiting for services to be healthy..."
sleep 5

# Check if frontend is responding
MAX_TRIES=30
for i in $(seq 1 $MAX_TRIES); do
    if curl -f -s -o /dev/null "http://0.0.0.0:${PORT}/health"; then
        echo "✓ Frontend health check passed!"
        break
    fi
    echo "Waiting for frontend... ($i/$MAX_TRIES)"
    sleep 2
done

# Check if backend is responding
for i in $(seq 1 $MAX_TRIES); do
    if curl -f -s -o /dev/null "http://0.0.0.0:8000/healthz"; then
        echo "✓ Backend health check passed!"
        break
    fi
    echo "Waiting for backend... ($i/$MAX_TRIES)"
    sleep 2
done

echo "Services are ready! Handing control to supervisord..."
# Wait for supervisord
wait $SUPER_PID

