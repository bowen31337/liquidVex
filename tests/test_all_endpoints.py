#!/usr/bin/env python3
"""
Comprehensive test for all API and WebSocket endpoints.

This script verifies:
1. REST API endpoints are working
2. WebSocket endpoints are streaming data
3. Response formats match specifications
"""

import asyncio
import json
import websockets
from typing import Any
import httpx


async def test_rest_api():
    """Test REST API endpoints."""
    print("\n" + "=" * 60)
    print("Testing REST API Endpoints")
    print("=" * 60)

    base_url = "http://localhost:8000"
    results = []

    # Test 1: GET /api/info/meta
    print("\n1. Testing GET /api/info/meta...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/api/info/meta")
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            data = response.json()

            assert "exchange" in data, "Response should have 'exchange' field"
            assert "assets" in data, "Response should have 'assets' field"
            assert isinstance(data["assets"], list), "Assets should be a list"
            assert len(data["assets"]) > 0, "Should have at least one asset"

            # Verify asset structure
            asset = data["assets"][0]
            required_fields = ["coin", "sz_decimals", "px_decimals", "min_sz",
                             "max_leverage", "funding_rate", "open_interest",
                             "volume_24h", "price_change_24h"]
            for field in required_fields:
                assert field in asset, f"Asset should have '{field}' field"

            print(f"   ✅ GET /api/info/meta working")
            print(f"   Exchange: {data['exchange']}")
            print(f"   Assets: {len(data['assets'])}")
            results.append(True)
    except Exception as e:
        print(f"   ❌ GET /api/info/meta failed: {e}")
        results.append(False)

    # Test 2: GET /api/info/asset/:coin
    print("\n2. Testing GET /api/info/asset/BTC...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/api/info/asset/BTC")
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            data = response.json()

            assert data["coin"] == "BTC", "Coin should be BTC"
            assert "sz_decimals" in data, "Should have sz_decimals"
            assert "max_leverage" in data, "Should have max_leverage"

            print(f"   ✅ GET /api/info/asset/:coin working")
            print(f"   Coin: {data['coin']}, Max Leverage: {data['max_leverage']}x")
            results.append(True)
    except Exception as e:
        print(f"   ❌ GET /api/info/asset/:coin failed: {e}")
        results.append(False)

    # Test 3: GET /api/info/candles/:coin
    print("\n3. Testing GET /api/info/candles/BTC...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/api/info/candles/BTC?interval=1h&limit=100")
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            data = response.json()

            assert isinstance(data, list), "Candles should be a list"
            assert len(data) > 0, "Should have at least one candle"

            # Verify candle structure
            candle = data[0]
            required_fields = ["t", "o", "h", "l", "c", "v"]
            for field in required_fields:
                assert field in candle, f"Candle should have '{field}' field"

            print(f"   ✅ GET /api/info/candles/:coin working")
            print(f"   Received {len(data)} candles")
            results.append(True)
    except Exception as e:
        print(f"   ❌ GET /api/info/candles/:coin failed: {e}")
        results.append(False)

    # Test 4: GET /api/account/state/:address
    print("\n4. Testing GET /api/account/state/:address...")
    try:
        async with httpx.AsyncClient() as client:
            test_address = "0x1234567890123456789012345678901234567890"
            response = await client.get(f"{base_url}/api/account/state/{test_address}")
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            data = response.json()

            required_fields = ["equity", "margin_used", "available_balance", "withdrawable"]
            for field in required_fields:
                assert field in data, f"Account state should have '{field}' field"

            print(f"   ✅ GET /api/account/state/:address working")
            print(f"   Equity: ${data['equity']:,.2f}")
            results.append(True)
    except Exception as e:
        print(f"   ❌ GET /api/account/state/:address failed: {e}")
        results.append(False)

    # Test 5: GET /api/account/positions/:address
    print("\n5. Testing GET /api/account/positions/:address...")
    try:
        async with httpx.AsyncClient() as client:
            test_address = "0x1234567890123456789012345678901234567890"
            response = await client.get(f"{base_url}/api/account/positions/{test_address}")
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            data = response.json()

            assert isinstance(data, list), "Positions should be a list"

            if len(data) > 0:
                position = data[0]
                required_fields = ["coin", "side", "entry_px", "sz", "leverage",
                                 "margin_used", "unrealized_pnl", "liquidation_px"]
                for field in required_fields:
                    assert field in position, f"Position should have '{field}' field"

            print(f"   ✅ GET /api/account/positions/:address working")
            print(f"   Open positions: {len(data)}")
            results.append(True)
    except Exception as e:
        print(f"   ❌ GET /api/account/positions/:address failed: {e}")
        results.append(False)

    # Test 6: GET /api/account/orders/:address
    print("\n6. Testing GET /api/account/orders/:address...")
    try:
        async with httpx.AsyncClient() as client:
            test_address = "0x1234567890123456789012345678901234567890"
            response = await client.get(f"{base_url}/api/account/orders/{test_address}")
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            data = response.json()

            assert isinstance(data, list), "Orders should be a list"

            if len(data) > 0:
                order = data[0]
                required_fields = ["oid", "coin", "side", "limit_px", "sz", "status"]
                for field in required_fields:
                    assert field in order, f"Order should have '{field}' field"

            print(f"   ✅ GET /api/account/orders/:address working")
            print(f"   Open orders: {len(data)}")
            results.append(True)
    except Exception as e:
        print(f"   ❌ GET /api/account/orders/:address failed: {e}")
        results.append(False)

    # Test 7: Health endpoint
    print("\n7. Testing GET /health...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{base_url}/health")
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            data = response.json()

            assert data["status"] == "healthy", "Status should be healthy"

            print(f"   ✅ GET /health working")
            results.append(True)
    except Exception as e:
        print(f"   ❌ GET /health failed: {e}")
        results.append(False)

    return all(results)


