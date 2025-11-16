"""Authentication and authorization middleware"""

from functools import wraps
from flask import request, jsonify
from services.auth_service import verify_jwt_token
from services.database import db


def get_token_from_request():
    """Extract JWT token from request"""
    # Try Authorization header first
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header.split(' ')[1]

    # Try cookie
    token = request.cookies.get('auth_token')
    if token:
        return token

    return None


def require_auth(f):
    """Require valid authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_request()

        if not token:
            return jsonify({'error': 'Authentication required'}), 401

        payload = verify_jwt_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401

        # Get fresh user data
        user = db.execute("""
            SELECT id, email, three_word_id, is_admin, theme_preference
            FROM users WHERE id = %s
        """, [payload['user_id']], fetch_one=True)

        if not user:
            return jsonify({'error': 'User not found'}), 401

        # Add user to request context
        request.user = dict(user)

        return f(*args, **kwargs)

    return decorated


def require_admin(f):
    """Require admin privileges"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_request()

        if not token:
            return jsonify({'error': 'Authentication required'}), 401

        payload = verify_jwt_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401

        # Get user and check admin status
        user = db.execute("""
            SELECT id, email, three_word_id, is_admin, theme_preference
            FROM users WHERE id = %s
        """, [payload['user_id']], fetch_one=True)

        if not user:
            return jsonify({'error': 'User not found'}), 401

        if not user['is_admin']:
            return jsonify({'error': 'Admin access required'}), 403

        # Add user to request context
        request.user = dict(user)

        return f(*args, **kwargs)

    return decorated


def require_verified(f):
    """Require user to have approved application and chosen identity"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_request()

        if not token:
            return jsonify({'error': 'Authentication required'}), 401

        payload = verify_jwt_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401

        # Get user
        user = db.execute("""
            SELECT id, email, three_word_id, is_admin, theme_preference
            FROM users WHERE id = %s
        """, [payload['user_id']], fetch_one=True)

        if not user:
            return jsonify({'error': 'User not found'}), 401

        # Check if user has three-word ID
        if not user['three_word_id']:
            return jsonify({'error': 'Please complete verification and choose identity first'}), 403

        # Add user to request context
        request.user = dict(user)

        return f(*args, **kwargs)

    return decorated


def optional_auth(f):
    """Authentication optional - adds user to request if authenticated"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_request()

        if token:
            payload = verify_jwt_token(token)
            if payload:
                user = db.execute("""
                    SELECT id, email, three_word_id, is_admin, theme_preference
                    FROM users WHERE id = %s
                """, [payload['user_id']], fetch_one=True)

                if user:
                    request.user = dict(user)

        if not hasattr(request, 'user'):
            request.user = None

        return f(*args, **kwargs)

    return decorated
