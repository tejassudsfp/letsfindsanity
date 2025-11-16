"""Identity management routes"""

from flask import Blueprint, request, jsonify
from middleware.auth_middleware import require_auth
from services.database import db
from services.identity_service import generate_three_word_id, check_three_word_exists

identity_bp = Blueprint('identity', __name__)


@identity_bp.route('/choose', methods=['POST'])
@require_auth
def choose_identity():
    """Choose three-word identity (after approval)"""
    data = request.get_json()
    three_word_id = data.get('three_word_id', '').strip().lower()
    user_id = request.user['id']

    if not three_word_id:
        return jsonify({'error': 'Three-word ID is required'}), 400

    # Check if user already has identity
    if request.user['three_word_id']:
        return jsonify({'error': 'Identity already chosen'}), 400

    # Check if application is approved
    app = db.execute("""
        SELECT status FROM applications
        WHERE user_id = %s
        ORDER BY submitted_at DESC
        LIMIT 1
    """, [user_id], fetch_one=True)

    if not app or app['status'] != 'approved':
        return jsonify({'error': 'Application must be approved first'}), 403

    # Check if three-word ID is available
    if check_three_word_exists(three_word_id):
        return jsonify({'error': 'This identity is already taken'}), 400

    # Set identity
    db.execute("""
        UPDATE users SET three_word_id = %s WHERE id = %s
    """, [three_word_id, user_id], commit=True)

    return jsonify({'success': True}), 200


@identity_bp.route('/generate', methods=['GET'])
@require_auth
def generate_identity_options():
    """Generate identity options for user to choose from"""
    from services.identity_service import generate_identity_options

    user_id = request.user['id']

    # Check if application is approved
    app = db.execute("""
        SELECT status FROM applications
        WHERE user_id = %s
        ORDER BY submitted_at DESC
        LIMIT 1
    """, [user_id], fetch_one=True)

    if not app or app['status'] != 'approved':
        return jsonify({'error': 'Application must be approved first'}), 403

    options = generate_identity_options(count=5)

    return jsonify({
        'options': options
    }), 200


@identity_bp.route('/reset', methods=['POST'])
@require_auth
def reset_identity():
    """Reset three-word identity"""
    user_id = request.user['id']

    # Generate new identity
    new_id = generate_three_word_id()

    # Update user
    db.execute("""
        UPDATE users SET three_word_id = %s WHERE id = %s
    """, [new_id, user_id], commit=True)

    # Update all posts with new identity
    db.execute("""
        UPDATE posts SET three_word_id = %s WHERE user_id = %s
    """, [new_id, user_id], commit=True)

    # Update all comments with new identity
    db.execute("""
        UPDATE comments SET three_word_id = %s WHERE user_id = %s
    """, [new_id, user_id], commit=True)

    return jsonify({
        'success': True,
        'new_three_word_id': new_id
    }), 200
