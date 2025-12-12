# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

# Copy package files
COPY package*.json ./

# Environment variables for faster builds
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true
ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=true


# Remove heavy dev dependencies not needed for production build
RUN node -e "const pkg=require('./package.json'); delete pkg.devDependencies.puppeteer; delete pkg.devDependencies.playwright; require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

# Optimized npm ci - REMOVED node_modules cache mount that was causing issues
RUN --mount=type=cache,id=s/6ef71cb7-63fe-4bdd-a55c-4a6d31fe127a-npm-cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --progress=false --loglevel=error

# Copy source files (order matters for layer caching)
COPY next.config.js tailwind.config.js postcss.config.js tsconfig.json ./
COPY jsconfig.json ./
COPY public ./public
COPY lib ./lib
COPY components ./components
COPY app ./app
COPY scripts ./scripts

# Build arguments
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_API_URL=/api

# Set build-time environment variables
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build with cache mount and memory optimization
RUN --mount=type=cache,id=s/6ef71cb7-63fe-4bdd-a55c-4a6d31fe127a-nextjs-cache,target=/app/frontend/.next/cache \
    NODE_ENV=production NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Stage 2: Runtime
FROM python:3.11-slim

WORKDIR /app

# Install uv for faster Python package installation
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Install Python dependencies with uv cache
COPY requirements.txt .
RUN --mount=type=cache,id=s/6ef71cb7-63fe-4bdd-a55c-4a6d31fe127a-uv-cache,target=/root/.cache/uv \
    uv pip install --system -r requirements.txt

# Install Node.js 20 (required for frontend)
RUN apt-get update && apt-get install -y curl gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy backend code
COPY backend ./backend
COPY api ./api
COPY vercel.json .

# Copy frontend build artifacts from stage 1
COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./.next/static
COPY --from=frontend-builder /app/frontend/public ./public

# Runtime environment variables
ENV HOST=0.0.0.0
ENV API_URL=http://127.0.0.1:8000
ENV PYTHONPATH=/app/backend
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy and prepare startup script
# Copy and prepare startup script
COPY start-railway.sh /app/start-railway.sh
RUN chmod +x /app/start-railway.sh

EXPOSE 3000

CMD ["/app/start-railway.sh"]