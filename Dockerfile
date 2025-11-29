# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

# Copy package files
COPY package*.json ./

# Skip unnecessary downloads and use faster npm install
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true
ENV NEXT_TELEMETRY_DISABLED=1

# Use npm ci with specific optimizations for Railway
# Added Railway Service ID prefix to cache ID
RUN --mount=type=cache,id=s/6ef71cb7-63fe-4bdd-a55c-4a6d31fe127a-npm-cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --progress=false

# Copy source files (order matters for layer caching)
COPY next.config.js tailwind.config.js postcss.config.js tsconfig.json jsconfig.json next-env.d.ts ./
COPY public ./public
COPY lib ./lib
COPY components ./components
COPY app ./app
COPY scripts ./scripts

# Build arguments
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_API_URL=/api

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_ENV=production

# Build with cache mount
# Added Railway Service ID prefix to cache ID
RUN --mount=type=cache,id=s/6ef71cb7-63fe-4bdd-a55c-4a6d31fe127a-nextjs-cache,target=/app/frontend/.next/cache \
    npm run build

# Stage 2: Runtime
FROM python:3.11-slim

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Install Python dependencies with uv cache
COPY requirements.txt .
# Added Railway Service ID prefix to cache ID
RUN --mount=type=cache,id=s/6ef71cb7-63fe-4bdd-a55c-4a6d31fe127a-uv-cache,target=/root/.cache/uv \
    uv pip install --system --no-cache -r requirements.txt

# Copy backend code
COPY backend ./backend
COPY api ./api
COPY vercel.json .

# Copy frontend build artifacts
COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./.next/static
COPY --from=frontend-builder /app/frontend/public ./public

# Environment variables
ENV HOST=0.0.0.0
ENV API_URL=http://127.0.0.1:8000
ENV PYTHONPATH=/app/backend
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy and prepare startup script
COPY start-prod.sh /app/start-prod.sh
RUN chmod +x /app/start-prod.sh

EXPOSE 3000

CMD ["/app/start-prod.sh"]
