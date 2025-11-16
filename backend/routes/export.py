"""Export routes for journal data"""

from flask import Blueprint, request, jsonify
from middleware.auth_middleware import require_verified
from services.database import db
import json
from datetime import datetime

export_bp = Blueprint('export', __name__)


@export_bp.route('/journal', methods=['GET'])
@require_verified
def export_journal():
    """Export all user's journal entries with AI analysis and comments"""
    user_id = request.user['id']

    # Get all user sessions
    sessions = db.execute("""
        SELECT
            s.id, s.original_content, s.analyzed_content, s.clear_ask,
            s.title, s.intent, s.topics, s.created_at, s.updated_at,
            s.is_analyzed, s.shared_as_post
        FROM sessions s
        WHERE s.user_id = %s
        ORDER BY s.created_at DESC
    """, [user_id], fetch_all=True)

    export_data = []

    for session in sessions:
        session_data = {
            'id': str(session['id']),
            'title': session.get('title', ''),
            'original_content': session['original_content'],
            'analyzed_content': session.get('analyzed_content'),
            'clear_ask': session.get('clear_ask'),
            'intent': session.get('intent'),
            'topics': session.get('topics', []),
            'created_at': session['created_at'].isoformat() if session.get('created_at') else None,
            'updated_at': session['updated_at'].isoformat() if session.get('updated_at') else None,
            'is_analyzed': session.get('is_analyzed', False),
            'shared_as_post': session.get('shared_as_post', False),
            'comments': []
        }

        # Get AI analysis comment if session was shared as a post
        if session['shared_as_post']:
            post = db.execute("""
                SELECT id FROM posts WHERE session_id = %s
            """, [session['id']], fetch_one=True)

            if post:
                # Get all comments on this post
                comments = db.execute("""
                    SELECT
                        c.id, c.content, c.created_at,
                        c.is_ai_analysis,
                        u.three_word_id
                    FROM comments c
                    LEFT JOIN users u ON c.user_id = u.id
                    WHERE c.post_id = %s
                    ORDER BY c.created_at ASC
                """, [post['id']], fetch_all=True)

                session_data['comments'] = [
                    {
                        'id': str(c['id']),
                        'content': c['content'],
                        'is_ai_analysis': c.get('is_ai_analysis', False),
                        'author': 'AI Analysis' if c.get('is_ai_analysis') else (c.get('three_word_id') or 'Anonymous'),
                        'created_at': c['created_at'].isoformat() if c.get('created_at') else None
                    }
                    for c in comments
                ]

        export_data.append(session_data)

    # Create export metadata
    user = db.execute("SELECT email, three_word_id FROM users WHERE id = %s", [user_id], fetch_one=True)

    result = {
        'export_date': datetime.utcnow().isoformat(),
        'user': {
            'email': user['email'] if user else None,
            'three_word_id': user.get('three_word_id') if user else None
        },
        'total_entries': len(export_data),
        'entries': export_data
    }

    return jsonify(result), 200
