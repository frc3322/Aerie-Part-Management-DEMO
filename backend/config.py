"""Configuration settings for the Part Management System backend."""

import os


class Config:
    """Base configuration class."""

    # Flask settings
    SECRET_KEY = os.environ.get("SECRET_KEY") or "dev-secret-key-change-in-production"
    DEBUG = False
    TESTING = False

    # Database settings
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL") or "sqlite:///parts.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # CORS settings
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS") or [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    # File upload settings
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    MAX_FILE_SIZE = None  # No limit, but validate reasonable sizes
    ALLOWED_EXTENSIONS = {'step', 'stp'}


class DevelopmentConfig(Config):
    """Development configuration."""

    DEBUG = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///parts_dev.db"


class TestingConfig(Config):
    """Testing configuration."""

    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///parts_test.db"


class ProductionConfig(Config):
    """Production configuration."""

    DEBUG = False
    # In production, require environment variables to be set
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
    SECRET_KEY = os.environ.get("SECRET_KEY")

    if not SQLALCHEMY_DATABASE_URI:
        raise ValueError("DATABASE_URL environment variable must be set in production")
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY environment variable must be set in production")


# Configuration mapping
config = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
