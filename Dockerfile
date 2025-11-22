# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
# Set env vars for build if needed
ENV NEXT_PUBLIC_API_URL=/api
RUN npm run build

# Stage 2: Build Backend & Final Image
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for ML libraries
RUN apt-get update && apt-get install -y \
    libgomp1 \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
# Uncomment ML libs for full deployment
RUN sed -i 's/# xgboost/xgboost/g' requirements.txt && \
    sed -i 's/# scikit-learn/scikit-learn/g' requirements.txt && \
    sed -i 's/# joblib/joblib/g' requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Code
COPY backend ./backend
COPY api ./api
# Copy other necessary files
COPY vercel.json .

# Copy Frontend Build from Stage 1
COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./.next/static
COPY --from=frontend-builder /app/frontend/public ./public

# Environment variables
ENV PORT=3000
ENV HOST=0.0.0.0
ENV API_URL=http://localhost:8000
ENV PYTHONPATH=/app/backend

# Install a process manager to run both
RUN pip install supervisor

# Create supervisor config
RUN echo "[supervisord]\nnodaemon=true\nlogfile=/dev/null\npidfile=/tmp/supervisord.pid\n\n[program:backend]\ncommand=uvicorn app.main:app --host 0.0.0.0 --port 8000\nstdout_logfile=/dev/stdout\nstdout_logfile_maxbytes=0\nstderr_logfile=/dev/stderr\nstderr_logfile_maxbytes=0\n\n[program:frontend]\ncommand=node server.js\nstdout_logfile=/dev/stdout\nstdout_logfile_maxbytes=0\nstderr_logfile=/dev/stderr\nstderr_logfile_maxbytes=0\n" > supervisord.conf

EXPOSE 3000

CMD ["supervisord", "-c", "supervisord.conf"]
