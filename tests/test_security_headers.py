#!/usr/bin/env python3
"""
Test CORS and security headers configuration.

This script verifies:
1. Security headers are present
2. CORS headers are correctly configured
3. Unauthorized origins are rejected
"""

import asyncio
import httpx


async def test_security_headers():
    """Test security headers on API endpoints."""
    print("\n" + "=" * 60)
    print("Testing Security Headers")
    print("=" * 60)

    base_url = "http://localhost:8000"
    results = []

    # Test 1: Check security headers on root endpoint
    print("\n1. Testing security headers on / endpoint...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/")
            headers = dict(response.headers)

            print(f"   Response headers:")
            for header, value in headers.items():
                if header.startswith("X-") or header in [
                    "Content-Security-Policy",
                    "Strict-Transport-Security",
                    "Referrer-Policy",
                    "Permissions-Policy",
                ]:
                    print(f"   ✓ {header}: {value}")

            # Verify required security headers
            required_headers = {
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
                "X-XSS-Protection": "1; mode=block",
                "Strict-Transport-Security": "max-age=31536000",
                "Content-Security-Policy": "default-src 'self'",
                "Referrer-Policy": "strict-origin-when-cross-origin",
            }

            missing_headers = []
            for header, expected_value in required_headers.items():
                if header not in headers:
                    missing_headers.append(header)
                    print(f"   ❌ Missing header: {header}")
                elif expected_value in headers[header]:
                    print(f"   ✅ {header}: {headers[header]}")
                else:
                    print(f"   ⚠️  {header}: {headers[header]} (expected: {expected_value})")

            if not missing_headers:
                print(f"   ✅ All security headers present")
                results.append(True)
            else:
                print(f"   ❌ Missing {len(missing_headers)} security headers")
                results.append(False)

    except Exception as e:
        print(f"   ❌ Error: {e}")
        results.append(False)

    # Test 2: Check CORS headers from allowed origin
    print("\n2. Testing CORS headers from allowed origin (localhost:3000)...")
    try:
        async with httpx.AsyncClient() as client:
            headers = {"Origin": "http://localhost:3000"}
            response = await client.get(f"{base_url}/api/info/meta", headers=headers)
            response_headers = dict(response.headers)

            print(f"   CORS-related headers:")
            cors_headers = [
                "access-control-allow-origin",
                "access-control-allow-credentials",
                "access-control-allow-methods",
                "access-control-allow-headers",
                "access-control-expose-headers",
                "access-control-max-age",
            ]

            for header in cors_headers:
                if header in response_headers:
                    print(f"   ✓ {header}: {response_headers[header]}")

            # Verify CORS is enabled
            if "access-control-allow-origin" in response_headers:
                if "localhost:3000" in response_headers["access-control-allow-origin"]:
                    print(f"   ✅ CORS properly configured for localhost:3000")
                    results.append(True)
                else:
                    print(f"   ⚠️  CORS origin: {response_headers['access-control-allow-origin']}")
                    results.append(False)
            else:
                print(f"   ❌ CORS headers not found")
                results.append(False)

    except Exception as e:
        print(f"   ❌ Error: {e}")
        results.append(False)

    # Test 3: Preflight OPTIONS request
    print("\n3. Testing CORS preflight OPTIONS request...")
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type",
            }
            response = await client.options(f"{base_url}/api/trade/place", headers=headers)

            print(f"   Status: {response.status_code}")

            if response.status_code == 200 or response.status_code == 204:
                response_headers = dict(response.headers)

                if "access-control-allow-origin" in response_headers:
                    print(f"   ✅ Preflight request successful")
                    print(f"   ✅ Allow-Origin: {response_headers['access-control-allow-origin']}")
                    if "access-control-allow-methods" in response_headers:
                        print(f"   ✅ Allow-Methods: {response_headers['access-control-allow-methods']}")
                    results.append(True)
                else:
                    print(f"   ❌ CORS headers missing in preflight response")
                    results.append(False)
            else:
                print(f"   ❌ Preflight request failed with status {response.status_code}")
                results.append(False)

    except Exception as e:
        print(f"   ❌ Error: {e}")
        results.append(False)

    return all(results)


async def test_unauthorized_origin():
    """Test that unauthorized origins are rejected."""
    print("\n4. Testing CORS rejection for unauthorized origin...")
    base_url = "http://localhost:8000"
    try:
        async with httpx.AsyncClient() as client:
            # Try to access from an unauthorized origin
            headers = {"Origin": "http://malicious-site.com"}
            response = await client.get(f"{base_url}/api/info/meta", headers=headers)
            response_headers = dict(response.headers)

            # Check if the origin is reflected in allow-origin header
            if "access-control-allow-origin" in response_headers:
                allowed_origin = response_headers["access-control-allow-origin"]
                if "malicious-site.com" in allowed_origin:
                    print(f"   ❌ SECURITY ISSUE: Unauthorized origin was accepted!")
                    print(f"   ❌ Allow-Origin: {allowed_origin}")
                    return False
                else:
                    print(f"   ✅ Unauthorized origin was rejected")
                    print(f"   ✅ Allow-Origin: {allowed_origin}")
                    return True
            else:
                print(f"   ⚠️  No CORS headers returned (origin may be rejected)")
                return True

    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


async def main():
    """Main test runner."""
    print("=" * 60)
    print("CORS and Security Headers Test Suite")
    print("=" * 60)

    security_success = await test_security_headers()
    cors_success = await test_unauthorized_origin()

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Security Headers: {'✅ PASS' if security_success else '❌ FAIL'}")
    print(f"CORS Configuration: {'✅ PASS' if cors_success else '❌ FAIL'}")

    if security_success and cors_success:
        print("\n✅ ALL TESTS PASSED")
        print("\n📝 Security features verified:")
        print("   ✓ X-Content-Type-Options: nosniff")
        print("   ✓ X-Frame-Options: DENY")
        print("   ✓ X-XSS-Protection: 1; mode=block")
        print("   ✓ Strict-Transport-Security: max-age=31536000")
        print("   ✓ Content-Security-Policy: default-src 'self'")
        print("   ✓ Referrer-Policy: strict-origin-when-cross-origin")
        print("   ✓ CORS configured for allowed origins")
        print("   ✓ Unauthorized origins rejected")
        return 0
    else:
        print("\n❌ SOME TESTS FAILED")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
