"""Post routes for community feed and interactions"""

from flask import Blueprint, request, jsonify
from middleware.auth_middleware import require_verified, optional_auth
from services.database import db

post_bp = Blueprint('post', __name__)


@post_bp.route('', methods=['GET'])
@optional_auth
def get_feed():
    """Get feed with optional filters"""
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    offset = (page - 1) * limit

    intent = request.args.get('intent')
    topics = request.args.get('topics', '').split(',') if request.args.get('topics') else None

    # Build query
    query = """
        SELECT
            p.id, p.three_word_id, p.anonymized_content, p.clear_ask, p.title,
            p.intent, p.topics, p.reaction_count, p.comment_count, p.created_at
        FROM posts p
        WHERE p.is_published = TRUE AND p.flagged = FALSE
    """
    params = []

    if intent:
        query += " AND p.intent = %s"
        params.append(intent)

    if topics:
        query += " AND p.topics && %s"
        params.append(topics)

    query += " ORDER BY p.created_at DESC LIMIT %s OFFSET %s"
    params.extend([limit, offset])

    posts = db.execute(query, params, fetch_all=True)

    # Check user reactions if authenticated
    user_reactions = {}
    if request.user:
        for post in posts:
            reaction = db.execute("""
                SELECT reaction_type FROM reactions
                WHERE post_id = %s AND user_id = %s
            """, [post['id'], request.user['id']], fetch_one=True)
            user_reactions[str(post['id'])] = reaction['reaction_type'] if reaction else None

    # Get total count
    count_query = "SELECT COUNT(*) as count FROM posts WHERE is_published = TRUE AND flagged = FALSE"
    count_params = []
    if intent:
        count_query += " AND intent = %s"
        count_params.append(intent)
    if topics:
        count_query += " AND topics && %s"
        count_params.append(topics)

    total_result = db.execute(count_query, count_params, fetch_one=True)
    total = total_result['count']

    return jsonify({
        'posts': [
            {
                'id': str(p['id']),
                'three_word_id': p['three_word_id'],
                'title': p.get('title', ''),
                'anonymized_content': p['anonymized_content'],
                'clear_ask': p['clear_ask'],
                'intent': p['intent'],
                'topics': p['topics'],
                'reaction_count': p['reaction_count'],
                'comment_count': p['comment_count'],
                'created_at': p['created_at'].isoformat(),
                'user_reacted': user_reactions.get(str(p['id']))
            }
            for p in posts
        ],
        'total': total,
        'page': page,
        'pages': (total + limit - 1) // limit
    }), 200


@post_bp.route('/<post_id>', methods=['GET', 'DELETE'])
@optional_auth
def get_post(post_id):
    """Get single post with comments or delete post"""
    if request.method == 'DELETE':
        # Verify user is authenticated
        if not request.user:
            return jsonify({'error': 'Authentication required'}), 401

        # Check if user owns the post
        post_check = db.execute("""
            SELECT user_id FROM posts WHERE id = %s
        """, [post_id], fetch_one=True)

        if not post_check:
            return jsonify({'error': 'Post not found'}), 404

        if str(post_check['user_id']) != str(request.user['id']):
            return jsonify({'error': 'Unauthorized'}), 403

        # Delete the post (comments, reactions, flags will cascade)
        db.execute("""
            DELETE FROM posts WHERE id = %s
        """, [post_id], commit=True)

        return jsonify({'success': True}), 200

    # GET request - existing logic
    post = db.execute("""
        SELECT
            id, three_word_id, anonymized_content, clear_ask, title,
            intent, topics, reaction_count, comment_count, created_at
        FROM posts
        WHERE id = %s AND is_published = TRUE
    """, [post_id], fetch_one=True)

    if not post:
        return jsonify({'error': 'Post not found'}), 404

    # Get comments
    comments = db.execute("""
        SELECT id, three_word_id, content, created_at
        FROM comments
        WHERE post_id = %s
        ORDER BY created_at ASC
    """, [post_id], fetch_all=True)

    # Check user reaction if authenticated
    user_reaction = None
    is_author = False
    reaction_breakdown = None

    if request.user:
        reaction = db.execute("""
            SELECT reaction_type FROM reactions
            WHERE post_id = %s AND user_id = %s
        """, [post_id, request.user['id']], fetch_one=True)
        user_reaction = reaction['reaction_type'] if reaction else None

        # Check if user is the author
        author_check = db.execute("""
            SELECT p.user_id FROM posts p WHERE p.id = %s
        """, [post_id], fetch_one=True)

        if author_check and str(author_check['user_id']) == str(request.user['id']):
            is_author = True
            # Get reaction breakdown for author
            breakdown = db.execute("""
                SELECT reaction_type, COUNT(*) as count
                FROM reactions
                WHERE post_id = %s
                GROUP BY reaction_type
            """, [post_id], fetch_all=True)

            reaction_breakdown = {r['reaction_type']: r['count'] for r in breakdown} if breakdown else {}

    return jsonify({
        'post': {
            'id': str(post['id']),
            'three_word_id': post['three_word_id'],
            'title': post.get('title', ''),
            'anonymized_content': post['anonymized_content'],
            'clear_ask': post['clear_ask'],
            'intent': post['intent'],
            'topics': post['topics'],
            'reaction_count': post['reaction_count'],
            'comment_count': post['comment_count'],
            'created_at': post['created_at'].isoformat(),
            'user_reacted': user_reaction,
            'is_author': is_author,
            'reaction_breakdown': reaction_breakdown
        },
        'comments': [
            {
                'id': str(c['id']),
                'three_word_id': c['three_word_id'],
                'content': c['content'],
                'created_at': c['created_at'].isoformat(),
                'is_ai_analysis': c.get('is_ai_analysis', False)
            }
            for c in comments
        ]
    }), 200


