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
