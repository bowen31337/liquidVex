#!/usr/bin/env python3
"""
Test rate limiting implementation

This script tests the rate limiting functionality by making rapid API calls
and verifying that rate limits are enforced.
"""

import asyncio
import time
from datetime import datetime
import httpx


async def test_rate_limiting():
    """Test rate limiting by making rapid requests."""

    base_url = "http://localhost:8000"
    endpoint = f"{base_url}/api/info/meta"

    print("=" * 60)
    print("Testing Rate Limiting Implementation")
    print("=" * 60)
    print(f"Endpoint: {endpoint}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    async with httpx.AsyncClient() as client:
        # Test 1: Check if rate limit headers are present
        print("\n[Test 1] Checking rate limit headers...")
        response = await client.get(endpoint)

        print(f"  Status: {response.status_code}")
        print(f"  Headers:")
        for header in ['x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-window']:
            value = response.headers.get(header, 'NOT FOUND')
            print(f"    {header}: {value}")

        if response.status_code == 200:
            print("  ✓ Request successful")
        else:
            print(f"  ✗ Unexpected status code: {response.status_code}")

        # Test 2: Make rapid requests to trigger rate limit
        print("\n[Test 2] Making 20 rapid requests...")
        rate_limited = False
        rate_limit_info = None

        for i in range(20):
            start = time.time()
            response = await client.get(endpoint)
            elapsed = time.time() - start

            if response.status_code == 429:
                rate_limited = True
                rate_limit_info = response.json()
                print(f"  Request {i+1}: Rate limited (429) after {elapsed:.3f}s")
                print(f"    Error: {rate_limit_info.get('error')}")
                print(f"    Limit: {rate_limit_info.get('limit')}")
                print(f"    Window: {rate_limit_info.get('window')}")
                print(f"    Retry-After: {rate_limit_info.get('retry_after')}s")
                break
            elif response.status_code == 200:
                remaining = response.headers.get('x-ratelimit-remaining', '?')
                print(f"  Request {i+1}: Success (200) - Remaining: {remaining}")
            else:
                print(f"  Request {i+1}: Unexpected status {response.status_code}")

            # Small delay to avoid overwhelming
            await asyncio.sleep(0.05)

        if not rate_limited:
            print("  ⚠ Rate limit not triggered after 20 requests")
            print("  (This is expected if rate limiting is not active)")

        # Test 3: Wait for rate limit reset and try again
        if rate_limited and rate_limit_info:
            retry_after = rate_limit_info.get('retry_after', 2)
            print(f"\n[Test 3] Waiting {retry_after + 1} seconds for rate limit reset...")
            await asyncio.sleep(retry_after + 1)

            print("  Making request after waiting...")
            response = await client.get(endpoint)

            print(f"  Status: {response.status_code}")

            if response.status_code == 200:
                remaining = response.headers.get('x-ratelimit-remaining', '?')
                print(f"  ✓ Request successful! Remaining: {remaining}")
            else:
                print(f"  ✗ Request failed with status {response.status_code}")

        # Test 4: Test burst protection (10 req/sec limit)
        print("\n[Test 4] Testing burst protection (15 requests in 1 second)...")
        burst_limited = False

        for i in range(15):
            response = await client.get(endpoint)

            if response.status_code == 429:
                burst_limited = True
                info = response.json()
                print(f"  Request {i+1}: Rate limited (burst protection)")
                print(f"    Window: {info.get('window')}")
                break

        if burst_limited:
            print("  ✓ Burst protection triggered")
        else:
            print("  ⚠ Burst protection not triggered")

    print("\n" + "=" * 60)
    print("Test complete")
    print("=" * 60)


if __name__ == "__main__":
    try:
        asyncio.run(test_rate_limiting())
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
    except Exception as e:
        print(f"\n\nError: {e}")
        import traceback
        traceback.print_exc()
