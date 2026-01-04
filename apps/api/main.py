"""
liquidVex API - Hyperliquid DEX Trading Interface Backend

This module provides the main FastAPI application with:
- RESTful API endpoints for exchange info, trading, and account management
- WebSocket endpoints for real-time market data streaming
- OpenAPI documentation at /docs and /redoc
- Security headers and CORS configuration
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from routers import info, trade, account, websocket
from rate_limiter import rate_limiter
from validation_middleware import ValidationMiddleware


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to all responses."""

    async def dispatch(self, request: Request, call_next):
        """Process request and add security headers to response."""
        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

        return response

app = FastAPI(
    title="liquidVex API",
    description="Backend API for liquidVex - Hyperliquid DEX Trading Interface",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Security Headers Middleware - Add security headers to all responses
app.add_middleware(SecurityHeadersMiddleware)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware to enforce rate limiting on all API endpoints."""

    async def dispatch(self, request: Request, call_next):
        """Process request and enforce rate limits."""
        # Skip rate limiting for health checks and documentation
        if request.url.path in ["/", "/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        # Get client IP
        ip = request.client.host if request.client else "unknown"

        # Check forwarded header if behind proxy
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            ip = forwarded_for.split(",")[0].strip()

        # Check rate limit
        from rate_limiter import rate_limiter
        from fastapi import HTTPException

        allowed, error_info = await rate_limiter.is_allowed(ip)

        if not allowed and error_info:
            # Return rate limit error response
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=429,
                content={
                    "error": error_info["error"],
                    "limit": error_info["limit"],
                    "window": error_info["window"],
                    "retry_after": error_info["retry_after"],
                },
                headers={
                    "Retry-After": str(error_info["retry_after"]),
                    "X-RateLimit-Limit": str(error_info["limit"]),
                    "X-RateLimit-Window": error_info["window"],
                    "X-RateLimit-Remaining": "0",
                }
            )

        # Request is allowed - proceed and add rate limit info to response headers
        response = await call_next(request)

        stats = rate_limiter.get_stats(ip)
        response.headers["X-RateLimit-Limit"] = str(stats["limit_per_minute"])
        response.headers["X-RateLimit-Remaining"] = str(stats["remaining_minute"])
        response.headers["X-RateLimit-Window"] = "1 minute"

        return response


# Rate Limiting Middleware - Prevent excessive API calls
app.add_middleware(RateLimitMiddleware)

# Input Validation Middleware - Validate requests for security issues
app.add_middleware(ValidationMiddleware)

# CORS Configuration - Allow frontend origins with proper settings
# In production, replace with specific allowed origins
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Add production origins here when deployed
    # "https://liquidvex.example.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
    ],
    expose_headers=["Content-Length", "Content-Type"],
    max_age=600,  # Cache preflight response for 10 minutes
)

# Include routers
app.include_router(info.router, prefix="/api/info", tags=["Info"])
app.include_router(trade.router, prefix="/api/trade", tags=["Trading"])
app.include_router(account.router, prefix="/api/account", tags=["Account"])
app.include_router(websocket.router, prefix="/ws", tags=["WebSocket"])


@app.get("/", tags=["Health"])
async def root() -> dict[str, str]:
    """Root endpoint - API information."""
    return {
        "name": "liquidVex API",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health() -> dict[str, str]:
    """Health check endpoint for load balancers and monitoring."""
    return {"status": "healthy"}
