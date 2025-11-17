"""Application routes for verification"""

from flask import Blueprint, request, jsonify
from middleware.auth_middleware import require_auth
from services.database import db
from services.email_service import send_application_submitted_email

application_bp = Blueprint('application', __name__)


@application_bp.route('/submit', methods=['POST'])
@require_auth
def submit_application():
    """Submit verification application"""
    data = request.get_json()
    user_id = request.user['id']

    what_building = data.get('what_building', '').strip()
    why_join = data.get('why_join', '').strip()
    proof_url = data.get('proof_url', '').strip() or None
    how_heard = data.get('how_heard', '').strip() or None

    if not what_building or not why_join:
        return jsonify({'error': 'What you\'re building and why you want to join are required'}), 400

    # Check if user already has a pending/approved application
    existing = db.execute("""
        SELECT id, status FROM applications
        WHERE user_id = %s
        ORDER BY submitted_at DESC
        LIMIT 1
    """, [user_id], fetch_one=True)

    if existing and existing['status'] in ['pending', 'approved']:
        return jsonify({'error': 'You already have an active application'}), 400

    # Create application
    result = db.execute("""
        INSERT INTO applications (user_id, what_building, why_join, proof_url, how_heard, status)
        VALUES (%s, %s, %s, %s, %s, 'pending')
        RETURNING id
    """, [user_id, what_building, why_join, proof_url, how_heard], commit=True)

    # Send confirmation email
    send_application_submitted_email(request.user['email'])

    return jsonify({
        'success': True,
        'application_id': str(result['id'])
    }), 201


@application_bp.route('/status', methods=['GET'])
@require_auth
def get_application_status():
    """Get application status"""
    user_id = request.user['id']

    app = db.execute("""
        SELECT id, status, submitted_at, rejection_reason, more_info_request
        FROM applications
        WHERE user_id = %s
        ORDER BY submitted_at DESC
        LIMIT 1
    """, [user_id], fetch_one=True)

    if not app:
        return jsonify({'application': None}), 200

    return jsonify({
        'application': {
            'id': str(app['id']),
            'status': app['status'],
            'submitted_at': app['submitted_at'].isoformat() if app['submitted_at'] else None,
            'rejection_reason': app['rejection_reason'],
            'more_info_request': app['more_info_request']
        }
    }), 200


@application_bp.route('/update', methods=['PATCH'])
@require_auth
def update_application():
    """Update application (if more info needed)"""
    data = request.get_json()
    user_id = request.user['id']

    # Get current application
    app = db.execute("""
        SELECT id, status FROM applications
        WHERE user_id = %s
        ORDER BY submitted_at DESC
        LIMIT 1
    """, [user_id], fetch_one=True)

    if not app:
        return jsonify({'error': 'No application found'}), 404

    if app['status'] != 'more_info_needed':
        return jsonify({'error': 'Application cannot be updated'}), 400

    what_building = data.get('what_building', '').strip()
    why_join = data.get('why_join', '').strip()
    proof_url = data.get('proof_url', '').strip() or None

    if not what_building or not why_join:
        return jsonify({'error': 'What you\'re building and why you want to join are required'}), 400

    # Update application
    db.execute("""
        UPDATE applications
        SET what_building = %s,
            why_join = %s,
            proof_url = %s,
            status = 'pending',
            more_info_request = NULL,
            updated_at = NOW()
        WHERE id = %s
    """, [what_building, why_join, proof_url, app['id']], commit=True)

    return jsonify({'success': True}), 200
