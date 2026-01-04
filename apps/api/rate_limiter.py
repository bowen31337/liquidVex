"""
Rate Limiter Module

Implements in-memory rate limiting for API endpoints to prevent excessive API calls.
Uses a sliding window algorithm with IP-based tracking.
"""

from collections import defaultdict
from datetime import datetime, timedelta
from fastapi import Request, HTTPException
from typing import Dict, Tuple
import asyncio


class RateLimiter:
    """
    In-memory rate limiter using sliding window algorithm.

    Tracks requests per IP address with configurable limits and time windows.
    """

    def __init__(self, requests_per_minute: int = 60, requests_per_second: int = 10):
        """
        Initialize rate limiter.

        Args:
            requests_per_minute: Maximum requests per minute per IP
            requests_per_second: Maximum requests per second per IP (burst protection)
        """
        self.requests_per_minute = requests_per_minute
        self.requests_per_second = requests_per_second

        # Storage for request timestamps per IP: {ip: [timestamp1, timestamp2, ...]}
        self._requests: Dict[str, list[float]] = defaultdict(list)

        # Storage for burst requests per IP: {ip: [timestamp1, timestamp2, ...]}
        self._burst_requests: Dict[str, list[float]] = defaultdict(list)

        # Lock for thread-safe operations
        self._lock = asyncio.Lock()

    async def is_allowed(self, ip: str) -> Tuple[bool, dict | None]:
        """
        Check if a request from the given IP is allowed.

        Args:
            ip: Client IP address

        Returns:
            Tuple of (is_allowed, error_info_dict)
        """
        async with self._lock:
            now = datetime.now().timestamp()

            # Clean old requests (older than 1 minute)
            cutoff_minute = now - 60
            self._requests[ip] = [
                ts for ts in self._requests[ip] if ts > cutoff_minute
            ]

            # Clean old burst requests (older than 1 second)
            cutoff_second = now - 1
            self._burst_requests[ip] = [
                ts for ts in self._burst_requests[ip] if ts > cutoff_second
            ]

            # Check rate limits
            minute_count = len(self._requests[ip])
            second_count = len(self._burst_requests[ip])

            # Check per-second limit (burst protection)
            if second_count >= self.requests_per_second:
                retry_after = 1  # Retry after 1 second
                return False, {
                    "error": "Rate limit exceeded",
                    "limit": self.requests_per_second,
                    "window": "1 second",
                    "retry_after": retry_after,
                }

            # Check per-minute limit
            if minute_count >= self.requests_per_minute:
                # Calculate retry_after based on oldest request
                oldest_request = min(self._requests[ip])
                retry_after = int(60 - (now - oldest_request)) + 1
                return False, {
                    "error": "Rate limit exceeded",
                    "limit": self.requests_per_minute,
                    "window": "1 minute",
                    "retry_after": retry_after,
                }

            # Request is allowed - record it
            self._requests[ip].append(now)
            self._burst_requests[ip].append(now)

            return True, None

    def get_stats(self, ip: str) -> dict:
        """
        Get rate limit statistics for an IP.

        Args:
            ip: Client IP address

        Returns:
            Dictionary with rate limit stats
        """
        now = datetime.now().timestamp()

        # Clean old requests first
        cutoff_minute = now - 60
        cutoff_second = now - 1

        minute_requests = [ts for ts in self._requests.get(ip, []) if ts > cutoff_minute]
        second_requests = [ts for ts in self._burst_requests.get(ip, []) if ts > cutoff_second]

        return {
            "ip": ip,
            "requests_last_minute": len(minute_requests),
            "requests_last_second": len(second_requests),
            "limit_per_minute": self.requests_per_minute,
            "limit_per_second": self.requests_per_second,
            "remaining_minute": max(0, self.requests_per_minute - len(minute_requests)),
            "remaining_second": max(0, self.requests_per_second - len(second_requests)),
        }


# Global rate limiter instance
# Customize limits as needed:
# - Default: 60 requests/minute, 10 requests/second
# - Stricter: 30 requests/minute, 5 requests/second
# - Lenient: 120 requests/minute, 20 requests/second
rate_limiter = RateLimiter(requests_per_minute=60, requests_per_second=10)


async def check_rate_limit(request: Request) -> None:
    """
    FastAPI dependency to check rate limits.

    Raises HTTPException if rate limit is exceeded.

    Args:
        request: FastAPI Request object

    Raises:
        HTTPException: 429 Too Many Requests if rate limit exceeded
    """
    # Get client IP (handle proxy scenarios)
    ip = request.client.host if request.client else "unknown"

    # Check forwarded header if behind proxy
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        ip = forwarded_for.split(",")[0].strip()

    # Check if request is allowed
    allowed, error_info = await rate_limiter.is_allowed(ip)

    if not allowed and error_info:
        raise HTTPException(
            status_code=429,
            detail={
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
            },
        )
