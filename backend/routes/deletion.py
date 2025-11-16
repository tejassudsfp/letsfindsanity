"""Account deletion routes"""

from flask import Blueprint, request, jsonify
from middleware.auth_middleware import require_verified
from services.database import db
import uuid

deletion_bp = Blueprint('deletion', __name__)


@deletion_bp.route('/request', methods=['POST'])
@require_verified
def request_deletion():
    """User requests account deletion"""
    user_id = request.user['id']
    data = request.get_json() or {}

    # Check if there's already a pending request
    existing = db.execute(
        """SELECT id, status FROM deletion_requests
           WHERE user_id = %s AND status = 'pending'""",
        [user_id]
    )

    if existing:
        return jsonify({'error': 'You already have a pending deletion request'}), 400

    # Get user info
    user = db.execute(
        "SELECT email, three_word_id FROM users WHERE id = %s",
        [user_id]
    )

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Create deletion request
    db.execute("""
        INSERT INTO deletion_requests (user_id, email, three_word_id, reason, status)
        VALUES (%s, %s, %s, %s, 'pending')
    """, [
        user_id,
        user['email'],
        user.get('three_word_id'),
        data.get('reason', '')
    ], commit=True)

    return jsonify({
        'message': 'Deletion request submitted. An admin will review it shortly.'
    }), 201


@deletion_bp.route('/status', methods=['GET'])
@require_verified
def get_deletion_status():
    """Check if user has a pending deletion request"""
    user_id = request.user['id']

    request_data = db.execute(
        """SELECT id, status, reason, created_at, admin_notes, reviewed_at
           FROM deletion_requests
           WHERE user_id = %s
           ORDER BY created_at DESC
           LIMIT 1""",
        [user_id]
    )

    if not request_data:
        return jsonify({'has_request': False}), 200

    return jsonify({
        'has_request': True,
        'status': request_data['status'],
        'reason': request_data['reason'],
        'created_at': request_data['created_at'].isoformat() if request_data.get('created_at') else None,
        'admin_notes': request_data.get('admin_notes'),
        'reviewed_at': request_data['reviewed_at'].isoformat() if request_data.get('reviewed_at') else None
    }), 200


@deletion_bp.route('/cancel', methods=['DELETE'])
@require_verified
def cancel_deletion():
    """Cancel a pending deletion request"""
    user_id = request.user['id']

    result = db.execute(
        """DELETE FROM deletion_requests
           WHERE user_id = %s AND status = 'pending'
           RETURNING id""",
        [user_id],
        commit=True
    )

    if not result:
        return jsonify({'error': 'No pending deletion request found'}), 404

    return jsonify({'message': 'Deletion request cancelled'}), 200
