"""Flask application factory and initialization."""

import os
import logging
from flask import Flask, request
from flask_cors import CORS
from config import config
from models import db
from routes import parts_bp


def create_app(config_name: str = 'default') -> Flask:
    """Create and configure the Flask application.

    Args:
        config_name (str): Configuration name to use

    Returns:
        Flask: Configured Flask application instance
    """
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGINS'])

    # Configure logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    @app.before_request
    def log_request_info():
        """Log details of each incoming request."""
        logger.info(f"{request.method} {request.url} - {request.remote_addr}")

    # Register blueprints
    app.register_blueprint(parts_bp)

    # Create database tables
    with app.app_context():
        db.create_all()

        # Create uploads directory if it doesn't exist
        upload_folder = app.config.get('UPLOAD_FOLDER', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)

        # Initialize with sample data if in development
        if config_name == 'development':
            _init_sample_data()

    return app


def _init_sample_data():
    """Initialize database with sample data for development."""
    from models.part import Part
    from datetime import datetime, timedelta, timezone

    # Check if data already exists
    if Part.query.count() > 0:
        return

    # Sample parts data
    sample_parts = [
        {
            'type': 'cnc',
            'name': 'Drive Gear',
            'status': 'Pending',
            'notes': 'Check tooth profile',
            'file': 'gear.stl',
            'onshape_url': '#',
            'category': 'review'
        },
        {
            'type': 'cnc',
            'name': 'Mounting Bracket',
            'status': 'Approved',
            'notes': 'High precision required',
            'file': 'bracket.stl',
            'onshape_url': '#',
            'category': 'cnc',
            'assigned': 'John Doe',
            'claimed_date': datetime.now(timezone.utc) - timedelta(days=2)
        },
        {
            'type': 'hand',
            'name': 'Support Frame',
            'status': 'In Progress',
            'notes': 'Weld assembly required',
            'file': 'frame.dwg',
            'onshape_url': '#',
            'category': 'hand',
            'assigned': 'Jane Smith',
            'claimed_date': datetime.now(timezone.utc) - timedelta(days=1)
        },
        {
            'type': 'hand',
            'name': 'Control Panel',
            'status': 'Completed',
            'notes': 'Assembly completed and tested',
            'file': 'panel.dwg',
            'onshape_url': '#',
            'category': 'completed',
            'assigned': 'Bob Johnson'
        },
        {
            'type': 'cnc',
            'name': 'Precision Shaft',
            'status': 'Pending',
            'notes': 'Tight tolerances',
            'file': 'shaft.stl',
            'onshape_url': '#',
            'category': 'review',
            'subsystem': 'Drive System'
        }
    ]

    # Add sample parts to database
    for part_data in sample_parts:
        part = Part(**part_data)
        db.session.add(part)

    db.session.commit()
    print("Sample data initialized successfully")
