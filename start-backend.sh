#!/bin/bash
# Start the FastAPI backend server

cd "$(dirname "$0")/backend"
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 --host 0.0.0.0

