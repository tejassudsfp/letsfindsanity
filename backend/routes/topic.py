"""Topic routes for topic browsing and following"""

from flask import Blueprint, request, jsonify
from middleware.auth_middleware import require_verified, optional_auth
from services.database import db

topic_bp = Blueprint('topic', __name__)


@topic_bp.route('', methods=['GET'])
@optional_auth
def get_all_topics():
    """Get all topics with post counts"""
    topics = db.execute("""
        SELECT
            UNNEST(topics) as topic,
            COUNT(*) as count
        FROM posts
        WHERE is_published = TRUE AND flagged = FALSE
        GROUP BY topic
        ORDER BY count DESC
    """, fetch_all=True)

    return jsonify({
        'topics': [
            {
                'name': t['topic'],
                'count': t['count']
            }
            for t in topics
        ]
    }), 200


@topic_bp.route('/following', methods=['GET'])
@require_verified
def get_following():
    """Get topics user is following"""
    user_id = request.user['id']

    topics = db.execute("""
        SELECT topic FROM topic_follows
        WHERE user_id = %s
        ORDER BY created_at DESC
    """, [user_id], fetch_all=True)

    return jsonify({
        'topics': [t['topic'] for t in topics]
    }), 200


@topic_bp.route('/follow', methods=['POST'])
@require_verified
def follow_topic():
    """Follow a topic"""
    data = request.get_json()
    topic = data.get('topic', '').strip().lower()
    user_id = request.user['id']

    if not topic:
        return jsonify({'error': 'Topic is required'}), 400

    try:
        db.execute("""
            INSERT INTO topic_follows (user_id, topic)
            VALUES (%s, %s)
            ON CONFLICT (user_id, topic) DO NOTHING
        """, [user_id, topic], commit=True)
    except Exception as e:
        return jsonify({'error': 'Failed to follow topic'}), 500

    return jsonify({'success': True}), 201


@topic_bp.route('/unfollow/<topic>', methods=['DELETE'])
@require_verified
def unfollow_topic(topic):
    """Unfollow a topic"""
    user_id = request.user['id']

    db.execute("""
        DELETE FROM topic_follows
        WHERE user_id = %s AND topic = %s
    """, [user_id, topic], commit=True)

    return jsonify({'success': True}), 200


@topic_bp.route('/<topic>/posts', methods=['GET'])
@optional_auth
def get_topic_posts(topic):
    """Get posts for a specific topic"""
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    offset = (page - 1) * limit

    posts = db.execute("""
        SELECT
            id, three_word_id, anonymized_content, clear_ask,
            intent, topics, reaction_count, comment_count, created_at
        FROM posts
        WHERE %s = ANY(topics) AND is_published = TRUE AND flagged = FALSE
        ORDER BY created_at DESC
        LIMIT %s OFFSET %s
    """, [topic, limit, offset], fetch_all=True)

    total_result = db.execute("""
        SELECT COUNT(*) as count FROM posts
        WHERE %s = ANY(topics) AND is_published = TRUE AND flagged = FALSE
    """, [topic], fetch_one=True)
    total = total_result['count']

    return jsonify({
        'posts': [
            {
                'id': str(p['id']),
                'three_word_id': p['three_word_id'],
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
        'total': total,
        'page': page,
        'pages': (total + limit - 1) // limit
    }), 200


@topic_bp.route('/connections', methods=['GET'])
@optional_auth
def get_topic_connections():
    """Get topic connections (co-occurrence in posts) for visualization"""
    scope = request.args.get('scope', 'public')  # public or personal

    if scope == 'personal':
        # Require authentication for personal connections
        if not hasattr(request, 'user') or not request.user:
            return jsonify({'error': 'Authentication required'}), 401

        user_id = request.user['id']

        # Get topic connections from user's sessions directly
        connections = db.execute("""
            WITH user_topics AS (
                SELECT DISTINCT UNNEST(s.topics) as topic, s.id as session_id
                FROM sessions s
                WHERE s.user_id = %s AND s.topics IS NOT NULL
            ),
            topic_pairs AS (
                SELECT DISTINCT
                    LEAST(t1.topic, t2.topic) as topic1,
                    GREATEST(t1.topic, t2.topic) as topic2,
                    COUNT(DISTINCT t1.session_id) as strength
                FROM user_topics t1
                JOIN user_topics t2 ON t1.session_id = t2.session_id
                WHERE t1.topic < t2.topic
                GROUP BY topic1, topic2
            )
            SELECT topic1, topic2, strength
            FROM topic_pairs
            WHERE strength > 0
            ORDER BY strength DESC
        """, [user_id], fetch_all=True)

        # Get all topics with counts for the user from sessions
        topics = db.execute("""
            SELECT
                UNNEST(s.topics) as topic,
                COUNT(*) as count
            FROM sessions s
            WHERE s.user_id = %s AND s.topics IS NOT NULL
            GROUP BY topic
            ORDER BY count DESC
        """, [user_id], fetch_all=True)
    else:
        # Public connections (only published, non-flagged posts)
        connections = db.execute("""
            WITH post_topics AS (
                SELECT DISTINCT UNNEST(topics) as topic, id as post_id
                FROM posts
                WHERE is_published = TRUE AND flagged = FALSE AND topics IS NOT NULL
            ),
            topic_pairs AS (
                SELECT DISTINCT
                    LEAST(t1.topic, t2.topic) as topic1,
                    GREATEST(t1.topic, t2.topic) as topic2,
                    COUNT(DISTINCT t1.post_id) as strength
                FROM post_topics t1
                JOIN post_topics t2 ON t1.post_id = t2.post_id
                WHERE t1.topic < t2.topic
                GROUP BY topic1, topic2
            )
            SELECT topic1, topic2, strength
            FROM topic_pairs
            WHERE strength > 0
            ORDER BY strength DESC
            LIMIT 200
        """, fetch_all=True)

        # Get all public topics with counts
        topics = db.execute("""
            SELECT
                UNNEST(topics) as topic,
                COUNT(*) as count
            FROM posts
            WHERE is_published = TRUE AND flagged = FALSE AND topics IS NOT NULL
            GROUP BY topic
            ORDER BY count DESC
        """, fetch_all=True)

    return jsonify({
        'nodes': [
            {
                'id': t['topic'],
                'label': t['topic'],
                'value': t['count']
            }
            for t in topics
        ],
        'edges': [
            {
                'from': c['topic1'],
                'to': c['topic2'],
                'value': c['strength']
            }
            for c in connections
        ]
    }), 200
