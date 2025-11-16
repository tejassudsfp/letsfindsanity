"""Admin routes for application management and moderation"""

from flask import Blueprint, request, jsonify
from middleware.auth_middleware import require_admin
from services.database import db
from services.email_service import (
    send_application_approved_email,
    send_application_rejected_email,
    send_more_info_needed_email
)

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/applications', methods=['GET'])
@require_admin
def get_applications():
    """Get verification queue"""
    status = request.args.get('status', 'pending')
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    offset = (page - 1) * limit

    applications = db.execute("""
        SELECT
            a.id, a.what_building, a.why_join, a.proof_url,
            a.status, a.submitted_at, a.admin_notes,
            u.id as user_id, u.email
        FROM applications a
        JOIN users u ON a.user_id = u.id
        WHERE a.status = %s
        ORDER BY a.submitted_at ASC
        LIMIT %s OFFSET %s
    """, [status, limit, offset], fetch_all=True)

    total_result = db.execute("""
        SELECT COUNT(*) as count FROM applications WHERE status = %s
    """, [status], fetch_one=True)
    total = total_result['count']

    return jsonify({
        'applications': [
            {
                'id': str(a['id']),
                'user': {
                    'id': str(a['user_id']),
                    'email': a['email']
                },
                'what_building': a['what_building'],
                'why_join': a['why_join'],
                'proof_url': a['proof_url'],
                'status': a['status'],
                'submitted_at': a['submitted_at'].isoformat() if a['submitted_at'] else None,
                'admin_notes': a['admin_notes']
            }
            for a in applications
        ],
        'total': total,
        'page': page
    }), 200


@admin_bp.route('/applications/<application_id>/approve', methods=['PATCH'])
@require_admin
def approve_application(application_id):
    """Approve application"""
    data = request.get_json()
    admin_notes = data.get('admin_notes', '').strip() or None
    admin_id = request.user['id']

    # Get application with user email
    app = db.execute("""
        SELECT a.user_id, u.email
        FROM applications a
        JOIN users u ON a.user_id = u.id
        WHERE a.id = %s
    """, [application_id], fetch_one=True)

    if not app:
        return jsonify({'error': 'Application not found'}), 404

    # Update application
    db.execute("""
        UPDATE applications
        SET status = 'approved',
            admin_notes = %s,
            reviewed_by = %s,
            reviewed_at = NOW()
        WHERE id = %s
    """, [admin_notes, admin_id, application_id], commit=True)

    # Send approval email
    send_application_approved_email(app['email'])

    return jsonify({'success': True}), 200


@admin_bp.route('/applications/<application_id>/reject', methods=['PATCH'])
@require_admin
def reject_application(application_id):
    """Reject application"""
    data = request.get_json()
    rejection_reason = data.get('rejection_reason', '').strip()
    admin_notes = data.get('admin_notes', '').strip() or None
    admin_id = request.user['id']

    if not rejection_reason:
        return jsonify({'error': 'Rejection reason is required'}), 400

    # Get application with user email
    app = db.execute("""
        SELECT a.user_id, u.email
        FROM applications a
        JOIN users u ON a.user_id = u.id
        WHERE a.id = %s
    """, [application_id], fetch_one=True)

    if not app:
        return jsonify({'error': 'Application not found'}), 404

    # Update application - allow them to reapply
    db.execute("""
        UPDATE applications
        SET status = 'rejected',
            rejection_reason = %s,
            admin_notes = %s,
            reviewed_by = %s,
            reviewed_at = NOW(),
            can_reapply = TRUE
        WHERE id = %s
    """, [rejection_reason, admin_notes, admin_id, application_id], commit=True)

    # Send rejection email
    send_application_rejected_email(app['email'], rejection_reason)

    return jsonify({'success': True}), 200


@admin_bp.route('/applications/<application_id>/request-info', methods=['PATCH'])
@require_admin
def request_more_info(application_id):
    """Request more information"""
    data = request.get_json()
    more_info_request = data.get('more_info_request', '').strip()
    admin_notes = data.get('admin_notes', '').strip() or None
    admin_id = request.user['id']

    if not more_info_request:
        return jsonify({'error': 'Info request is required'}), 400

    # Get application with user email
    app = db.execute("""
        SELECT a.user_id, u.email
        FROM applications a
        JOIN users u ON a.user_id = u.id
        WHERE a.id = %s
    """, [application_id], fetch_one=True)

    if not app:
        return jsonify({'error': 'Application not found'}), 404

    # Update application
    db.execute("""
        UPDATE applications
        SET status = 'more_info_needed',
            more_info_request = %s,
            admin_notes = %s,
            reviewed_by = %s,
            reviewed_at = NOW()
        WHERE id = %s
    """, [more_info_request, admin_notes, admin_id, application_id], commit=True)

    # Send email
    send_more_info_needed_email(app['email'], more_info_request)

    return jsonify({'success': True}), 200