@post_bp.route('/by-identity/<three_word_id>', methods=['GET'])
@optional_auth
def get_posts_by_identity(three_word_id):
    """Get posts by three-word identity"""
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    offset = (page - 1) * limit

    posts = db.execute("""
        SELECT
            id, three_word_id, anonymized_content, clear_ask, title,
            intent, topics, reaction_count, comment_count, created_at
        FROM posts
        WHERE three_word_id = %s AND is_published = TRUE AND flagged = FALSE
        ORDER BY created_at DESC
        LIMIT %s OFFSET %s
    """, [three_word_id, limit, offset], fetch_all=True)

    total_result = db.execute("""
        SELECT COUNT(*) as count FROM posts
        WHERE three_word_id = %s AND is_published = TRUE AND flagged = FALSE
    """, [three_word_id], fetch_one=True)
    total = total_result['count']

    return jsonify({
        'posts': [
            {
                'id': str(p['id']),
                'three_word_id': p['three_word_id'],
                'title': p.get('title', ''),
                'anonymized_content': p['anonymized_content'],
                'clear_ask': p['clear_ask'],
                'intent': p['intent'],
                'topics': p['topics'],
                'reaction_count': p['reaction_count'],
                'comment_count': p['comment_count'],
                'created_at': p['created_at'].isoformat()
            }
            for p in posts
        ],
        'total': total
    }), 200


@post_bp.route('/<post_id>/react', methods=['POST'])
@require_verified
def add_reaction(post_id):
    """Add reaction to post"""
    data = request.get_json()
    reaction_type = data.get('reaction_type')
    user_id = request.user['id']

    valid_reactions = ['felt-this', 'you-got-this', 'been-there', 'this-helped']
    if reaction_type not in valid_reactions:
        return jsonify({'error': 'Invalid reaction type'}), 400

    # Check if post exists
    post = db.execute("""
        SELECT id FROM posts WHERE id = %s AND is_published = TRUE
    """, [post_id], fetch_one=True)

    if not post:
        return jsonify({'error': 'Post not found'}), 404

    # Add or update reaction
    try:
        db.execute("""
            INSERT INTO reactions (post_id, user_id, reaction_type)
            VALUES (%s, %s, %s)
            ON CONFLICT (post_id, user_id, reaction_type) DO NOTHING
        """, [post_id, user_id, reaction_type], commit=True)
    except Exception as e:
        return jsonify({'error': 'Failed to add reaction'}), 500

    return jsonify({'success': True}), 201


@post_bp.route('/<post_id>/react/<reaction_type>', methods=['DELETE'])
@require_verified
def remove_reaction(post_id, reaction_type):
    """Remove reaction from post"""
    user_id = request.user['id']

    db.execute("""
        DELETE FROM reactions
        WHERE post_id = %s AND user_id = %s AND reaction_type = %s
    """, [post_id, user_id, reaction_type], commit=True)

    return jsonify({'success': True}), 200


