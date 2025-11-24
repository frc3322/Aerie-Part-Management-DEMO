#!/usr/bin/env python3
"""Helper script to create config.json file for deployment configuration."""

import json
import os
import secrets
from typing import Dict, Any


def create_default_config() -> Dict[str, Any]:
    """Create default configuration dictionary.

    Returns:
        Dict containing default configuration values
    """
    return {
        "DATABASE_URL": "sqlite:///parts_prod.db",
        "SECRET_KEY": secrets.token_hex(32),
        "FLASK_ENV": "production",
        "CORS_ORIGINS": ["http://localhost:3000"],
        "BASE_PATH": ""
    }


def prompt_for_value(key: str, default: str, description: str) -> str:
    """Prompt user for configuration value.

    Args:
        key: Configuration key name
        default: Default value
        description: Description of what this value does

    Returns:
        str: User input or default value
    """
    print(f"\n{key}:")
    print(f"  Description: {description}")
    print(f"  Default: {default}")
    print(f"  Current: {os.environ.get(key, 'Not set')}")

    response = input("  Enter new value (or press Enter for default): ").strip()
    return response if response else default


def prompt_for_cors_origins(default: list) -> list:
    """Prompt user for CORS origins configuration.

    Args:
        default: Default CORS origins list

    Returns:
        list: CORS origins list
    """
    print(f"\nCORS_ORIGINS:")
    print(f"  Description: Comma-separated list of allowed CORS origins (e.g., https://example.com,https://app.example.com)")
    print(f"  Default: {','.join(default)}")
    print(f"  Current: {os.environ.get('CORS_ORIGINS', 'Not set')}")

    response = input("  Enter new values (comma-separated, or press Enter for default): ").strip()
    
    if not response:
        return default
    
    return [origin.strip() for origin in response.split(",") if origin.strip()]


def main():
    """Main function to create config.json file."""
    print("CONFIG HELPER: Part Management System Configuration Creator")
    print("=" * 60)

    # Load existing config if it exists
    config_path = "config.json"
    if os.path.exists(config_path):
        print(f"Existing {config_path} found. Loading current values...")
        try:
            with open(config_path, "r") as f:
                existing_config = json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Warning: Could not read existing {config_path}: {e}")
            print("Starting with defaults...")
            existing_config = {}
    else:
        print(f"No existing {config_path} found. Starting with defaults...")
        existing_config = {}

    # Get default config
    config = create_default_config()

    # Override defaults with existing config values
    config.update(existing_config)

    print("\nConfiguration Options:")
    print("-" * 30)

    # Prompt for each configuration value
    config["DATABASE_URL"] = prompt_for_value(
        "DATABASE_URL",
        config["DATABASE_URL"],
        "Database connection URL (e.g., sqlite:///parts_prod.db or postgresql://user:pass@localhost/db)"
    )

    config["SECRET_KEY"] = prompt_for_value(
        "SECRET_KEY",
        config["SECRET_KEY"],
        "Secret key for Flask sessions and security (should be random and kept secret)"
    )

    config["FLASK_ENV"] = prompt_for_value(
        "FLASK_ENV",
        config["FLASK_ENV"],
        "Flask environment (production, development)"
    )

    config["CORS_ORIGINS"] = prompt_for_cors_origins(config.get("CORS_ORIGINS", ["http://localhost:3000"]))

    config["BASE_PATH"] = prompt_for_value(
        "BASE_PATH",
        config.get("BASE_PATH", ""),
        "URL subpath for deployment (e.g., /part-management-system for Cloudflare tunnels, leave empty for root deployment)"
    )

    # Write config to file
    try:
        with open(config_path, "w") as f:
            json.dump(config, f, indent=2)

        print(f"\nSUCCESS: Configuration saved to {config_path}")
        print("\nConfiguration Summary:")
        for key, value in config.items():
            if key == "SECRET_KEY" and len(str(value)) > 10:
                print(f"  {key}: {str(value)[:10]}...")
            elif key == "CORS_ORIGINS" and isinstance(value, list):
                print(f"  {key}: {', '.join(value)}")
            else:
                print(f"  {key}: {value}")

        print(f"\nYou can now run deployment with: python deploy.py <mode>")
        print(f"Configuration will be loaded from {config_path}")

    except IOError as e:
        print(f"ERROR: Failed to write {config_path}: {e}")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
