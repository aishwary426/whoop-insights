"""
Vercel serverless function entry point.
Location: api/index.py
"""
import os
import sys
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("vercel_entrypoint")

logger.info("=" * 80)
logger.info("DEBUG: Starting Vercel entrypoint")
logger.info(f"DEBUG: CWD: {os.getcwd()}")
logger.info(f"DEBUG: __file__: {__file__}")
logger.info(f"DEBUG: sys.path: {sys.path[:5]}")  # Limit to first 5 for brevity

# Log what files are actually present
logger.info(f"DEBUG: Contents of CWD: {os.listdir(os.getcwd())[:20]}")  # First 20 items
current_file_dir = Path(__file__).resolve().parent
logger.info(f"DEBUG: Contents of current file dir: {os.listdir(current_file_dir)[:20]}")

def _candidate_backend_paths() -> list[Path]:
    """Return possible backend locations within the bundle."""
    current_file = Path(__file__).resolve()
    api_dir = current_file.parent
    project_root = api_dir.parent

    candidates: list[Path] = []

    # Most likely: backend is sibling to api/ in project root
    candidates.append(project_root / "backend")

    # Vercel might bundle everything in /var/task
    candidates.append(Path("/var/task/backend"))
    candidates.append(Path("/var/task/user/backend"))

    # CWD relative
    candidates.append(Path(os.getcwd()) / "backend")

    # Walk up a few levels
    for i, parent in enumerate(current_file.parents):
        if i > 5:  # Don't walk too far up
            break
        candidates.append(parent / "backend")

    # Deduplicate while preserving order
    seen = set()
    unique_candidates = []
    for path in candidates:
        if path in seen:
            continue
        seen.add(path)
        unique_candidates.append(path)

    return unique_candidates


def _locate_backend_dir() -> Path:
    """Locate the backend directory within the deployment."""
    for candidate in _candidate_backend_paths():
        logger.info(f"DEBUG: Checking candidate: {candidate} (exists={candidate.exists()})")
        if candidate.exists():
            logger.info(f"DEBUG: Contents of {candidate}: {os.listdir(candidate)[:10]}")
            if (candidate / "app" / "main.py").exists():
                logger.info(f"DEBUG: ✓ Found backend at {candidate}")
                return candidate

    # Exhaustive fallback: walk current working directory
    logger.warning("DEBUG: Candidate search failed, walking filesystem...")
    cwd = Path(os.getcwd())
    for root, dirs, files in os.walk(cwd):
        root_path = Path(root)
        # Don't walk too deep or into large directories
        if len(root_path.parts) - len(cwd.parts) > 4:
            continue
        if any(skip in root for skip in ['node_modules', '.next', 'venv', '__pycache__']):
            continue

        if "main.py" in files:
            if (root_path / "main.py").exists() and (root_path.parent.name == "app"):
                backend_path = root_path.parent.parent
                logger.info(f"DEBUG: ✓ Found backend via walk at {backend_path}")
                return backend_path

    raise FileNotFoundError(
        f"Unable to locate backend/app/main.py. "
        f"Searched from {os.getcwd()}. "
        f"Directory contents: {os.listdir(os.getcwd())[:20]}"
    )


try:
    backend_dir = _locate_backend_dir()
    
    # Add backend to Python path
    backend_str = str(backend_dir)
    if backend_str not in sys.path:
        sys.path.insert(0, backend_str)
        logger.info(f"DEBUG: Added {backend_str} to sys.path")
    
    main_py = backend_dir / "app" / "main.py"
    logger.info(f"DEBUG: Using backend main.py at {main_py}")
    
    # Import FastAPI app
    from app.main import app
    logger.info("DEBUG: Successfully imported app.main")
    
    # Import Mangum for AWS Lambda/Vercel compatibility
    from mangum import Mangum
    
    # Create handler
    # Vercel's rewrite sends full path (/api/v1/...) to this function
    # FastAPI app is mounted at both /api/v1 and / so it will handle the routing
    handler = Mangum(app, lifespan="off", api_gateway_base_path=None)
    logger.info("DEBUG: Mangum handler initialized successfully")
    logger.info("=" * 80)

except Exception as e:
    logger.error("=" * 80)
    logger.error(f"ERROR: Failed to initialize application: {e}", exc_info=True)
    logger.error("=" * 80)
    
    # Create fallback error app
    from fastapi import FastAPI, Request
    from fastapi.responses import JSONResponse
    from mangum import Mangum
    
    error_app = FastAPI()
    
    @error_app.api_route(
        "/{path_name:path}", 
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH", "TRACE"]
    )
    async def catch_all(path_name: str, request: Request):
        logger.error(f"Error app catch-all hit: {request.method} {path_name}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "Application failed to initialize",
                "detail": str(e),
                "path": path_name,
                "method": request.method,
                "cwd": os.getcwd(),
                "sys_path": sys.path[:3]  # First 3 entries only
            }
        )
    
    handler = Mangum(error_app, lifespan="off")
    logger.info("DEBUG: Fallback error handler initialized")

# Export handler for Vercel
# Vercel expects the handler to be available at module level
__all__ = ["handler"]
