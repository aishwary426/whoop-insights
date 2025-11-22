#!/bin/bash

echo "🚀 Setting up Whoop Insights Pro Backend"
echo "========================================"

# Create directory structure
mkdir -p app/{api,models,services,ml,utils,schemas}
mkdir -p app/api/v1/endpoints
mkdir -p app/services/{ingestion,analysis,predictions}
mkdir -p app/ml/{feature_engineering,models,forecasting}
mkdir -p data/{raw,processed,models}
mkdir -p tests

# Create __init__.py files
touch app/__init__.py
touch app/api/__init__.py
touch app/api/v1/__init__.py
touch app/api/v1/endpoints/__init__.py
touch app/models/__init__.py
touch app/services/__init__.py
touch app/services/ingestion/__init__.py
touch app/services/analysis/__init__.py
touch app/services/predictions/__init__.py
touch app/ml/__init__.py
touch app/ml/feature_engineering/__init__.py
touch app/ml/models/__init__.py
touch app/ml/forecasting/__init__.py
touch app/schemas/__init__.py
touch app/utils/__init__.py

echo "✅ Directory structure created"

# Create requirements.txt
cat > requirements.txt << 'REQS'
# FastAPI & Server
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
pydantic==2.5.0
pydantic-settings==2.1.0

# Database
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
alembic==1.13.0

# Caching & Background Jobs
redis==5.0.1
rq==1.15.1

# Data Processing
pandas==2.1.3
numpy==1.26.2
python-dateutil==2.8.2

# ML & Analytics
scikit-learn==1.3.2
xgboost==2.0.3
lightgbm==4.1.0
prophet==1.1.5
statsmodels==0.14.0

# Utilities
python-dotenv==1.0.0
pytz==2023.3
zipfile36==0.1.3

# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.2
REQS

echo "✅ requirements.txt created"

# Create .env.example
cat > .env.example << 'ENV'
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/whoop_insights

# Redis
REDIS_URL=redis://localhost:6379/0

# Storage
UPLOAD_DIR=./data/raw
PROCESSED_DIR=./data/processed
MODEL_DIR=./data/models

# API
API_V1_PREFIX=/api/v1
SECRET_KEY=your-secret-key-here
DEBUG=True

# ML Config
MODEL_VERSION=1.0.0
ENABLE_FORECASTING=True
ENV

echo "✅ Environment config created"

echo ""
echo "🎉 Backend structure ready!"
echo ""
echo "Next steps:"
echo "1. cd backend"
echo "2. python -m venv venv"
echo "3. source venv/bin/activate"
echo "4. pip install -r requirements.txt"
