#!/usr/bin/env python3
"""
Test script to verify email configuration and send a test email.
"""

from app.core_config import get_settings
from app.utils.email_service import send_email
import sys

def main():
    settings = get_settings()
    
    print("=" * 60)
    print("EMAIL CONFIGURATION CHECK")
    print("=" * 60)
    print()
    
    print(f"SMTP Host: {settings.smtp_host or 'NOT SET'}")
    print(f"SMTP Port: {settings.smtp_port}")
    print(f"SMTP User: {settings.smtp_user or 'NOT SET'}")
    print(f"SMTP Password: {'*' * len(settings.smtp_password) if settings.smtp_password else 'NOT SET'}")
    print(f"From Email: {settings.smtp_from_email}")
    print(f"From Name: {settings.smtp_from_name}")
    print(f"Frontend URL: {settings.frontend_url}")
    print(f"Email Notifications Enabled: {settings.enable_email_notifications}")
    print()
    
    # Check if configured
    if not settings.smtp_host or not settings.smtp_user or not settings.smtp_password:
        print("❌ ERROR: SMTP is not fully configured!")
        print()
        print("Please update your .env file with:")
        print("  - SMTP_HOST (e.g., smtp.gmail.com)")
        print("  - SMTP_USER (your Gmail address)")
        print("  - SMTP_PASSWORD (Gmail App Password)")
        print()
        print("For Gmail:")
        print("  1. Enable 2-Step Verification")
        print("  2. Go to: https://myaccount.google.com/apppasswords")
        print("  3. Generate an App Password")
        print("  4. Use that 16-character password as SMTP_PASSWORD")
        sys.exit(1)
    
    if not settings.enable_email_notifications:
        print("⚠️  WARNING: Email notifications are disabled!")
        print("   Set ENABLE_EMAIL_NOTIFICATIONS=True in .env")
        sys.exit(1)
    
    print("✅ Configuration looks good!")
    print()
    
    # Ask for test email
    test_email = input("Enter your email address to send a test email (or press Enter to skip): ").strip()
    
    if not test_email:
        print("Skipping test email.")
        sys.exit(0)
    
    print()
    print(f"Sending test email to {test_email}...")
    
    html_body = """
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Test Email from Whoop Insights</h2>
        <p>If you received this email, your SMTP configuration is working correctly! ✅</p>
        <p>You will now receive notifications when new blog posts are published.</p>
    </body>
    </html>
    """
    
    success = send_email(
        to_email=test_email,
        subject="Test Email - Whoop Insights",
        html_body=html_body
    )
    
    if success:
        print("✅ Test email sent successfully!")
        print("   Check your inbox (and spam folder).")
    else:
        print("❌ Failed to send test email.")
        print("   Check the logs for more details.")
        sys.exit(1)

if __name__ == "__main__":
    main()























