#!/usr/bin/env python3
"""Simple test to verify asset selector can fetch data from backend."""

import requests
import json

def test_asset_selector_api():
    """Test that asset selector can fetch assets from backend API."""
    print("Testing asset selector API integration...")

    # Test backend API directly
    print("1. Testing backend API...")
    try:
        response = requests.get('http://localhost:8000/api/info/meta', timeout=5)
        assert response.status_code == 200, f"Backend API returned {response.status_code}"
        data = response.json()
        assets = data.get('assets', [])
        assert len(assets) > 0, "No assets returned from backend"
        print(f"   ✓ Backend returned {len(assets)} assets: {[asset['coin'] for asset in assets]}")
    except Exception as e:
        print(f"   ✗ Backend API test failed: {e}")
        return False

    # Test frontend page loads (basic connectivity)
    print("2. Testing frontend page load...")
    try:
        response = requests.get('http://localhost:3000', timeout=10)
        assert response.status_code == 200, f"Frontend returned {response.status_code}"
        print("   ✓ Frontend page loads successfully")
    except Exception as e:
        print(f"   ✗ Frontend test failed: {e}")
        return False

    # Test that our asset selector component exists in the page
    print("3. Testing asset selector component...")
    try:
        response = requests.get('http://localhost:3000', timeout=10)
        content = response.text
        assert 'BTC-PERP' in content, "BTC-PERP not found in page content"
        assert 'ETH-PERP' in content, "ETH-PERP not found in page content"
        print("   ✓ Asset selector component found with expected asset names")
    except Exception as e:
        print(f"   ✗ Asset selector component test failed: {e}")
        return False

    print("✅ All tests passed! Asset selector should work correctly.")
    return True

if __name__ == "__main__":
    success = test_asset_selector_api()
    if success:
        print("\n🎉 Asset selector implementation appears to be working!")
        print("The component should now:")
        print("- Fetch assets from backend API at http://localhost:8000/api/info/meta")
        print("- Display assets as 'BTC-PERP', 'ETH-PERP' format")
        print("- Connect to market store for state management")
        print("- Update selected asset when clicked")
    else:
        print("\n❌ Asset selector implementation needs fixes.")