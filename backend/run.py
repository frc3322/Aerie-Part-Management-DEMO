#!/usr/bin/env python3
"""Main entry point for the Part Management System backend."""

import os
from app import create_app # type: ignore

app = create_app(os.getenv('FLASK_ENV', 'development'))

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=False  # Always production mode
    )