@admin_bp.route('/stats', methods=['GET'])
@require_admin
def get_stats():
    """Get platform statistics"""
    # Use the database function
    stats = db.execute("""
        SELECT * FROM get_live_stats()
    """, fetch_one=True)

    # Get pending applications count
    pending = db.execute("""
        SELECT COUNT(*) as count FROM applications WHERE status = 'pending'
    """, fetch_one=True)

    # Get flagged posts count
    flagged = db.execute("""
        SELECT COUNT(*) as count FROM posts WHERE flagged = TRUE AND is_published = TRUE
    """, fetch_one=True)

    # Get top topics
    top_topics = db.execute("""
        SELECT
            UNNEST(topics) as topic,
            COUNT(*) as count
        FROM posts
        WHERE is_published = TRUE AND flagged = FALSE
        GROUP BY topic
        ORDER BY count DESC
        LIMIT 10
    """, fetch_all=True)

    return jsonify({
        'total_builders': stats['total_builders'],
        'active_today': stats['active_today'],
        'total_posts': stats['total_posts'],
        'posts_this_week': stats['posts_this_week'],
        'pending_applications': pending['count'],
        'flagged_posts': flagged['count'],
        'top_topics': [
            {
                'name': t['topic'],
                'count': t['count']
            }
            for t in top_topics
        ]
    }), 200


@admin_bp.route('/analytics', methods=['GET'])
@require_admin
def get_analytics():
    """Get analytics data for charts"""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if not start_date or not end_date:
        return jsonify({'error': 'start_date and end_date are required'}), 400

    # Get API usage data (real-time aggregated)
    api_usage = db.execute("""
        SELECT
            date,
            SUM(input_tokens) as total_input_tokens,
            SUM(output_tokens) as total_output_tokens,
            SUM(cache_read_tokens) as total_cache_read_tokens
        FROM api_usage
        WHERE date >= %s AND date <= %s
        GROUP BY date
        ORDER BY date ASC
    """, [start_date, end_date], fetch_all=True)

    # Get builder growth data (real-time aggregated from users table)
    builder_growth = db.execute("""
        SELECT
            created_at::date as date,
            COUNT(*) as new_builders,
            (SELECT COUNT(*) FROM users WHERE created_at::date <= created_at::date) as total_builders
        FROM users
        WHERE created_at::date >= %s AND created_at::date <= %s
        GROUP BY created_at::date
        ORDER BY date ASC
    """, [start_date, end_date], fetch_all=True)

    # Get daily activity data (real-time aggregated from sessions and posts)
    daily_activity = db.execute("""
        SELECT
            dates.date,
            COALESCE(sessions, 0) as active_sessions,
            COALESCE(posts, 0) as posts_created
        FROM (
            SELECT generate_series(%s::date, %s::date, '1 day'::interval)::date as date
        ) dates
        LEFT JOIN (
            SELECT completed_at::date as date, COUNT(*) as sessions
            FROM sessions
            WHERE completed_at IS NOT NULL
            GROUP BY completed_at::date
        ) s ON dates.date = s.date
        LEFT JOIN (
            SELECT created_at::date as date, COUNT(*) as posts
            FROM posts
            WHERE is_published = TRUE
            GROUP BY created_at::date
        ) p ON dates.date = p.date
        ORDER BY dates.date ASC
    """, [start_date, end_date], fetch_all=True)

    # Dashboard stats (not affected by date filters)
    total_builders = db.execute("""
        SELECT COUNT(*) as count FROM users
    """, fetch_one=True)

    active_today = db.execute("""
        SELECT COUNT(DISTINCT user_id) as count FROM sessions
        WHERE completed_at::date = CURRENT_DATE
    """, fetch_one=True)

    total_posts = db.execute("""
        SELECT COUNT(*) as count FROM posts WHERE is_published = TRUE
    """, fetch_one=True)

    posts_this_week = db.execute("""
        SELECT COUNT(*) as count FROM posts
        WHERE is_published = TRUE AND created_at >= NOW() - INTERVAL '7 days'
    """, fetch_one=True)

    total_sessions = db.execute("""
        SELECT COUNT(*) as count FROM sessions WHERE completed_at IS NOT NULL
    """, fetch_one=True)

    sessions_this_week = db.execute("""
        SELECT COUNT(*) as count FROM sessions
        WHERE completed_at >= NOW() - INTERVAL '7 days'
    """, fetch_one=True)

    total_analyses = db.execute("""
        SELECT COUNT(*) as count FROM sessions
        WHERE ai_analysis IS NOT NULL AND ai_analysis != ''
    """, fetch_one=True)

    analyses_this_week = db.execute("""
        SELECT COUNT(*) as count FROM sessions
        WHERE ai_analysis IS NOT NULL AND ai_analysis != ''
        AND completed_at >= NOW() - INTERVAL '7 days'
    """, fetch_one=True)

    # Get total API usage
    total_api_usage = db.execute("""
        SELECT
            SUM(input_tokens) as total_input,
            SUM(output_tokens) as total_output
        FROM api_usage
    """, fetch_one=True)

    return jsonify({
        'api_usage': [
            {
                'date': str(row['date']),
                'input_tokens': row['total_input_tokens'],
                'output_tokens': row['total_output_tokens'],
                'cache_read_tokens': row['total_cache_read_tokens']
            }
            for row in api_usage
        ],
        'builder_growth': [
            {
                'date': str(row['date']),
                'new_builders': row['new_builders'],
                'total_builders': row['total_builders']
            }
            for row in builder_growth
        ],
        'daily_activity': [
            {
                'date': str(row['date']),
                'active_sessions': row['active_sessions'],
                'posts_created': row['posts_created']
            }
            for row in daily_activity
        ],
        'summary': {
            'total_builders': total_builders['count'],
            'active_today': active_today['count'],
            'total_posts': total_posts['count'],
            'posts_this_week': posts_this_week['count'],
            'total_sessions': total_sessions['count'],
            'sessions_this_week': sessions_this_week['count'],
            'total_analyses': total_analyses['count'],
            'analyses_this_week': analyses_this_week['count'],
            'total_input_tokens': total_api_usage['total_input'] or 0,
            'total_output_tokens': total_api_usage['total_output'] or 0
        }
    }), 200


