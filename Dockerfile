# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install dependencies
COPY package*.json ./
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true
RUN --mount=type=cache,id=s/6ef71cb7-63fe-4bdd-a55c-4a6d31fe127a-npm,target=/root/.npm npm ci

# Copy source and build
COPY next.config.js tailwind.config.js postcss.config.js tsconfig.json jsconfig.json next-env.d.ts ./
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY public ./public
COPY scripts ./scripts

# Build arguments for Supabase (passed from Render environment)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_API_URL=/api

# Set as environment variables for the build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Mount .next/cache for faster subsequent builds
RUN --mount=type=cache,id=s/6ef71cb7-63fe-4bdd-a55c-4a6d31fe127a-nextjs,target=/app/frontend/.next/cache npm run build

# Stage 2: Build Backend & Final Image
FROM python:3.11-slim

WORKDIR /app

# Install uv for faster pip installation
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Install Python dependencies needed for the backend and API
COPY requirements.txt .
# Use uv to install dependencies (much faster than pip)
RUN --mount=type=cache,id=s/6ef71cb7-63fe-4bdd-a55c-4a6d31fe127a-uv,target=/root/.cache/uv \
    uv pip install --system -r requirements.txt

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
# Copy startup script
COPY start-prod.sh /app/start-prod.sh
RUN chmod +x /app/start-prod.sh

# Expose port (Railway will provide PORT env var, default to 3000)
EXPOSE 3000

# Use startup script that handles PORT at runtime
CMD ["/app/start-prod.sh"]
