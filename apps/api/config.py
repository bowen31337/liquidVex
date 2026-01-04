"""
Environment configuration management for the liquidVex API.

This module provides centralized configuration management with:
- Environment variable loading from .env files
- Configuration validation and defaults
- Type-safe configuration access
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    Uses Pydantic's BaseSettings for automatic environment variable loading
    and type conversion with validation.
    """

    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8001
    debug: bool = False
    log_level: str = "info"

    # CORS Configuration
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:3002,http://127.0.0.1:3002"

    # Rate Limiting
    rate_limit_requests_per_minute: int = 60
    rate_limit_window_minutes: int = 1

    # Security
    api_key: Optional[str] = None
    jwt_secret: Optional[str] = None
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 1440  # 24 hours

    # Hyperliquid Configuration
    hyperliquid_api_url: str = "https://api.hyperliquid.xyz"
    hyperliquid_ws_url: str = "wss://api.hyperliquid.xyz/ws"
    hyperliquid_testnet_api_url: str = "https://api.hyperliquid.xyz"
    hyperliquid_testnet_ws_url: str = "wss://api.hyperliquid.xyz/ws"

    # Database (if needed in future)
    database_url: Optional[str] = None

    # Redis (if needed for caching)
    redis_url: Optional[str] = None

    # Application paths
    docs_url: str = "/docs"
    redoc_url: str = "/redoc"
    openapi_url: str = "/openapi.json"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"  # Ignore extra environment variables
    )

    @property
    def cors_origins(self) -> list[str]:
        """Parse allowed_origins string into a list."""
        if not self.allowed_origins:
            return []
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.debug or os.getenv("ENVIRONMENT", "").lower() == "development"

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return not self.is_development


# Global settings instance
settings = Settings()


def validate_environment() -> list[str]:
    """
    Validate environment configuration and return list of issues.

    Returns:
        list[str]: List of validation errors/warnings
    """
    issues = []

    # Check required environment variables
    if settings.is_production:
        if not settings.jwt_secret:
            issues.append("JWT_SECRET is required in production")

        if settings.debug:
            issues.append("DEBUG should be False in production")

    # Validate URLs
    if settings.host not in ["0.0.0.0", "127.0.0.1", "localhost"]:
        if not settings.host.startswith(("http://", "https://")):
            issues.append(f"Invalid host format: {settings.host}")

    # Validate port range
    if not (1 <= settings.port <= 65535):
        issues.append(f"Port must be between 1 and 65535, got: {settings.port}")

    # Validate log level
    valid_log_levels = ["debug", "info", "warning", "error", "critical"]
    if settings.log_level.lower() not in valid_log_levels:
        issues.append(f"Invalid log level: {settings.log_level}")

    # Validate rate limiting
    if settings.rate_limit_requests_per_minute <= 0:
        issues.append("Rate limit must be positive")

    if settings.rate_limit_window_minutes <= 0:
        issues.append("Rate limit window must be positive")

    return issues


def print_environment_info():
    """Print current environment configuration for debugging."""
    print("=== Environment Configuration ===")
    print(f"Environment: {'development' if settings.is_development else 'production'}")
    print(f"Debug Mode: {settings.debug}")
    print(f"Host: {settings.host}")
    print(f"Port: {settings.port}")
    print(f"Log Level: {settings.log_level}")
    print(f"Allowed Origins: {settings.cors_origins}")
    print(f"Rate Limit: {settings.rate_limit_requests_per_minute}/min")
    print("=== End Configuration ===")