@admin_bp.route('/flags', methods=['GET'])
@require_admin
def get_flagged_posts():
    """Get flagged posts"""
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    offset = (page - 1) * limit

    flagged_posts = db.execute("""
        SELECT
            p.id, p.three_word_id, p.anonymized_content, p.flag_count, p.created_at
        FROM posts p
        WHERE p.flagged = TRUE AND p.is_published = TRUE
        ORDER BY p.flag_count DESC, p.created_at DESC
        LIMIT %s OFFSET %s
    """, [limit, offset], fetch_all=True)

    # Get flags for each post
    result = []
    for post in flagged_posts:
        flags = db.execute("""
            SELECT u.id as user_id, f.reason, f.created_at
            FROM flags f
            JOIN users u ON f.user_id = u.id
            WHERE f.post_id = %s
            ORDER BY f.created_at DESC
        """, [post['id']], fetch_all=True)

        result.append({
            'id': str(post['id']),
            'three_word_id': post['three_word_id'],
            'content': post['anonymized_content'],
            'flag_count': post['flag_count'],
            'created_at': post['created_at'].isoformat(),
            'flags': [
                {
                    'user_id': str(f['user_id']),
                    'reason': f['reason'],
                    'created_at': f['created_at'].isoformat()
                }
                for f in flags
            ]
        })

    total_result = db.execute("""
        SELECT COUNT(*) as count FROM posts
        WHERE flagged = TRUE AND is_published = TRUE
    """, fetch_one=True)
    total = total_result['count']

    return jsonify({
        'flagged_posts': result,
        'total': total,
        'page': page
    }), 200


@admin_bp.route('/posts/<post_id>', methods=['DELETE'])
@require_admin
def delete_post(post_id):
    """Remove post (admin only)"""
    db.execute("""
        UPDATE posts SET is_published = FALSE WHERE id = %s
    """, [post_id], commit=True)

    return jsonify({'success': True}), 200


