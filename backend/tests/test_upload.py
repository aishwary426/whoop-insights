import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import io
import os
from app.main import app

client = TestClient(app)

@pytest.fixture
def mock_upload_file():
    return io.BytesIO(b"PK\x03\x04\x14\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00")

@patch("app.api.v1.endpoints.upload.save_upload_file")
@patch("app.api.v1.endpoints.upload.ingest_whoop_zip")
@patch("app.api.v1.endpoints.upload.SessionLocal")
def test_upload_whoop_data_success(mock_session, mock_ingest, mock_save, mock_upload_file):
    # Setup mocks
    mock_save.return_value = "/tmp/test.zip"
    mock_db = MagicMock()
    mock_session.return_value = mock_db
    
    # Create a dummy zip file
    files = {
        "file": ("test.zip", mock_upload_file, "application/zip")
    }
    data = {
        "user_id": "test_user_123",
        "is_mobile": "false"
    }
    
    response = client.post("/api/v1/whoop/ingest", files=files, data=data)
    
    assert response.status_code == 200
    assert response.json()["status"] == "completed"
    assert response.json()["upload_id"] is not None
    
    # Verify mocks called
    mock_save.assert_called_once()
    mock_ingest.assert_called_once()

@patch("app.api.v1.endpoints.upload.save_upload_file")
def test_upload_invalid_file_extension(mock_save, mock_upload_file):
    files = {
        "file": ("test.txt", mock_upload_file, "text/plain")
    }
    data = {
        "user_id": "test_user_123"
    }
    
    response = client.post("/api/v1/whoop/ingest", files=files, data=data)
    
    assert response.status_code == 400
    assert "Only ZIP files are supported" in response.json()["detail"]

def test_upload_missing_user_id(mock_upload_file):
    files = {
        "file": ("test.zip", mock_upload_file, "application/zip")
    }
    
    response = client.post("/api/v1/whoop/ingest", files=files)
    
    assert response.status_code == 422  # Validation error
