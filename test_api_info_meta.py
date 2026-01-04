#!/usr/bin/env python3
"""
Test script to verify API GET /api/info/meta endpoint.
This tests the requirements specified in Feature 32.
"""

import requests
import json

def test_api_info_meta():
    """Test the /api/info/meta endpoint."""
    print("Testing API GET /api/info/meta endpoint...")

    try:
        # Step 1: Send GET request to /api/info/meta
        response = requests.get('http://localhost:8000/api/info/meta', timeout=10)

        # Step 2: Verify response status is 200
        print(f"Step 2: Response status is {response.status_code}")
        assert response.status_code == 200, f"Expected status 200, got {response.status_code}"

        # Step 3: Verify response contains asset list
        data = response.json()
        print(f"Step 3: Response contains asset list with {len(data.get('assets', []))} assets")

        # Verify assets field exists and is a list
        assert 'assets' in data, "Missing 'assets' field in response"
        assert isinstance(data['assets'], list), "'assets' should be a list"
        assert len(data['assets']) > 0, "Assets list should not be empty"

        # Step 4: Verify response contains exchange info
        print(f"Step 4: Response contains exchange info: {data.get('exchange')}")
        assert 'exchange' in data, "Missing 'exchange' field in response"
        assert isinstance(data['exchange'], str), "'exchange' should be a string"

        # Additional validation: Check asset structure
        first_asset = data['assets'][0]
        required_fields = ['coin', 'sz_decimals', 'px_decimals', 'min_sz', 'max_leverage']
        for field in required_fields:
            assert field in first_asset, f"Missing required field '{field}' in asset"

        print("✅ All tests passed!")
        print(f"Exchange: {data['exchange']}")
        print(f"Assets: {[asset['coin'] for asset in data['assets']]}")

        return True

    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_api_info_meta()
    exit(0 if success else 1)