@admin_bp.route('/deletion-requests', methods=['GET'])
@require_admin
def get_deletion_requests():
    """Get account deletion requests"""
    status = request.args.get('status', 'pending')
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    offset = (page - 1) * limit

    requests_data = db.execute("""
        SELECT
            dr.id, dr.user_id, dr.email, dr.three_word_id, dr.reason,
            dr.status, dr.admin_notes, dr.created_at, dr.reviewed_at,
            dr.reviewed_by
        FROM deletion_requests dr
        WHERE dr.status = %s
        ORDER BY dr.created_at ASC
        LIMIT %s OFFSET %s
    """, [status, limit, offset], fetch_all=True)

    total_result = db.execute("""
        SELECT COUNT(*) as count FROM deletion_requests WHERE status = %s
    """, [status], fetch_one=True)
    total = total_result['count']

    return jsonify({
        'requests': [
            {
                'id': str(r['id']),
                'user_id': str(r['user_id']),
                'email': r['email'],
                'three_word_id': r['three_word_id'],
                'reason': r['reason'],
                'status': r['status'],
                'admin_notes': r['admin_notes'],
                'created_at': r['created_at'].isoformat() if r['created_at'] else None,
                'reviewed_at': r['reviewed_at'].isoformat() if r.get('reviewed_at') else None
            }
            for r in requests_data
        ],
        'total': total,
        'page': page
    }), 200


