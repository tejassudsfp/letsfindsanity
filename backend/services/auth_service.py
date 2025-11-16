"""Authentication service with OTP and JWT"""

import random
import string
from datetime import datetime, timedelta
from jose import jwt, JWTError
import os
from .database import db

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-this')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRES_HOURS = int(os.environ.get('JWT_EXPIRES_HOURS', 720))  # 30 days


def generate_otp():
    """Generate 6-digit OTP code"""
    return ''.join(random.choices(string.digits, k=6))


def create_otp(email, purpose='login'):
    """Create and store OTP code"""
    code = generate_otp()
    expires_at = datetime.now() + timedelta(minutes=10)

    db.execute("""
        INSERT INTO otp_codes (email, code, purpose, expires_at)
        VALUES (%s, %s, %s, %s)
    """, [email, code, purpose, expires_at], commit=True)

    return code


def verify_otp(email, code, purpose='login'):
    """Verify OTP code"""
    result = db.execute("""
        SELECT id, expires_at, used
        FROM otp_codes
        WHERE email = %s AND code = %s AND purpose = %s
        ORDER BY created_at DESC
        LIMIT 1
    """, [email, code, purpose], fetch_one=True)

    if not result:
        return False

    if result['used']:
        return False

    if datetime.now() > result['expires_at']:
        return False

    # Mark as used
    db.execute("""
        UPDATE otp_codes SET used = TRUE WHERE id = %s
    """, [result['id']], commit=True)

    return True


def cleanup_expired_otps():
    """Remove expired OTP codes"""
    db.execute("""
        DELETE FROM otp_codes WHERE expires_at < NOW()
    """, commit=True)


def create_jwt_token(user_id, email, is_admin=False):
    """Create JWT token"""
    payload = {
        'user_id': str(user_id),
        'email': email,
        'is_admin': is_admin,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRES_HOURS)
    }

    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token


def verify_jwt_token(token):
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


def get_or_create_user(email):
    """Get existing user or create new one"""
    user = db.execute("""
        SELECT id, email, three_word_id, is_admin, theme_preference
        FROM users WHERE email = %s
    """, [email], fetch_one=True)

    if user:
        # Update last active
        db.execute("""
            UPDATE users SET last_active = NOW() WHERE id = %s
        """, [user['id']], commit=True)
        return dict(user)

    # Create new user
    new_user = db.execute("""
        INSERT INTO users (email)
        VALUES (%s)
        RETURNING id, email, three_word_id, is_admin, theme_preference
    """, [email], commit=True)

    return dict(new_user)


def get_user_application_status(user_id):
    """Get user's application status"""
    app = db.execute("""
        SELECT status, rejection_reason, more_info_request, can_reapply
        FROM applications
        WHERE user_id = %s
        ORDER BY submitted_at DESC
        LIMIT 1
    """, [user_id], fetch_one=True)

    if app:
        return {
            'has_application': True,
            'application_status': app['status'],
            'rejection_reason': app.get('rejection_reason'),
            'more_info_request': app.get('more_info_request'),
            'can_reapply': app.get('can_reapply', False)
        }

    return {
        'has_application': False,
        'application_status': None,
        'can_reapply': False
    }
