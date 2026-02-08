"""Email utilities using SendGrid"""
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
import os
import logging

logger = logging.getLogger(__name__)

SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@afrovending.com')

async def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send an email using SendGrid"""
    if not SENDGRID_API_KEY:
        logger.warning("SendGrid API key not configured")
        return False
    
    try:
        message = Mail(
            from_email=Email(SENDER_EMAIL, "Afrovending"),
            to_emails=To(to_email),
            subject=subject,
            html_content=Content("text/html", html_content)
        )
        
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        return response.status_code in [200, 201, 202]
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False
