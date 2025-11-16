"""Main Flask application"""

from flask import Flask, jsonify
from flask_cors import CORS
from config import config
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routes
from routes.auth import auth_bp
from routes.application import application_bp
from routes.identity import identity_bp
from routes.session import session_bp
from routes.post import post_bp
from routes.topic import topic_bp
from routes.search import search_bp
from routes.admin import admin_bp
from routes.stats import stats_bp
from routes.deletion import deletion_bp
from routes.export import export_bp

# Import services to initialize
from services.database import init_db_pool


def create_app(config_name=None):
    """Create and configure the Flask application"""

    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize database connection pool
    with app.app_context():
        init_db_pool()

    # Configure CORS - parse comma-separated frontend URLs from env
    frontend_urls = app.config['FRONTEND_URL'].split(',')
    allowed_origins = [url.strip() for url in frontend_urls]

    CORS(app,
         origins=allowed_origins,
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(application_bp, url_prefix='/api/application')
    app.register_blueprint(identity_bp, url_prefix='/api/identity')
    app.register_blueprint(session_bp, url_prefix='/api/sessions')
    app.register_blueprint(post_bp, url_prefix='/api/posts')
    app.register_blueprint(topic_bp, url_prefix='/api/topics')
    app.register_blueprint(search_bp, url_prefix='/api/search')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(stats_bp, url_prefix='/api/stats')
    app.register_blueprint(deletion_bp, url_prefix='/api/deletion')
    app.register_blueprint(export_bp, url_prefix='/api/export')

    # Health check endpoint
    @app.route('/health')
    def health():
        return jsonify({'status': 'healthy'}), 200

    # Root endpoint
    @app.route('/')
    def root():
        return jsonify({
            'name': 'letsfindsanity API',
            'version': '1.0',
            'status': 'running'
        }), 200

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500

    return app


# Create app instance for Gunicorn
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=app.config['DEBUG'])
