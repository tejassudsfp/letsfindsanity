"""Authentication routes"""

from flask import Blueprint, request, jsonify, make_response
from services.auth_service import (
    create_otp, verify_otp, get_or_create_user,
    create_jwt_token, get_user_application_status
)
from services.email_service import send_otp_email
from middleware.auth_middleware import require_auth
from services.database import db

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/request-otp', methods=['POST'])
def request_otp():
    """Request OTP for login/signup"""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    purpose = data.get('purpose', 'login')

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    # Generate and store OTP
    otp_code = create_otp(email, purpose)

    # Send email
    send_otp_email(email, otp_code, purpose)

    return jsonify({
        'success': True,
        'message': 'OTP sent to email'
    }), 200


@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp_route():
    """Verify OTP and create session"""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    code = data.get('code', '').strip()
    purpose = data.get('purpose', 'login')

    if not email or not code:
        return jsonify({'error': 'Email and code are required'}), 400

    # Verify OTP
    if not verify_otp(email, code, purpose):
        return jsonify({'error': 'Invalid or expired code'}), 401

    # Get or create user
    user = get_or_create_user(email)

    # Get application status
    app_status = get_user_application_status(user['id'])

    # Create JWT token
    token = create_jwt_token(user['id'], user['email'], user['is_admin'])

    # Create response with cookie
    response = make_response(jsonify({
        'success': True,
        'token': token,
        'user': {
            'id': str(user['id']),
            'email': user['email'],
            'three_word_id': user['three_word_id'],
            'is_admin': user['is_admin'],
            **app_status
        }
    }), 200)

    # Set httpOnly cookie
    # For production with cross-origin requests, we need samesite='None' and secure=True
    response.set_cookie(
        'auth_token',
        token,
        httponly=True,
        secure=True,
        samesite='None',  # Required for cross-origin cookies
        max_age=30 * 24 * 60 * 60,  # 30 days
        path='/'  # Ensure cookie is available for all paths
    )

    return response


@auth_bp.route('/logout', methods=['POST'])
@require_auth
def logout():
    """Clear session"""
    response = make_response(jsonify({'success': True}), 200)
    response.set_cookie('auth_token', '', expires=0, samesite='None', secure=True)
    return response


@auth_bp.route('/me', methods=['GET'])
@require_auth
def get_me():
    """Get current user"""
    user = request.user
    app_status = get_user_application_status(user['id'])

    return jsonify({
        'user': {
            'id': str(user['id']),
            'email': user['email'],
            'three_word_id': user['three_word_id'],
            'is_admin': user['is_admin'],
            'theme_preference': user['theme_preference'],
            **app_status
        }
    }), 200


@auth_bp.route('/theme', methods=['PATCH'])
@require_auth
def update_theme():
    """Update theme preference"""
    data = request.get_json()
    theme = data.get('theme')

    if theme not in ['dark', 'light']:
        return jsonify({'error': 'Invalid theme'}), 400

    db.execute("""
        UPDATE users SET theme_preference = %s WHERE id = %s
    """, [theme, request.user['id']], commit=True)

    return jsonify({'success': True}), 200
