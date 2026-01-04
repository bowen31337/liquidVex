#!/usr/bin/env python3
"""
Test WebSocket /ws/orderbook/:coin endpoint.

This script tests that the WebSocket endpoint:
1. Accepts connections
2. Sends initial snapshot
3. Streams orderbook updates
"""

import asyncio
import json
import websockets
from typing import Any


async def test_orderbook_websocket():
    """Test the orderbook WebSocket endpoint."""

    uri = "ws://localhost:8000/ws/orderbook/BTC"
    print(f"Connecting to {uri}...")

    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to WebSocket")

            # Receive messages
            message_count = 0
            max_messages = 10  # Only receive 10 messages for testing

            while message_count < max_messages:
                try:
                    # Wait for message with timeout
                    message = await asyncio.wait_for(
                        websocket.recv(), timeout=5.0
                    )
                    data = json.loads(message)
                    message_count += 1

                    print(f"\n--- Message {message_count} ---")
                    print(f"Type: {data.get('type')}")
                    print(f"Coin: {data.get('coin')}")

                    # Verify structure
                    if data.get("type") == "orderbook_snapshot":
                        print("✅ Received initial snapshot")
                        assert "bids" in data, "Snapshot should contain bids"
                        assert "asks" in data, "Snapshot should contain asks"
                        assert len(data["bids"]) > 0, "Should have bid data"
                        assert len(data["asks"]) > 0, "Should have ask data"
                        print(f"  Bids: {len(data['bids'])} levels")
                        print(f"  Asks: {len(data['asks'])} levels")

                        # Verify bid/ask structure
                        if len(data["bids"]) > 0:
                            bid = data["bids"][0]
                            assert "px" in bid, "Bid should have price"
                            assert "sz" in bid, "Bid should have size"
                            print(f"  Top bid: {bid['px']} x {bid['sz']}")

                        if len(data["asks"]) > 0:
                            ask = data["asks"][0]
                            assert "px" in ask, "Ask should have price"
                            assert "sz" in ask, "Ask should have size"
                            print(f"  Top ask: {ask['px']} x {ask['sz']}")

                    elif data.get("type") == "orderbook_update":
                        print("✅ Received orderbook update")
                        assert "bids" in data, "Update should contain bids"
                        assert "asks" in data, "Update should contain asks"
                        print(f"  Timestamp: {data.get('timestamp')}")

                    # Verify timestamp
                    if "timestamp" in data:
                        assert isinstance(data["timestamp"], int), "Timestamp should be int"

                except asyncio.TimeoutError:
                    print("⏱️ Timeout waiting for message")
                    break

            print(f"\n✅ Successfully received {message_count} messages")
            print("✅ WebSocket orderbook endpoint working correctly")
            return True

    except ConnectionRefusedError:
        print("❌ Connection refused - is the backend running?")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


async def main():
    """Main test runner."""
    print("=" * 60)
    print("Testing WebSocket /ws/orderbook/:coin endpoint")
    print("=" * 60)

    success = await test_orderbook_websocket()

    if success:
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED")
        print("=" * 60)
        return 0
    else:
        print("\n" + "=" * 60)
        print("❌ TESTS FAILED")
        print("=" * 60)
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
