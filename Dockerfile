# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .

# Build arguments for Supabase (passed from Render environment)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_API_URL=/api

# Set as environment variables for the build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Stage 2: Build Backend & Final Image
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (Node.js for Next.js)
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
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
ENV HOST=0.0.0.0
ENV API_URL=http://127.0.0.1:8000
ENV PYTHONPATH=/app/backend
# PORT will be provided by Railway at runtime

# Install a process manager to run both
RUN pip install supervisor

# Copy startup script
COPY start-prod.sh /app/start-prod.sh
RUN chmod +x /app/start-prod.sh

# Expose port (Railway will provide PORT env var, default to 3000)
EXPOSE 3000

# Use startup script that handles PORT at runtime
CMD ["/app/start-prod.sh"]
