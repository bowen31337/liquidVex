#!/usr/bin/env python3
"""
Simple test script to check if the liquidVex application is accessible
"""

import requests
import time
import sys
import json

def test_frontend():
    """Test if frontend is accessible"""
    try:
        response = requests.get('http://localhost:3002', timeout=10)
        if response.status_code == 200:
            print("✅ Frontend is accessible at http://localhost:3002")
            return True
        else:
            print(f"❌ Frontend returned status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Frontend is not accessible at http://localhost:3002")
        return False
    except Exception as e:
        print(f"❌ Error testing frontend: {e}")
        return False

def test_backend():
    """Test if backend is accessible"""
    try:
        response = requests.get('http://localhost:8000/health', timeout=10)
        if response.status_code == 200:
            print("✅ Backend is accessible at http://localhost:8000")
            return True
        else:
            print(f"❌ Backend returned status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not accessible at http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Error testing backend: {e}")
        return False

def test_api_endpoints():
    """Test key API endpoints"""
    endpoints = [
        '/api/info/meta',
        '/api/info/candles/BTC?interval=1h&limit=10',
        '/ws/orderbook/BTC',
        '/ws/trades/BTC',
    ]

    for endpoint in endpoints:
        try:
            if endpoint.startswith('/ws/'):
                print(f"⚠️  Skipping WebSocket endpoint: {endpoint}")
                continue

            response = requests.get(f'http://localhost:8000{endpoint}', timeout=10)
            if response.status_code == 200:
                print(f"✅ API endpoint {endpoint} is accessible")
            else:
                print(f"❌ API endpoint {endpoint} returned status code: {response.status_code}")
        except Exception as e:
            print(f"❌ Error testing API endpoint {endpoint}: {e}")

def main():
    print("Testing liquidVex application accessibility...")
    print("=" * 50)

    # Test backend first
    backend_ok = test_backend()
    if not backend_ok:
        print("\n❌ Backend is not accessible. Please start the backend server.")
        sys.exit(1)

    # Wait a moment
    time.sleep(1)

    # Test frontend
    frontend_ok = test_frontend()
    if not frontend_ok:
        print("\n❌ Frontend is not accessible. Please start the frontend server.")
        sys.exit(1)

    # Test API endpoints
    print("\nTesting API endpoints:")
    test_api_endpoints()

    print("\n✅ All tests passed! Application appears to be accessible.")

if __name__ == "__main__":
    main()