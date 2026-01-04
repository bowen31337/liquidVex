"""
Unit tests for configuration module
"""

import os
import pytest
from unittest.mock import patch
from config import settings, validate_environment, print_environment_info


class TestSettings:
    """Test the Settings configuration class"""

    def test_default_settings(self):
        """Test that default settings are properly loaded"""
        assert settings.host == "0.0.0.0"
        assert settings.port == 8001
        assert settings.debug is False
        assert settings.log_level == "info"
        assert settings.rate_limit_requests_per_minute == 60
        assert settings.rate_limit_window_minutes == 1

    def test_cors_origins_parsing(self):
        """Test that CORS origins are properly parsed"""
        origins = settings.cors_origins
        assert len(origins) == 6
        assert "http://localhost:3000" in origins
        assert "http://localhost:3002" in origins

    def test_environment_detection(self):
        """Test environment detection methods"""
        assert settings.is_development is True  # Based on debug being False and no ENVIRONMENT var
        assert settings.is_production is False

    def test_hyperliquid_urls(self):
        """Test that Hyperliquid URLs are properly configured"""
        assert settings.hyperliquid_api_url == "https://api.hyperliquid.xyz"
        assert settings.hyperliquid_ws_url == "wss://api.hyperliquid.xyz/ws"


class TestEnvironmentValidation:
    """Test environment validation functionality"""

    def test_valid_environment(self):
        """Test validation of valid environment"""
        issues = validate_environment()
        assert len(issues) == 0

    def test_production_missing_jwt_secret(self):
        """Test validation fails when JWT secret is missing in production"""
        with patch.dict(os.environ, {'ENVIRONMENT': 'production'}):
            issues = validate_environment()
            assert any('JWT_SECRET' in issue for issue in issues)

    def test_production_debug_enabled(self):
        """Test validation fails when debug is enabled in production"""
        with patch.object(settings, 'debug', True):
            with patch.dict(os.environ, {'ENVIRONMENT': 'production'}):
                issues = validate_environment()
                assert any('DEBUG should be False' in issue for issue in issues)

    def test_invalid_port_range(self):
        """Test validation fails for invalid port range"""
        with patch.object(settings, 'port', 70000):
            issues = validate_environment()
            assert any('Port must be between 1 and 65535' in issue for issue in issues)

    def test_invalid_log_level(self):
        """Test validation fails for invalid log level"""
        with patch.object(settings, 'log_level', 'invalid'):
            issues = validate_environment()
            assert any('Invalid log level' in issue for issue in issues)

    def test_invalid_rate_limit(self):
        """Test validation fails for invalid rate limit settings"""
        with patch.object(settings, 'rate_limit_requests_per_minute', -1):
            issues = validate_environment()
            assert any('Rate limit must be positive' in issue for issue in issues)

        with patch.object(settings, 'rate_limit_window_minutes', 0):
            issues = validate_environment()
            assert any('Rate limit window must be positive' in issue for issue in issues)


class TestEnvironmentInfo:
    """Test environment info printing functionality"""

    def test_print_environment_info(self, capsys):
        """Test that environment info is printed correctly"""
        print_environment_info()
        captured = capsys.readouterr()
        assert "Environment Configuration" in captured.out
        assert "Environment:" in captured.out
        assert "Debug Mode:" in captured.out
        assert "Host:" in captured.out
        assert "Port:" in captured.out
        assert "Log Level:" in captured.out
        assert "Allowed Origins:" in captured.out
        assert "Rate Limit:" in captured.out
        assert "End Configuration" in captured.out