"""Email service using SendGrid"""

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import os
from .database import db

sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))

# Different sender configurations
NOREPLY_EMAIL = os.environ.get('SENDGRID_NOREPLY_EMAIL', 'noreply@letsfindsanity.com')
NOREPLY_NAME = 'lets find sanity'

FRED_EMAIL = os.environ.get('SENDGRID_FRED_EMAIL', 'fred@letsfindsanity.com')
FRED_NAME = 'fred from letsfindsanity'

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


def send_email(to_email, subject, html_content, email_type, from_email=None, from_name=None, reply_to=None):
    """Helper function to send email with common logic"""
    if not EMAIL_ENABLED:
        print(f"Email disabled. Would send {email_type} to {to_email}")
        log_email(to_email, email_type, None, 'disabled')
        return True

    # Use provided sender or defaults
    sender_email = from_email or FRED_EMAIL
    sender_name = from_name or FRED_NAME

    message = Mail(
        from_email=(sender_email, sender_name),
        to_emails=to_email,
        subject=subject,
        html_content=html_content
    )

    if reply_to:
        message.reply_to = reply_to

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
    """Send OTP code via email (uses noreply@letsfindsanity.com)"""
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

    # Use noreply for OTPs
    return send_email(to_email, subject, html_content, "otp",
                     from_email=NOREPLY_EMAIL, from_name=NOREPLY_NAME)


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


def send_analysis_todos_email(to_email, journal_title, analysis_text, session_date):
    """Send AI analysis with actionable todos (from fred)"""
    subject = "your action items from fred"

    # Extract the "what you could do next" section from the analysis
    # The analysis is in markdown format with ## headings
    todos_section = ""
    if "## what you could do next:" in analysis_text.lower():
        parts = analysis_text.lower().split("## what you could do next:")
        if len(parts) > 1:
            # Get everything after "what you could do next"
            todos_raw = analysis_text.split("## what you could do next:")[-1]
            # Find the next ## heading or end of text
            next_section = todos_raw.split("##")[0] if "##" in todos_raw else todos_raw
            todos_section = next_section.strip()

    # If no todos found, include the full analysis
    if not todos_section:
        todos_section = "check your journal entry for the full analysis."

    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="text-transform: lowercase; color: #000;">hi! i'm fred.</h2>

        <p style="color: #666; font-size: 14px; margin-bottom: 24px;">
            you asked me to email you the action items from your journal entry.
        </p>

        <div style="background: #f8f8f8; padding: 16px; margin: 24px 0; border-left: 3px solid #000;">
            <p style="margin: 0; font-weight: 600; color: #000;">{journal_title}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #999;">{session_date}</p>
        </div>

        <h3 style="text-transform: lowercase; font-size: 16px; margin-top: 32px;">what you could do next:</h3>

        <div style="line-height: 1.6; color: #333;">
            {todos_section.replace(chr(10), '<br>')}
        </div>

        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 13px; color: #999;">
                this is from your private journal analysis.
                <a href="https://letsfindsanity.com/journal" style="color: #000;">view full entry →</a>
            </p>
        </div>
    </div>
    """

    return send_email(to_email, subject, html_content, "analysis_todos")
