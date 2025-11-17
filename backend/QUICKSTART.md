# Quick Start Guide

## Setup

1. **Install dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Configure environment (optional):**
```bash
# Create .env file
echo "DATABASE_URL=sqlite:///./whoop.db" > .env
echo "DEBUG=True" >> .env
echo "LOG_LEVEL=INFO" >> .env
```

3. **Run the server:**
```bash
uvicorn app.main:app --reload --port 8000
```

## API Usage Examples

### 1. Upload WHOOP Data

```bash
curl -X POST "http://localhost:8000/api/v1/whoop/upload?user_id=test_user" \
  -F "file=@your_whoop_export.zip"
```

### 2. Train Models

```bash
curl -X POST "http://localhost:8000/api/v1/train?user_id=test_user"
```

### 3. Get Dashboard

```bash
curl "http://localhost:8000/api/v1/dashboard/summary?user_id=test_user"
```

### 4. Get Trends

```bash
curl "http://localhost:8000/api/v1/dashboard/trends?user_id=test_user&start_date=2024-01-01&end_date=2024-01-31"
```

### 5. Get Insights

```bash
curl "http://localhost:8000/api/v1/dashboard/insights?user_id=test_user"
```

## Testing

```bash
cd backend
pytest tests/ -v
```

## Key Files

- **Architecture**: See `ARCHITECTURE.md` for detailed design
- **API Docs**: Visit `http://localhost:8000/docs` for interactive API documentation
- **Logs**: Check `./logs/app.log` for application logs

## Next Steps

1. Upload your WHOOP export ZIP
2. Wait for processing to complete
3. Train models (requires 14+ days of data)
4. Query dashboard for recommendations
5. Check insights for patterns

## Troubleshooting

- **"No data available"**: Upload a WHOOP ZIP first
- **"Insufficient data for training"**: Need at least 14 days of data
- **Database errors**: Check `DATABASE_URL` in `.env` or environment
- **Import errors**: Ensure all dependencies are installed

