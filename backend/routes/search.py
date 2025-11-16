"""Search routes"""

from flask import Blueprint, request, jsonify
from middleware.auth_middleware import require_verified
from services.search_service import search_posts

search_bp = Blueprint('search', __name__)


@search_bp.route('', methods=['GET'])
@require_verified
def search():
    """Semantic + keyword search"""
    query = request.args.get('q', '').strip()
    topics = request.args.get('topics', '').split(',') if request.args.get('topics') else None
    limit = int(request.args.get('limit', 20))
    user_id = request.user['id']

    if not query:
        return jsonify({'error': 'Query is required'}), 400

    results = search_posts(query, user_id, topics, limit)

    return jsonify({
        'results': [
            {
                'id': str(r['id']),
                'three_word_id': r['three_word_id'],
                'title': r.get('title', ''),
                'anonymized_content': r['anonymized_content'],
                'clear_ask': r['clear_ask'],
                'intent': r.get('intent', ''),
                'topics': r['topics'],
                'reaction_count': r.get('reaction_count', 0),
                'comment_count': r.get('comment_count', 0),
                'similarity_score': float(r['similarity_score']) if r.get('similarity_score') else 0,
                'created_at': r['created_at'].isoformat() if r.get('created_at') else None
            }
            for r in results
        ],
        'total': len(results)
    }), 200