@post_bp.route('/<post_id>/comment', methods=['POST'])
@require_verified
def add_comment(post_id):
    """Add comment to post with moderation"""
    from services.moderation_service import moderate_comment

    data = request.get_json()
    content = data.get('content', '').strip()
    user_id = request.user['id']
    three_word_id = request.user['three_word_id']

    if not content:
        return jsonify({'error': 'Comment content is required'}), 400

    # Check if user is blocked from commenting
    blocked = db.execute("""
        SELECT id FROM blocked_users WHERE user_id = %s
    """, [user_id], fetch_one=True)

    if blocked:
        return jsonify({
            'error': 'You have been blocked from commenting due to repeated violations.',
            'blocked': True
        }), 403

    # Check if post exists
    post = db.execute("""
        SELECT id FROM posts WHERE id = %s AND is_published = TRUE
    """, [post_id], fetch_one=True)

    if not post:
        return jsonify({'error': 'Post not found'}), 404

    # Moderate comment with Haiku
    moderation = moderate_comment(content)

    if not moderation['approved']:
        # Log the flagged comment
        db.execute("""
            INSERT INTO comment_flags (user_id, comment_content, flag_reason, severity)
            VALUES (%s, %s, %s, %s)
        """, [user_id, content, moderation['reason'], moderation.get('severity', 'medium')], commit=True)

        # Check how many times this user has been flagged
        flag_count = db.execute("""
            SELECT COUNT(*) as count FROM comment_flags
            WHERE user_id = %s AND created_at > NOW() - INTERVAL '30 days'
        """, [user_id], fetch_one=True)

        # Block user after 3 flagged attempts
        if flag_count['count'] >= 3:
            db.execute("""
                INSERT INTO blocked_users (user_id, reason)
                VALUES (%s, %s)
                ON CONFLICT (user_id) DO NOTHING
            """, [user_id, 'Repeated comment violations'], commit=True)

            return jsonify({
                'error': 'Your comment was flagged and you have been blocked from commenting due to repeated violations.',
                'blocked': True,
                'moderation': moderation
            }), 403

        # Return moderation feedback
        return jsonify({
            'error': 'Comment not approved',
            'flagged': True,
            'moderation': moderation,
            'flags_remaining': 3 - flag_count['count']
        }), 400

    # Create comment (approved by moderation)
    comment = db.execute("""
        INSERT INTO comments (post_id, user_id, three_word_id, content)
        VALUES (%s, %s, %s, %s)
        RETURNING id, three_word_id, content, created_at
    """, [post_id, user_id, three_word_id, content], commit=True)

    return jsonify({
        'success': True,
        'comment': {
            'id': str(comment['id']),
            'three_word_id': comment['three_word_id'],
            'content': comment['content'],
            'created_at': comment['created_at'].isoformat()
        }
    }), 201


@post_bp.route('/<post_id>/flag', methods=['POST'])
@require_verified
def flag_post(post_id):
    """Flag post for review"""
    data = request.get_json()
    reason = data.get('reason', '').strip()
    user_id = request.user['id']

    if not reason:
        return jsonify({'error': 'Reason is required'}), 400

    # Check if post exists
    post = db.execute("""
        SELECT id FROM posts WHERE id = %s AND is_published = TRUE
    """, [post_id], fetch_one=True)

    if not post:
        return jsonify({'error': 'Post not found'}), 404

    # Add flag
    try:
        db.execute("""
            INSERT INTO flags (post_id, user_id, reason)
            VALUES (%s, %s, %s)
            ON CONFLICT (post_id, user_id) DO UPDATE SET reason = EXCLUDED.reason
        """, [post_id, user_id, reason], commit=True)
    except Exception as e:
        return jsonify({'error': 'Failed to flag post'}), 500

    return jsonify({'success': True}), 201


@post_bp.route('/mine', methods=['GET'])
@require_verified
def get_my_posts():
    """Get all public posts created by the authenticated user"""
    user_id = request.user['id']
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    offset = (page - 1) * limit

    # Get user's public posts with optional session link
    posts = db.execute("""
        SELECT
            p.id, p.three_word_id, p.title, p.anonymized_content, p.clear_ask,
            p.intent, p.topics, p.reaction_count, p.comment_count, p.created_at,
            p.session_id, p.is_published
        FROM posts p
        WHERE p.user_id = %s
        ORDER BY p.created_at DESC
        LIMIT %s OFFSET %s
    """, [user_id, limit, offset], fetch_all=True)

    # Get reaction breakdown for each post
    posts_with_stats = []
    for post in posts:
        breakdown = db.execute("""
            SELECT reaction_type, COUNT(*) as count
            FROM reactions
            WHERE post_id = %s
            GROUP BY reaction_type
        """, [post['id']], fetch_all=True)

        reaction_breakdown = {r['reaction_type']: r['count'] for r in breakdown} if breakdown else {}

        # Check if session still exists
        session_exists = False
        if post['session_id']:
            session_check = db.execute("""
                SELECT id FROM sessions WHERE id = %s
            """, [post['session_id']], fetch_one=True)
            session_exists = bool(session_check)

        posts_with_stats.append({
            'id': str(post['id']),
            'three_word_id': post['three_word_id'],
            'title': post.get('title', ''),
            'anonymized_content': post['anonymized_content'],
            'clear_ask': post['clear_ask'],
            'intent': post['intent'],
            'topics': post['topics'],
            'reaction_count': post['reaction_count'],
            'comment_count': post['comment_count'],
            'created_at': post['created_at'].isoformat(),
            'is_published': post['is_published'],
            'session_id': str(post['session_id']) if post['session_id'] else None,
            'session_exists': session_exists,
            'reaction_breakdown': reaction_breakdown
        })

    # Get total count
    total_result = db.execute("""
        SELECT COUNT(*) as count FROM posts WHERE user_id = %s
    """, [user_id], fetch_one=True)
    total = total_result['count']

    return jsonify({
        'posts': posts_with_stats,
        'total': total,
        'page': page,
        'pages': (total + limit - 1) // limit
    }), 200
