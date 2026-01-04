"""
Unit tests for validation middleware
"""

from fastapi import Request, HTTPException
from fastapi.testclient import TestClient
from validation_middleware import ValidationMiddleware
from main import app


class TestValidationMiddleware:
    """Test the validation middleware functionality"""

    async def test_valid_request(self):
        """Test that valid requests pass through"""
        middleware = ValidationMiddleware(app)
        request = Request(scope={
            "type": "http",
            "method": "GET",
            "path": "/test",
            "headers": [],
        })

        # Mock the call_next function
        async def mock_call_next(request):
            return {"status": "success"}

        response = await middleware.dispatch(request, mock_call_next)
        assert response["status"] == "success"

    async def test_request_too_large(self):
        """Test that requests with excessive body size are rejected"""
        middleware = ValidationMiddleware(app)
        request = Request(scope={
            "type": "http",
            "method": "POST",
            "path": "/test",
            "headers": [("content-length", "10000000")],  # 10MB
        })

        async def mock_call_next(request):
            return {"status": "success"}

        try:
            await middleware.dispatch(request, mock_call_next)
            assert False, "Should have raised HTTPException"
        except HTTPException as e:
            assert e.status_code == 413
            assert "Request body too large" in str(e.detail)

    async def test_malformed_json(self):
        """Test that requests with malformed JSON are rejected"""
        middleware = ValidationMiddleware(app)
        request = Request(scope={
            "type": "http",
            "method": "POST",
            "path": "/test",
            "headers": [("content-type", "application/json")],
        })

        # Mock request body with invalid JSON
        request._body = b'{"invalid": json}'

        async def mock_call_next(request):
            return {"status": "success"}

        try:
            await middleware.dispatch(request, mock_call_next)
            assert False, "Should have raised HTTPException"
        except HTTPException as e:
            assert e.status_code == 400
            assert "Invalid JSON" in str(e.detail)

    async def test_xss_attempt(self):
        """Test that XSS attempts are detected and blocked"""
        middleware = ValidationMiddleware(app)
        request = Request(scope={
            "type": "http",
            "method": "GET",
            "path": "/test",
            "query_string": b"param=<script>alert('xss')</script>",
            "headers": [],
        })

        async def mock_call_next(request):
            return {"status": "success"}

        try:
            await middleware.dispatch(request, mock_call_next)
            assert False, "Should have raised HTTPException"
        except HTTPException as e:
            assert e.status_code == 400
            assert "Potential XSS attack" in str(e.detail)

    async def test_sql_injection_attempt(self):
        """Test that SQL injection attempts are detected and blocked"""
        middleware = ValidationMiddleware(app)
        request = Request(scope={
            "type": "http",
            "method": "GET",
            "path": "/test",
            "query_string": b"param=1'; DROP TABLE users; --",
            "headers": [],
        })

        async def mock_call_next(request):
            return {"status": "success"}

        try:
            await middleware.dispatch(request, mock_call_next)
            assert False, "Should have raised HTTPException"
        except HTTPException as e:
            assert e.status_code == 400
            assert "Potential SQL injection" in str(e.detail)

    async def test_command_injection_attempt(self):
        """Test that command injection attempts are detected and blocked"""
        middleware = ValidationMiddleware(app)
        request = Request(scope={
            "type": "http",
            "method": "GET",
            "path": "/test",
            "query_string": b"param=; rm -rf /",
            "headers": [],
        })

        async def mock_call_next(request):
            return {"status": "success"}

        try:
            await middleware.dispatch(request, mock_call_next)
            assert False, "Should have raised HTTPException"
        except HTTPException as e:
            assert e.status_code == 400
            assert "Potential command injection" in str(e.detail)

    async def test_path_traversal_attempt(self):
        """Test that path traversal attempts are detected and blocked"""
        middleware = ValidationMiddleware(app)
        request = Request(scope={
            "type": "http",
            "method": "GET",
            "path": "/test/../../../etc/passwd",
            "headers": [],
        })

        async def mock_call_next(request):
            return {"status": "success"}

        try:
            await middleware.dispatch(request, mock_call_next)
            assert False, "Should have raised HTTPException"
        except HTTPException as e:
            assert e.status_code == 400
            assert "Potential path traversal" in str(e.detail)

    async def test_content_type_validation(self):
        """Test that invalid content types are rejected"""
        middleware = ValidationMiddleware(app)
        request = Request(scope={
            "type": "http",
            "method": "POST",
            "path": "/test",
            "headers": [("content-type", "application/x-www-form-urlencoded")],  # Non-JSON content type
        })

        async def mock_call_next(request):
            return {"status": "success"}

        response = await middleware.dispatch(request, mock_call_next)
        assert response["status"] == "success"  # Should pass for non-JSON content types

    async def test_empty_request_body(self):
        """Test that empty request bodies are handled correctly"""
        middleware = ValidationMiddleware(app)
        request = Request(scope={
            "type": "http",
            "method": "POST",
            "path": "/test",
            "headers": [("content-type", "application/json")],
        })

        request._body = b''  # Empty body

        async def mock_call_next(request):
            return {"status": "success"}

        response = await middleware.dispatch(request, mock_call_next)
        assert response["status"] == "success"

    async def test_multiple_validation_failures(self):
        """Test that multiple validation failures are handled correctly"""
        middleware = ValidationMiddleware(app)
        request = Request(scope={
            "type": "http",
            "method": "GET",
            "path": "/test",
            "query_string": b"param=<script>alert('xss')</script>¶m2=1'; DROP TABLE users; --",
            "headers": [],
        })

        async def mock_call_next(request):
            return {"status": "success"}

        try:
            await middleware.dispatch(request, mock_call_next)
            assert False, "Should have raised HTTPException"
        except HTTPException as e:
            assert e.status_code == 400
            # Should detect the first security issue found
            assert any(issue in str(e.detail) for issue in ["XSS", "SQL injection"])