"""Flask application configuration"""

import os
from datetime import timedelta


class Config:
    """Base configuration"""

    # Flask
    SECRET_KEY = os.environ.get('FLASK_SECRET_KEY', 'dev-secret-key-change-this')
    ENV = os.environ.get('FLASK_ENV', 'development')

    # Database
    DATABASE_URL = os.environ.get('DATABASE_URL')

    # Claude AI
    ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')

    # OpenAI (for embeddings)
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')

    # SendGrid
    SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY')

    # JWT
    JWT_SECRET = os.environ.get('JWT_SECRET', 'jwt-secret-key-change-this')
    JWT_EXPIRES_HOURS = int(os.environ.get('JWT_EXPIRES_HOURS', 720))  # 30 days

    # CORS
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

    # Session
    SESSION_COOKIE_SECURE = ENV == 'production'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(days=30)


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
