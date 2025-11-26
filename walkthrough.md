# Render Deployment Optimization

## Goal
Significantly reduce the build and deployment time on Render.

## Changes Implemented

### 1. Faster Python Dependency Installation
**Change**: Replaced `pip` with `uv` (an extremely fast Python package installer).
**Impact**: `uv` is 10-100x faster than `pip` at resolving and installing dependencies. This will drastically reduce the time spent in the "Install Python dependencies" step.

**Code Change in Dockerfile**:
```dockerfile
# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Use uv instead of pip
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system -r requirements.txt
```

### 2. Next.js Build Caching
**Change**: Added a cache mount for the `.next/cache` directory.
**Impact**: Subsequent builds will reuse the cache from previous builds, meaning Next.js only needs to rebuild pages that have changed. This can reduce frontend build time by 50-80% for minor updates.

**Code Change in Dockerfile**:
```dockerfile
# Mount .next/cache
RUN --mount=type=cache,target=/app/frontend/.next/cache npm run build
```

## Verification
The `Dockerfile` has been updated. The next push to the `main` branch will trigger a deployment on Render that uses these new optimizations. The first build might take the same amount of time (to populate the cache), but subsequent builds should be much faster.
