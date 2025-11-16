"""Email service using SendGrid"""

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import os
from .database import db

sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))

FROM_EMAIL = os.environ.get('SENDGRID_FROM_EMAIL', 'noreply@fanpit.live')
FROM_NAME = os.environ.get('SENDGRID_FROM_NAME', 'Humans of X')
REPLY_TO = os.environ.get('SENDGRID_REPLY_TO', 'hr@fanpit.live')
EMAIL_ENABLED = os.environ.get('EMAIL_ENABLED', 'true').lower() == 'true'


def log_email(email, email_type, message_id=None, status='sent'):
    """Log sent email to database"""
    try:
        db.execute("""
            INSERT INTO email_logs (email, email_type, sendgrid_message_id, status)
            VALUES (%s, %s, %s, %s)
        """, [email, email_type, message_id, status], commit=True)
    except Exception as e:
        print(f"Failed to log email: {e}")


def send_email(to_email, subject, html_content, email_type):
    """Helper function to send email with common logic"""
    if not EMAIL_ENABLED:
        print(f"Email disabled. Would send {email_type} to {to_email}")
        log_email(to_email, email_type, None, 'disabled')
        return True

    message = Mail(
        from_email=(FROM_EMAIL, FROM_NAME),
        to_emails=to_email,
        subject=subject,
        html_content=html_content
    )

    if REPLY_TO:
        message.reply_to = REPLY_TO

    try:
        response = sg.send(message)
        message_id = response.headers.get('X-Message-Id')
        log_email(to_email, email_type, message_id)
        return True
    except Exception as e:
        print(f"Error sending {email_type} email: {e}")
        log_email(to_email, email_type, None, 'failed')
        return False


def send_otp_email(to_email, otp_code, purpose='login'):
    """Send OTP code via email"""
    subject = "your login code"

    if purpose == "signup":
        html_content = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="text-transform: lowercase;">welcome to letsfindsanity</h2>
            <p>your verification code is:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 24px 0;">
                {otp_code}
            </div>
            <p style="color: #666;">this code expires in 10 minutes.</p>
            <p style="color: #666;">if you didn't request this, you can safely ignore this email.</p>
        </div>
        """
    else:
        html_content = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="text-transform: lowercase;">your login code</h2>
            <p>enter this code to continue:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 24px 0;">
                {otp_code}
            </div>
            <p style="color: #666;">this code expires in 10 minutes.</p>
        </div>
        """

    return send_email(to_email, subject, html_content, "otp")


def send_application_submitted_email(to_email):
    """Confirm application submission"""
    subject = "application received"
    html_content = """
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="text-transform: lowercase;">application received</h2>
        <p>thanks for applying to join letsfindsanity.</p>
        <p>we'll review your application and get back to you soon.</p>
        <p>usually takes 1-2 days.</p>
    </div>
    """
    return send_email(to_email, subject, html_content, "application_submitted")


def send_application_approved_email(to_email):
    """Notify user of approval"""
    subject = "you're in"
    html_content = """
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="text-transform: lowercase;">welcome to letsfindsanity</h2>
        <p>your application has been approved.</p>
        <p>log in to choose your anonymous identity and start writing.</p>
        <p><a href="https://letsfindsanity.com" style="color: #000;">go to letsfindsanity →</a></p>
    </div>
    """
    return send_email(to_email, subject, html_content, "application_approved")


def send_application_rejected_email(to_email, reason):
    """Notify user of rejection"""
    subject = "about your application"
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="text-transform: lowercase;">application update</h2>
        <p>thanks for your interest in letsfindsanity.</p>
        <p>unfortunately, we're not able to approve your application at this time.</p>
        <div style="background: #f5f5f5; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0;"><strong>reason:</strong></p>
            <p style="margin: 8px 0 0 0;">{reason}</p>
        </div>
        <p>you're welcome to apply again in the future.</p>
    </div>
    """
    return send_email(to_email, subject, html_content, "application_rejected")


def send_more_info_needed_email(to_email, request):
    """Request additional information"""
    subject = "more information needed"
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="text-transform: lowercase;">additional information needed</h2>
        <p>we're reviewing your application and need a bit more information:</p>
        <div style="background: #f5f5f5; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0;">{request}</p>
        </div>
        <p>please log in and update your application:</p>
        <p><a href="https://letsfindsanity.com/apply" style="color: #000;">update application →</a></p>
    </div>
    """
    return send_email(to_email, subject, html_content, "more_info_needed")
