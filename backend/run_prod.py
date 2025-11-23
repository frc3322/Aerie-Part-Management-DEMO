#!/usr/bin/env python3
"""Production entry point for the Part Management System backend using Gunicorn."""

import sys
from app import create_app

# Create the Flask application for production
app = create_app("production")

if __name__ == "__main__":
    # This file is meant to be run with Gunicorn, not directly
    print("This file should be run with Gunicorn. Use one of the following commands:")
    print()
    print("# Multi-worker setup (Linux/macOS only - limited Windows support)")
    print("uv run gunicorn -w 4 -b 0.0.0.0:8000 run_prod:app")
    print()
    print("# Waitress setup (RECOMMENDED for Windows - cross-platform)")
    print("uv run waitress-serve --host=0.0.0.0 --port=8000 run_prod:app")
    print()
    print("# Eventlet async setup (Linux/macOS only - NOT Windows compatible)")
    print("uv run gunicorn -k eventlet -w 1 -b 0.0.0.0:8000 run_prod:app")
    print()
    print("# Gevent async setup (Linux/macOS only - NOT Windows compatible)")
    print("uv run gunicorn -k gevent -w 4 -b 0.0.0.0:8000 run_prod:app")
    sys.exit(1)