async def test_websocket_endpoints():
    """Test WebSocket endpoints."""
    print("\n" + "=" * 60)
    print("Testing WebSocket Endpoints")
    print("=" * 60)

    base_url = "ws://localhost:8000"
    results = []

    # Test 1: /ws/orderbook/:coin
    print("\n1. Testing /ws/orderbook/BTC...")
    try:
        uri = f"{base_url}/ws/orderbook/BTC"
        async with websockets.connect(uri) as websocket:
            # Receive initial snapshot
            message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            data = json.loads(message)

            assert data["type"] == "orderbook_snapshot", "First message should be snapshot"
            assert "bids" in data, "Should have bids"
            assert "asks" in data, "Should have asks"

            print(f"   ✅ /ws/orderbook/:coin working")
            print(f"   Snapshot: {len(data['bids'])} bids, {len(data['asks'])} asks")
            results.append(True)
    except Exception as e:
        print(f"   ❌ /ws/orderbook/:coin failed: {e}")
        results.append(False)

    # Test 2: /ws/trades/:coin
    print("\n2. Testing /ws/trades/ETH...")
    try:
        uri = f"{base_url}/ws/trades/ETH"
        async with websockets.connect(uri) as websocket:
            # Receive first trade
            message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            data = json.loads(message)

            assert data["type"] == "trade", "Message should be trade"
            assert "coin" in data, "Should have coin"
            assert "side" in data, "Should have side"
            assert "px" in data, "Should have price"
            assert "sz" in data, "Should have size"

            print(f"   ✅ /ws/trades/:coin working")
            print(f"   Trade: {data['side']} {data['sz']} @ {data['px']}")
            results.append(True)
    except Exception as e:
        print(f"   ❌ /ws/trades/:coin failed: {e}")
        results.append(False)

    # Test 3: /ws/allMids
    print("\n3. Testing /ws/allMids...")
    try:
        uri = f"{base_url}/ws/allMids"
        async with websockets.connect(uri) as websocket:
            # Receive first update
            message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            data = json.loads(message)

            assert data["type"] == "allMids", "Message should be allMids"
            assert "mids" in data, "Should have mids"
            assert isinstance(data["mids"], dict), "Mids should be a dict"

            print(f"   ✅ /ws/allMids working")
            print(f"   Tracking {len(data['mids'])} assets")
            results.append(True)
    except Exception as e:
        print(f"   ❌ /ws/allMids failed: {e}")
        results.append(False)

    # Test 4: /ws/user/:address
    print("\n4. Testing /ws/user/:address...")
    try:
        test_address = "0x1234567890123456789012345678901234567890"
        uri = f"{base_url}/ws/user/{test_address}"
        async with websockets.connect(uri) as websocket:
            # Receive connection confirmation
            message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            data = json.loads(message)

            assert data["type"] == "connected", "First message should be connected"
            assert data["address"] == test_address, "Should return correct address"

            print(f"   ✅ /ws/user/:address working")
            print(f"   Connected to: {data['address'][:10]}...")
            results.append(True)
    except Exception as e:
        print(f"   ❌ /ws/user/:address failed: {e}")
        results.append(False)

    return all(results)


async def main():
    """Main test runner."""
    print("=" * 60)
    print("Comprehensive API and WebSocket Endpoint Tests")
    print("=" * 60)

    # Test REST API
    rest_success = await test_rest_api()

    # Test WebSocket
    ws_success = await test_websocket_endpoints()

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"REST API: {'✅ PASS' if rest_success else '❌ FAIL'}")
    print(f"WebSocket: {'✅ PASS' if ws_success else '❌ FAIL'}")

    if rest_success and ws_success:
        print("\n✅ ALL TESTS PASSED")
        return 0
    else:
        print("\n❌ SOME TESTS FAILED")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
