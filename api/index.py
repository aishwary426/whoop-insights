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
logger.info(f"DEBUG: sys.path: {sys.path}")

def _candidate_backend_paths() -> list[Path]:
    """Return possible backend locations within the bundle."""
    current_file = Path(__file__).resolve()
    api_dir = current_file.parent
    logger.info(f"DEBUG: API dir: {api_dir}")
    logger.info(f"DEBUG: __file__ parents: {[str(p) for p in current_file.parents]}")
    
    candidates: list[Path] = []
    
    # Project root sibling (local dev)
    candidates.append(api_dir.parent / "backend")
    
    # CWD relative
    candidates.append(Path(os.getcwd()) / "backend")
    
    # Common Vercel/Lambda locations
    candidates.append(Path("/var/task/backend"))
    candidates.append(Path("/var/task/user/backend"))
    
    # Walk up a few levels and look for backend folder
    for parent in current_file.parents:
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
    for candidate in _candidate_backend_paths():
        logger.info(f"DEBUG: Checking candidate backend path: {candidate}")
        if (candidate / "app" / "main.py").exists():
            logger.info(f"DEBUG: Found backend at {candidate}")
            return candidate
    
    # Exhaustive fallback: walk current working directory
    logger.warning("DEBUG: Candidate search failed, falling back to directory walk")
    for root, dirs, files in os.walk(os.getcwd()):
        if "main.py" in files and "app" in dirs:
            backend_path = Path(root)
            if (backend_path / "app" / "main.py").exists():
                logger.info(f"DEBUG: Found backend via walk at {backend_path}")
                return backend_path
    raise FileNotFoundError("Unable to locate backend/app/main.py within deployment bundle")


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
