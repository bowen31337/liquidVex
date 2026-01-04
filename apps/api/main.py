"""
liquidVex API - Hyperliquid DEX Trading Interface Backend

This module provides the main FastAPI application with:
- RESTful API endpoints for exchange info, trading, and account management
- WebSocket endpoints for real-time market data streaming
- OpenAPI documentation at /docs and /redoc
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import info, trade, account, websocket

app = FastAPI(
    title="liquidVex API",
    description="Backend API for liquidVex - Hyperliquid DEX Trading Interface",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS Configuration - Allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