@admin_bp.route('/deletion-requests/<request_id>/delete-all', methods=['POST'])
@require_admin
def delete_account_with_data(request_id):
    """Approve deletion request - delete everything"""
    admin_id = request.user['id']
    data = request.get_json() or {}
    admin_notes = data.get('admin_notes', '').strip() or None

    # Get the deletion request
    req = db.execute(
        "SELECT user_id FROM deletion_requests WHERE id = %s",
        [request_id],
        fetch_one=True
    )

    if not req:
        return jsonify({'error': 'Deletion request not found'}), 404

    user_id = req['user_id']

    try:
        # Delete user (cascade will handle related data)
        db.execute("DELETE FROM users WHERE id = %s", [user_id], commit=True)

        # Update deletion request
        db.execute("""
            UPDATE deletion_requests
            SET status = 'approved_delete_all',
                admin_notes = %s,
                reviewed_by = %s,
                reviewed_at = NOW()
            WHERE id = %s
        """, [admin_notes, admin_id, request_id], commit=True)

        return jsonify({'success': True, 'message': 'Account and all data deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/deletion-requests/<request_id>/retain-data', methods=['POST'])
@require_admin
def delete_account_retain_data(request_id):
    """Approve deletion - delete account but retain anonymized posts"""
    admin_id = request.user['id']
    data = request.get_json() or {}
    admin_notes = data.get('admin_notes', '').strip() or None

    # Get the deletion request
    req = db.execute(
        "SELECT user_id FROM deletion_requests WHERE id = %s",
        [request_id],
        fetch_one=True
    )

    if not req:
        return jsonify({'error': 'Deletion request not found'}), 404

    user_id = req['user_id']

    try:
        # Anonymize user data but keep posts
        # Delete sessions and personal data
        db.execute("DELETE FROM sessions WHERE user_id = %s", [user_id], commit=False)
        db.execute("DELETE FROM applications WHERE user_id = %s", [user_id], commit=False)

        # Update posts to disconnect from user (keep three_word_id for attribution)
        db.execute("""
            UPDATE posts SET user_id = NULL WHERE user_id = %s
        """, [user_id], commit=False)

        db.execute("""
            UPDATE comments SET user_id = NULL WHERE user_id = %s
        """, [user_id], commit=False)

        # Delete the user account
        db.execute("DELETE FROM users WHERE id = %s", [user_id], commit=True)

        # Update deletion request
        db.execute("""
            UPDATE deletion_requests
            SET status = 'approved_retain_data',
                admin_notes = %s,
                reviewed_by = %s,
                reviewed_at = NOW()
            WHERE id = %s
        """, [admin_notes, admin_id, request_id], commit=True)

        return jsonify({'success': True, 'message': 'Account deleted, posts retained anonymously'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/deletion-requests/<request_id>/reject', methods=['POST'])
@require_admin
def reject_deletion_request(request_id):
    """Reject deletion request"""
    admin_id = request.user['id']
    data = request.get_json() or {}
    admin_notes = data.get('admin_notes', '').strip()

    if not admin_notes:
        return jsonify({'error': 'Rejection reason required in admin_notes'}), 400

    db.execute("""
        UPDATE deletion_requests
        SET status = 'rejected',
            admin_notes = %s,
            reviewed_by = %s,
            reviewed_at = NOW()
        WHERE id = %s
    """, [admin_notes, admin_id, request_id], commit=True)

    return jsonify({'success': True}), 200


@admin_bp.route('/search', methods=['GET'])
@require_admin
def unified_search():
    """Unified search for users and posts with lazy loading"""
    query = request.args.get('q', '').strip()
    search_type = request.args.get('type', 'all')  # all, users, posts
    user_id = request.args.get('user_id', '').strip()  # Optional: search posts by specific user
    limit = int(request.args.get('limit', 20))
    cursor = request.args.get('cursor', '')  # For lazy loading

    if not query and not user_id:
        return jsonify({'error': 'Search query or user_id required'}), 400

    results = {
        'users': [],
        'posts': [],
        'has_more_users': False,
        'has_more_posts': False,
        'next_cursor_users': None,
        'next_cursor_posts': None
    }

    # Search users (by email or three_word_id)
    if search_type in ['all', 'users'] and query:
        user_where = []
        user_params = []

        # Search pattern
        search_pattern = f'%{query}%'
        user_where.append("(u.email ILIKE %s OR u.three_word_id ILIKE %s)")
        user_params.extend([search_pattern, search_pattern])

        # Cursor-based pagination for users (based on last_active)
        if cursor and cursor.startswith('user_'):
            cursor_time = cursor.replace('user_', '')
            user_where.append("u.last_active < %s")
            user_params.append(cursor_time)

        user_where_sql = "WHERE " + " AND ".join(user_where)

        users = db.execute(f"""
            SELECT
                u.id, u.email, u.three_word_id, u.is_admin, u.created_at, u.last_active,
                (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id AND p.is_published = TRUE) as post_count,
                (SELECT COUNT(*) FROM comments c WHERE c.user_id = u.id) as comment_count,
                (SELECT COUNT(*) FROM sessions s WHERE s.user_id = u.id) as session_count,
                (SELECT status FROM applications a WHERE a.user_id = u.id ORDER BY submitted_at DESC LIMIT 1) as application_status
            FROM users u
            {user_where_sql}
            ORDER BY u.last_active DESC NULLS LAST
            LIMIT %s
        """, user_params + [limit + 1], fetch_all=True)

        # Check if there are more results
        results['has_more_users'] = len(users) > limit
        if results['has_more_users']:
            users = users[:limit]
            results['next_cursor_users'] = f"user_{users[-1]['last_active'].isoformat() if users[-1]['last_active'] else '1970-01-01T00:00:00'}"

        results['users'] = [
            {
                'id': str(u['id']),
                'email': u['email'],
                'three_word_id': u['three_word_id'],
                'is_admin': u['is_admin'],
                'created_at': u['created_at'].isoformat() if u['created_at'] else None,
                'last_active': u['last_active'].isoformat() if u['last_active'] else None,
                'post_count': u['post_count'],
                'comment_count': u['comment_count'],
                'session_count': u['session_count'],
                'application_status': u['application_status']
            }
            for u in users
        ]

    # Search posts (by content, title, or within specific user)
    if search_type in ['all', 'posts']:
        post_where = ["p.is_published = TRUE"]
        post_params = []

        # Search by content/title if query provided
        if query:
            search_pattern = f'%{query}%'
            post_where.append("(p.title ILIKE %s OR p.anonymized_content ILIKE %s)")
            post_params.extend([search_pattern, search_pattern])

        # Filter by specific user if user_id provided
        if user_id:
            post_where.append("p.user_id = %s")
            post_params.append(user_id)

        # Cursor-based pagination for posts (based on created_at)
        if cursor and cursor.startswith('post_'):
            cursor_time = cursor.replace('post_', '')
            post_where.append("p.created_at < %s")
            post_params.append(cursor_time)

        post_where_sql = "WHERE " + " AND ".join(post_where)

        posts = db.execute(f"""
            SELECT
                p.id, p.user_id, p.three_word_id, p.title, p.anonymized_content,
                p.intent, p.topics, p.created_at, p.reaction_count, p.comment_count,
                p.flag_count, p.flagged,
                u.email as user_email
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.id
            {post_where_sql}
            ORDER BY p.created_at DESC
            LIMIT %s
        """, post_params + [limit + 1], fetch_all=True)

        # Check if there are more results
        results['has_more_posts'] = len(posts) > limit
        if results['has_more_posts']:
            posts = posts[:limit]
            results['next_cursor_posts'] = f"post_{posts[-1]['created_at'].isoformat()}"

        results['posts'] = [
            {
                'id': str(p['id']),
                'user_id': str(p['user_id']) if p['user_id'] else None,
                'user_email': p['user_email'],
                'three_word_id': p['three_word_id'],
                'title': p['title'],
                'content': p['anonymized_content'][:200] + '...' if len(p['anonymized_content']) > 200 else p['anonymized_content'],
                'intent': p['intent'],
                'topics': p['topics'],
                'created_at': p['created_at'].isoformat() if p['created_at'] else None,
                'reaction_count': p['reaction_count'],
                'comment_count': p['comment_count'],
                'flag_count': p['flag_count'],
                'flagged': p['flagged']
            }
            for p in posts
        ]

    return jsonify(results), 200


@admin_bp.route('/users', methods=['GET'])
@require_admin
def get_all_users():
    """Get all users with filtering and lazy loading"""
    limit = int(request.args.get('limit', 50))
    cursor = request.args.get('cursor', '')  # last_active timestamp
    search = request.args.get('search', '').strip()
    filter_type = request.args.get('filter', 'all')  # all, verified, unverified, admins

    # Build query based on filters
    where_clauses = []
    params = []

    if search:
        where_clauses.append("(u.email ILIKE %s OR u.three_word_id ILIKE %s)")
        search_pattern = f'%{search}%'
        params.extend([search_pattern, search_pattern])

    if filter_type == 'verified':
        where_clauses.append("u.three_word_id IS NOT NULL")
    elif filter_type == 'unverified':
        where_clauses.append("u.three_word_id IS NULL")
    elif filter_type == 'admins':
        where_clauses.append("u.is_admin = TRUE")

    # Cursor-based pagination
    if cursor:
        where_clauses.append("u.last_active < %s")
        params.append(cursor)

    where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

    # Get users (fetch limit + 1 to check if there are more)
    users = db.execute(f"""
        SELECT
            u.id, u.email, u.three_word_id, u.is_admin, u.created_at, u.last_active,
            (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id AND p.is_published = TRUE) as post_count,
            (SELECT COUNT(*) FROM comments c WHERE c.user_id = u.id) as comment_count,
            (SELECT COUNT(*) FROM sessions s WHERE s.user_id = u.id) as session_count,
            (SELECT status FROM applications a WHERE a.user_id = u.id ORDER BY submitted_at DESC LIMIT 1) as application_status
        FROM users u
        {where_sql}
        ORDER BY u.last_active DESC NULLS LAST
        LIMIT %s
    """, params + [limit + 1], fetch_all=True)

    # Check if there are more results
    has_more = len(users) > limit
    if has_more:
        users = users[:limit]

    next_cursor = None
    if has_more and users:
        next_cursor = users[-1]['last_active'].isoformat() if users[-1]['last_active'] else None

    return jsonify({
        'users': [
            {
                'id': str(u['id']),
                'email': u['email'],
                'three_word_id': u['three_word_id'],
                'is_admin': u['is_admin'],
                'created_at': u['created_at'].isoformat() if u['created_at'] else None,
                'last_active': u['last_active'].isoformat() if u['last_active'] else None,
                'post_count': u['post_count'],
                'comment_count': u['comment_count'],
                'session_count': u['session_count'],
                'application_status': u['application_status']
            }
            for u in users
        ],
        'has_more': has_more,
        'next_cursor': next_cursor
    }), 200


@admin_bp.route('/users/<user_id>', methods=['GET'])
@require_admin
def get_user_details(user_id):
    """Get detailed user information with all activity"""
    # Get user info
    user = db.execute("""
        SELECT
            u.id, u.email, u.three_word_id, u.is_admin, u.created_at, u.last_active,
            u.theme_preference
        FROM users u
        WHERE u.id = %s
    """, [user_id], fetch_one=True)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Get application history
    applications = db.execute("""
        SELECT
            id, what_building, why_join, proof_url, status, rejection_reason,
            more_info_request, submitted_at, reviewed_at, admin_notes
        FROM applications
        WHERE user_id = %s
        ORDER BY submitted_at DESC
    """, [user_id], fetch_all=True)

    # Get posts
    posts = db.execute("""
        SELECT
            id, title, anonymized_content, intent, topics, created_at,
            reaction_count, comment_count, flag_count, flagged, is_published
        FROM posts
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT 100
    """, [user_id], fetch_all=True)

    # Get comments
    comments = db.execute("""
        SELECT
            c.id, c.content, c.created_at,
            p.id as post_id, p.title as post_title
        FROM comments c
        LEFT JOIN posts p ON c.post_id = p.id
        WHERE c.user_id = %s
        ORDER BY c.created_at DESC
        LIMIT 100
    """, [user_id], fetch_all=True)

    # Get sessions (private journal entries)
    sessions = db.execute("""
        SELECT
            id, intent, word_count, duration_seconds, completed_at,
            is_safe_for_sharing, recommend_professional_help
        FROM sessions
        WHERE user_id = %s
        ORDER BY completed_at DESC NULLS LAST
        LIMIT 100
    """, [user_id], fetch_all=True)

    # Get flags made by user
    flags = db.execute("""
        SELECT
            f.id, f.reason, f.created_at,
            p.id as post_id, p.title as post_title
        FROM flags f
        LEFT JOIN posts p ON f.post_id = p.id
        WHERE f.user_id = %s
        ORDER BY f.created_at DESC
    """, [user_id], fetch_all=True)

    # Get deletion requests
    deletion_requests = db.execute("""
        SELECT id, reason, status, created_at, reviewed_at, admin_notes
        FROM deletion_requests
        WHERE user_id = %s
        ORDER BY created_at DESC
    """, [user_id], fetch_all=True)

    return jsonify({
        'user': {
            'id': str(user['id']),
            'email': user['email'],
            'three_word_id': user['three_word_id'],
            'is_admin': user['is_admin'],
            'created_at': user['created_at'].isoformat() if user['created_at'] else None,
            'last_active': user['last_active'].isoformat() if user['last_active'] else None,
            'theme_preference': user['theme_preference']
        },
        'applications': [
            {
                'id': str(a['id']),
                'what_building': a['what_building'],
                'why_join': a['why_join'],
                'proof_url': a['proof_url'],
                'status': a['status'],
                'rejection_reason': a['rejection_reason'],
                'more_info_request': a['more_info_request'],
                'submitted_at': a['submitted_at'].isoformat() if a['submitted_at'] else None,
                'reviewed_at': a['reviewed_at'].isoformat() if a['reviewed_at'] else None,
                'admin_notes': a['admin_notes']
            }
            for a in applications
        ],
        'posts': [
            {
                'id': str(p['id']),
                'title': p['title'],
                'content': p['anonymized_content'][:200] + '...' if len(p['anonymized_content']) > 200 else p['anonymized_content'],
                'intent': p['intent'],
                'topics': p['topics'],
                'created_at': p['created_at'].isoformat() if p['created_at'] else None,
                'reaction_count': p['reaction_count'],
                'comment_count': p['comment_count'],
                'flag_count': p['flag_count'],
                'flagged': p['flagged'],
                'is_published': p['is_published']
            }
            for p in posts
        ],
        'comments': [
            {
                'id': str(c['id']),
                'content': c['content'][:200] + '...' if len(c['content']) > 200 else c['content'],
                'created_at': c['created_at'].isoformat() if c['created_at'] else None,
                'post_id': str(c['post_id']) if c['post_id'] else None,
                'post_title': c['post_title']
            }
            for c in comments
        ],
        'sessions': [
            {
                'id': str(s['id']),
                'intent': s['intent'],
                'word_count': s['word_count'],
                'duration_seconds': s['duration_seconds'],
                'completed_at': s['completed_at'].isoformat() if s['completed_at'] else None,
                'is_safe_for_sharing': s['is_safe_for_sharing'],
                'recommend_professional_help': s['recommend_professional_help']
            }
            for s in sessions
        ],
        'flags': [
            {
                'id': str(f['id']),
                'reason': f['reason'],
                'created_at': f['created_at'].isoformat() if f['created_at'] else None,
                'post_id': str(f['post_id']) if f['post_id'] else None,
                'post_title': f['post_title']
            }
            for f in flags
        ],
        'deletion_requests': [
            {
                'id': str(d['id']),
                'reason': d['reason'],
                'status': d['status'],
                'created_at': d['created_at'].isoformat() if d['created_at'] else None,
                'reviewed_at': d['reviewed_at'].isoformat() if d['reviewed_at'] else None,
                'admin_notes': d['admin_notes']
            }
            for d in deletion_requests
        ],
        'stats': {
            'total_posts': len(posts),
            'total_comments': len(comments),
            'total_sessions': len(sessions),
            'total_flags_made': len(flags),
            'total_applications': len(applications)
        }
    }), 200


@admin_bp.route('/comments', methods=['GET'])
@require_admin
def get_all_comments():
    """Get all comments with lazy loading and optional filtering"""
    limit = int(request.args.get('limit', 50))
    cursor = request.args.get('cursor', '')  # created_at timestamp
    user_id = request.args.get('user_id', '').strip()  # Optional: filter by user
    post_id = request.args.get('post_id', '').strip()  # Optional: filter by post
    search = request.args.get('search', '').strip()  # Optional: search in content

    where_clauses = []
    params = []

    # Filter by user
    if user_id:
        where_clauses.append("c.user_id = %s")
        params.append(user_id)

    # Filter by post
    if post_id:
        where_clauses.append("c.post_id = %s")
        params.append(post_id)

    # Search in content
    if search:
        where_clauses.append("c.content ILIKE %s")
        params.append(f'%{search}%')

    # Cursor-based pagination
    if cursor:
        where_clauses.append("c.created_at < %s")
        params.append(cursor)

    where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""

    # Get comments (fetch limit + 1 to check if there are more)
    comments = db.execute(f"""
        SELECT
            c.id, c.content, c.created_at, c.reaction_count, c.is_ai_analysis,
            c.user_id, c.three_word_id,
            p.id as post_id, p.title as post_title, p.three_word_id as post_author,
            p.created_at as post_created_at,
            u.email as user_email
        FROM comments c
        LEFT JOIN posts p ON c.post_id = p.id
        LEFT JOIN users u ON c.user_id = u.id
        {where_sql}
        ORDER BY c.created_at DESC
        LIMIT %s
    """, params + [limit + 1], fetch_all=True)

    # Check if there are more results
    has_more = len(comments) > limit
    if has_more:
        comments = comments[:limit]

    next_cursor = None
    if has_more and comments:
        next_cursor = comments[-1]['created_at'].isoformat()

    return jsonify({
        'comments': [
            {
                'id': str(c['id']),
                'content': c['content'],
                'created_at': c['created_at'].isoformat() if c['created_at'] else None,
                'reaction_count': c['reaction_count'],
                'is_ai_analysis': c['is_ai_analysis'],
                'user': {
                    'id': str(c['user_id']) if c['user_id'] else None,
                    'email': c['user_email'],
                    'three_word_id': c['three_word_id']
                },
                'post': {
                    'id': str(c['post_id']) if c['post_id'] else None,
                    'title': c['post_title'],
                    'author': c['post_author'],
                    'created_at': c['post_created_at'].isoformat() if c['post_created_at'] else None
                }
            }
            for c in comments
        ],
        'has_more': has_more,
        'next_cursor': next_cursor
    }), 200


@admin_bp.route('/users/<user_id>/comments', methods=['GET'])
@require_admin
def get_user_comments(user_id):
    """Get all comments by a specific user with lazy loading"""
    limit = int(request.args.get('limit', 50))
    cursor = request.args.get('cursor', '')  # created_at timestamp

    # Verify user exists
    user = db.execute("""
        SELECT id, email, three_word_id FROM users WHERE id = %s
    """, [user_id], fetch_one=True)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    where_clauses = ["c.user_id = %s"]
    params = [user_id]

    # Cursor-based pagination
    if cursor:
        where_clauses.append("c.created_at < %s")
        params.append(cursor)

    where_sql = "WHERE " + " AND ".join(where_clauses)

    # Get comments with post context (fetch limit + 1 to check if there are more)
    comments = db.execute(f"""
        SELECT
            c.id, c.content, c.created_at, c.reaction_count, c.is_ai_analysis,
            p.id as post_id, p.title as post_title, p.three_word_id as post_author,
            p.created_at as post_created_at
        FROM comments c
        LEFT JOIN posts p ON c.post_id = p.id
        {where_sql}
        ORDER BY c.created_at DESC
        LIMIT %s
    """, params + [limit + 1], fetch_all=True)

    # Check if there are more results
    has_more = len(comments) > limit
    if has_more:
        comments = comments[:limit]

    next_cursor = None
    if has_more and comments:
        next_cursor = comments[-1]['created_at'].isoformat()

    return jsonify({
        'user': {
            'id': str(user['id']),
            'email': user['email'],
            'three_word_id': user['three_word_id']
        },
        'comments': [
            {
                'id': str(c['id']),
                'content': c['content'],
                'created_at': c['created_at'].isoformat() if c['created_at'] else None,
                'reaction_count': c['reaction_count'],
                'is_ai_analysis': c['is_ai_analysis'],
                'post': {
                    'id': str(c['post_id']) if c['post_id'] else None,
                    'title': c['post_title'],
                    'author': c['post_author'],
                    'created_at': c['post_created_at'].isoformat() if c['post_created_at'] else None
                }
            }
            for c in comments
        ],
        'has_more': has_more,
        'next_cursor': next_cursor
    }), 200
