"""
Input Validation Middleware

Validates all incoming requests for security issues including:
- SQL injection
- XSS attacks
- Path traversal
- Request size limits
"""

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import json


class ValidationMiddleware(BaseHTTPMiddleware):
    """
    Middleware to validate all incoming requests for security issues.
    """

    async def dispatch(self, request: Request, call_next):
        """
        Process request and validate for security issues.

        Args:
            request: FastAPI Request object
            call_next: Next middleware/route handler

        Returns:
            Response or HTTPException if validation fails
        """
        # Skip validation for GET requests and health checks
        if request.method == "GET" or request.url.path in ["/", "/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        # For POST/PUT/DELETE requests, validate body
        if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
            # Read request body with limit to prevent memory exhaustion
            body = await request.body()

            # Check total payload size (1MB limit) BEFORE parsing
            if len(body) > 1_000_000:
                return JSONResponse(
                    status_code=413,
                    content={"error": "Request body too large", "max_size": "1MB"},
                )

            # Parse JSON if present
            if body:
                try:
                    body_data = json.loads(body.decode())

                    # Validate each field for security issues
                    from validators import SecurityValidator

                    for field_name, field_value in body_data.items():
                        # Skip signature validation (handled separately)
                        if field_name in ["signature", "timestamp"]:
                            continue

                        # Check for SQL injection, XSS, path traversal
                        SecurityValidator.validate_input(field_name, field_value)

                except json.JSONDecodeError:
                    # Not JSON, skip validation
                    pass
                except HTTPException as e:
                    # Validation failed, return error
                    return JSONResponse(
                        status_code=e.status_code,
                        content=e.detail,
                    )

        # Request is valid - proceed
        return await call_next(request)
