"""Stats routes for public statistics"""

from flask import Blueprint, jsonify
from services.database import db

stats_bp = Blueprint('stats', __name__)


@stats_bp.route('/live', methods=['GET'])
def get_live_stats():
    """Get live statistics (public, no auth required)"""
    stats = db.execute("""
        SELECT * FROM get_live_stats()
    """, fetch_one=True)

    return jsonify({
        'total_builders': stats['total_builders'],
        'active_today': stats['active_today'],
        'message': f"{stats['total_builders']:,} builders reflecting"
    }), 200
