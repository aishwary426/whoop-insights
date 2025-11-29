"""
Email service for sending notifications to users.
Supports SMTP for sending emails.
"""
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from app.core_config import get_settings

logger = logging.getLogger(__name__)


def send_email(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: Optional[str] = None
) -> bool:
    """
    Send an email using SMTP.
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_body: HTML email body
        text_body: Plain text email body (optional, auto-generated from HTML if not provided)
    
    Returns:
        True if email was sent successfully, False otherwise
    """
    settings = get_settings()
    
    # Check if email notifications are enabled
    if not settings.enable_email_notifications:
        logger.info(f"Email notifications disabled, skipping email to {to_email}")
        return False
    
    # Check if SMTP is configured
    if not settings.smtp_host or not settings.smtp_user or not settings.smtp_password:
        logger.warning("SMTP not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD environment variables.")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
        msg['To'] = to_email
        
        # Create plain text version if not provided
        if not text_body:
            # Simple HTML to text conversion
            import re
            text_body = re.sub(r'<[^>]+>', '', html_body)
            text_body = text_body.replace('&nbsp;', ' ')
            text_body = text_body.replace('&amp;', '&')
            text_body = text_body.replace('&lt;', '<')
            text_body = text_body.replace('&gt;', '>')
            text_body = text_body.strip()
        
        # Add both plain text and HTML parts
        part1 = MIMEText(text_body, 'plain')
        part2 = MIMEText(html_body, 'html')
        
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error sending email to {to_email}: {e}", exc_info=True)
        return False
    except Exception as e:
        logger.error(f"Error sending email to {to_email}: {e}", exc_info=True)
        return False


def send_blog_post_notification(
    to_email: str,
    blog_title: str,
    blog_preview: str,
    blog_slug: str,
    blog_category: str,
    reading_time: Optional[str] = None
) -> bool:
    """
    Send a notification email about a new blog post.
    
    Args:
        to_email: Recipient email address
        blog_title: Title of the blog post
        blog_preview: Preview/description of the blog post
        blog_slug: URL slug for the blog post
        blog_category: Category of the blog post
        reading_time: Estimated reading time (optional)
    
    Returns:
        True if email was sent successfully, False otherwise
    """
    settings = get_settings()
    
    # Build the blog post URL
    blog_url = f"{settings.frontend_url}/blog/{blog_slug}"
    
    # Create email subject
    subject = f"New Blog Post: {blog_title}"
    
    # Create HTML email body
    reading_time_text = f" • {reading_time}" if reading_time else ""
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Blog Post!</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0; font-size: 22px;">{blog_title}</h2>
            
            <div style="color: #666; font-size: 14px; margin-bottom: 20px;">
                <span style="background: #f0f0f0; padding: 4px 12px; border-radius: 12px; display: inline-block;">{blog_category}</span>
                {reading_time_text}
            </div>
            
            <p style="color: #555; font-size: 16px; line-height: 1.8;">{blog_preview}</p>
            
            <div style="margin: 30px 0; text-align: center;">
                <a href="{blog_url}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">Read Full Article</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                You're receiving this because you subscribed to our blog updates.<br>
                <a href="{settings.frontend_url}" style="color: #667eea; text-decoration: none;">Visit Whoop Insights</a>
            </p>
        </div>
    </body>
    </html>
    """
    
    return send_email(to_email, subject, html_body)


def send_bulk_blog_post_notifications(
    subscriber_emails: List[str],
    blog_title: str,
    blog_preview: str,
    blog_slug: str,
    blog_category: str,
    reading_time: Optional[str] = None
) -> dict:
    """
    Send blog post notifications to multiple subscribers.
    
    Args:
        subscriber_emails: List of subscriber email addresses
        blog_title: Title of the blog post
        blog_preview: Preview/description of the blog post
        blog_slug: URL slug for the blog post
        blog_category: Category of the blog post
        reading_time: Estimated reading time (optional)
    
    Returns:
        Dictionary with 'success_count' and 'failure_count'
    """
    success_count = 0
    failure_count = 0
    
    for email in subscriber_emails:
        try:
            if send_blog_post_notification(
                email, blog_title, blog_preview, blog_slug, blog_category, reading_time
            ):
                success_count += 1
            else:
                failure_count += 1
        except Exception as e:
            logger.error(f"Error sending notification to {email}: {e}", exc_info=True)
            failure_count += 1
    
    logger.info(f"Sent blog post notifications: {success_count} successful, {failure_count} failed")
    
    return {
        'success_count': success_count,
        'failure_count': failure_count,
        'total': len(subscriber_emails)
    }























