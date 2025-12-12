"""
Comprehensive tests for utility modules.
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
import tempfile
import os
from pathlib import Path

from app.utils.admin_auth import get_user_email_from_header, is_admin_email, require_admin
from app.utils.device import is_mobile_user_agent
from app.utils.zip_utils import save_upload_file, unzip_whoop_export, discover_csv_files
from app.utils.email_service import send_email, send_blog_post_notification, send_bulk_blog_post_notifications
from app.core_config import get_settings, Settings


class TestAdminAuth:
    """Tests for admin_auth.py functions."""

    def test_get_user_email_from_header_valid_token(self):
        """Test extracting email from valid authorization header."""
        with patch('app.utils.admin_auth.supabase') as mock_supabase:
            mock_user = Mock()
            mock_user.user.email = "admin@example.com"
            mock_supabase.auth.get_user.return_value = mock_user

            email = get_user_email_from_header("Bearer valid_token")
            assert email == "admin@example.com"

    def test_get_user_email_from_header_no_token(self):
        """Test with no authorization header."""
        email = get_user_email_from_header(None)
        assert email is None

    def test_get_user_email_from_header_invalid_format(self):
        """Test with invalid header format."""
        email = get_user_email_from_header("InvalidFormat")
        assert email is None

    def test_get_user_email_from_header_exception(self):
        """Test handling of exceptions during token verification."""
        with patch('app.utils.admin_auth.supabase') as mock_supabase:
            mock_supabase.auth.get_user.side_effect = Exception("Invalid token")

            email = get_user_email_from_header("Bearer invalid_token")
            assert email is None

    def test_is_admin_email_valid_admin(self):
        """Test with valid admin email."""
        with patch.dict(os.environ, {'ADMIN_EMAILS': 'admin@example.com,superadmin@example.com'}):
            assert is_admin_email("admin@example.com") is True
            assert is_admin_email("superadmin@example.com") is True

    def test_is_admin_email_non_admin(self):
        """Test with non-admin email."""
        with patch.dict(os.environ, {'ADMIN_EMAILS': 'admin@example.com'}):
            assert is_admin_email("user@example.com") is False

    def test_is_admin_email_case_insensitive(self):
        """Test case insensitivity."""
        with patch.dict(os.environ, {'ADMIN_EMAILS': 'admin@example.com'}):
            assert is_admin_email("ADMIN@example.com") is True

    def test_require_admin_authorized(self):
        """Test require_admin with authorized user."""
        with patch('app.utils.admin_auth.is_admin_email', return_value=True):
            email = require_admin("admin@example.com")
            assert email == "admin@example.com"

    def test_require_admin_unauthorized(self):
        """Test require_admin with unauthorized user."""
        from fastapi import HTTPException

        with patch('app.utils.admin_auth.is_admin_email', return_value=False):
            with pytest.raises(HTTPException) as exc_info:
                require_admin("user@example.com")
            assert exc_info.value.status_code == 403

    def test_require_admin_no_email(self):
        """Test require_admin with no email provided."""
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc_info:
            require_admin(None)
        assert exc_info.value.status_code == 401


class TestDevice:
    """Tests for device.py functions."""

    def test_is_mobile_user_agent_iphone(self):
        """Test detection of iPhone user agent."""
        ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)"
        assert is_mobile_user_agent(ua) is True

    def test_is_mobile_user_agent_android(self):
        """Test detection of Android user agent."""
        ua = "Mozilla/5.0 (Linux; Android 11; SM-G991B)"
        assert is_mobile_user_agent(ua) is True

    def test_is_mobile_user_agent_ipad(self):
        """Test detection of iPad user agent."""
        ua = "Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X)"
        assert is_mobile_user_agent(ua) is True

    def test_is_mobile_user_agent_desktop(self):
        """Test desktop user agent."""
        ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        assert is_mobile_user_agent(ua) is False

    def test_is_mobile_user_agent_none(self):
        """Test with None user agent."""
        assert is_mobile_user_agent(None) is False

    def test_is_mobile_user_agent_empty(self):
        """Test with empty user agent."""
        assert is_mobile_user_agent("") is False


class TestZipUtils:
    """Tests for zip_utils.py functions."""

    def test_save_upload_file(self, tmp_path, temp_dirs):
        """Test saving upload file."""
        from io import BytesIO

        # Create mock file object
        file_content = b"test file content"
        file_obj = BytesIO(file_content)
        file_obj.filename = "test.zip"

        # Save file
        saved_path = save_upload_file("user123", "upload456", file_obj)

        # Verify file exists and content matches
        assert os.path.exists(saved_path)
        with open(saved_path, 'rb') as f:
            assert f.read() == file_content

    def test_save_upload_file_size_limit(self, tmp_path, temp_dirs):
        """Test file size limit enforcement."""
        from io import BytesIO

        # Create file larger than limit
        file_content = b"x" * 1000
        file_obj = BytesIO(file_content)
        file_obj.filename = "large.zip"

        with pytest.raises(ValueError, match="exceeds"):
            save_upload_file("user123", "upload456", file_obj, max_size=500)

    def test_unzip_whoop_export(self, tmp_path):
        """Test unzipping WHOOP export."""
        import zipfile

        # Create test zip file
        zip_path = tmp_path / "test.zip"
        with zipfile.ZipFile(zip_path, 'w') as zf:
            zf.writestr("test.csv", "col1,col2\nval1,val2")

        # Unzip
        extract_dir = unzip_whoop_export(str(zip_path))

        # Verify extraction
        assert os.path.exists(extract_dir)
        assert os.path.exists(os.path.join(extract_dir, "test.csv"))

    def test_discover_csv_files(self, tmp_path):
        """Test discovering CSV files in directory."""
        # Create test CSV files
        (tmp_path / "sleep.csv").write_text("data")
        (tmp_path / "recovery.csv").write_text("data")
        (tmp_path / "strain.csv").write_text("data")

        csv_files = discover_csv_files(str(tmp_path))

        assert "sleep" in csv_files or "Sleep" in csv_files
        assert len(csv_files) >= 3


class TestEmailService:
    """Tests for email_service.py functions."""

    @patch('app.utils.email_service.resend')
    def test_send_email_success(self, mock_resend):
        """Test successful email sending."""
        mock_resend.emails.send.return_value = {"id": "email_123"}

        result = send_email(
            to_email="user@example.com",
            subject="Test Subject",
            html_body="<p>Test Body</p>"
        )

        assert result is True
        mock_resend.emails.send.assert_called_once()

    @patch('app.utils.email_service.resend')
    def test_send_email_failure(self, mock_resend):
        """Test email sending failure."""
        mock_resend.emails.send.side_effect = Exception("Email failed")

        result = send_email(
            to_email="user@example.com",
            subject="Test Subject",
            html_body="<p>Test Body</p>"
        )

        assert result is False

    @patch('app.utils.email_service.send_email')
    def test_send_blog_post_notification(self, mock_send_email):
        """Test sending blog post notification."""
        mock_send_email.return_value = True

        result = send_blog_post_notification(
            to_email="subscriber@example.com",
            blog_title="New Blog Post",
            blog_preview="This is a preview...",
            blog_slug="new-blog-post",
            blog_category="Technology"
        )

        assert result is True
        mock_send_email.assert_called_once()

    @patch('app.utils.email_service.send_blog_post_notification')
    def test_send_bulk_blog_post_notifications(self, mock_send_notification):
        """Test sending bulk blog notifications."""
        mock_send_notification.return_value = True

        subscribers = ["user1@example.com", "user2@example.com", "user3@example.com"]

        result = send_bulk_blog_post_notifications(
            subscriber_emails=subscribers,
            blog_title="Bulk Post",
            blog_preview="Preview text",
            blog_slug="bulk-post",
            blog_category="News"
        )

        assert result["total"] == 3
        assert result["sent"] == 3
        assert result["failed"] == 0


class TestCoreConfig:
    """Tests for core_config.py functions."""

    def test_get_settings_returns_singleton(self):
        """Test that get_settings returns same instance."""
        settings1 = get_settings()
        settings2 = get_settings()
        assert settings1 is settings2

    def test_settings_has_required_fields(self):
        """Test that settings has all required fields."""
        settings = get_settings()
        assert hasattr(settings, 'database_url')
        assert hasattr(settings, 'upload_dir')
        assert hasattr(settings, 'model_dir')

    @patch.dict(os.environ, {'VERCEL': '1', 'DATABASE_URL': 'postgres://test'})
    def test_force_sqlite_on_vercel(self):
        """Test SQLite enforcement on Vercel."""
        # Clear settings cache
        get_settings.cache_clear()

        settings = get_settings()
        # Should still use SQLite even with postgres URL
        assert 'sqlite' in settings.database_url.lower()
