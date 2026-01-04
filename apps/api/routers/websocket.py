"""
WebSocket Router - Real-time market data streaming endpoints.
"""

import asyncio
import json
import random
import time
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


class ConnectionManager:
    """Manages active WebSocket connections."""

    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_json(self, websocket: WebSocket, data: dict[str, Any]) -> None:
        """Send JSON data to a specific connection."""
        await websocket.send_json(data)

    async def broadcast(self, data: dict[str, Any]) -> None:
        """Broadcast data to all connected clients."""
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                pass  # Connection may be closed


manager = ConnectionManager()


async def generate_orderbook_data(coin: str) -> dict[str, Any]:
    """Generate mock order book data."""
    base_price = 95000.0 if coin.upper() == "BTC" else 3500.0

    bids = []
    asks = []

    # Create tighter spread - bids slightly below base price, asks slightly above
    for i in range(25):
        # Bids: start from base_price - small amount and go down
        bid_px = base_price - (i + 1) * 0.1  # Much smaller increment
        # Asks: start from base_price + small amount and go up
        ask_px = base_price + (i + 1) * 0.1  # Much smaller increment
        bid_sz = random.uniform(0.1, 10)
        ask_sz = random.uniform(0.1, 10)

        bids.append({"px": round(bid_px, 1), "sz": round(bid_sz, 4), "n": random.randint(1, 5)})
        asks.append({"px": round(ask_px, 1), "sz": round(ask_sz, 4), "n": random.randint(1, 5)})

    return {
        "type": "orderbook",
        "coin": coin.upper(),
        "bids": bids,
        "asks": asks,
        "timestamp": int(time.time() * 1000),
    }


async def generate_trade_data(coin: str) -> dict[str, Any]:
    """Generate mock trade data."""
    base_price = 95000.0 if coin.upper() == "BTC" else 3500.0
    price = base_price + random.uniform(-50, 50)

    return {
        "type": "trade",
        "coin": coin.upper(),
        "side": random.choice(["B", "A"]),
        "px": round(price, 2),
        "sz": round(random.uniform(0.01, 1), 4),
        "time": int(time.time() * 1000),
        "hash": f"0x{random.randbytes(16).hex()}",
    }


@router.websocket("/orderbook/{coin}")
async def orderbook_stream(websocket: WebSocket, coin: str) -> None:
    """
    Stream real-time L2 order book data for a coin.

    Sends an initial snapshot followed by delta updates.
    """
    await manager.connect(websocket)

    try:
        # Send initial snapshot
        snapshot = await generate_orderbook_data(coin)
        snapshot["type"] = "orderbook_snapshot"
        await manager.send_json(websocket, snapshot)

        # Stream updates
        while True:
            await asyncio.sleep(0.1)  # 100ms updates
            update = await generate_orderbook_data(coin)
            update["type"] = "orderbook_update"
            await manager.send_json(websocket, update)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.websocket("/trades/{coin}")
async def trades_stream(websocket: WebSocket, coin: str) -> None:
    """
    Stream real-time trades for a coin.
    """
    await manager.connect(websocket)

    try:
        while True:
            await asyncio.sleep(random.uniform(0.1, 2))  # Random trade intervals
            trade = await generate_trade_data(coin)
            await manager.send_json(websocket, trade)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.websocket("/candles/{coin}/{interval}")
async def candles_stream(websocket: WebSocket, coin: str, interval: str) -> None:
    """
    Stream real-time candle updates for a coin/interval.
    """
    await manager.connect(websocket)

    interval_ms = {
        "1m": 60000,
        "5m": 300000,
        "15m": 900000,
        "1h": 3600000,
        "4h": 14400000,
        "1d": 86400000,
    }.get(interval, 60000)

    base_price = 95000.0 if coin.upper() == "BTC" else 3500.0

    try:
        while True:
            await asyncio.sleep(1)  # Update every second

            now = int(time.time() * 1000)
            candle_start = (now // interval_ms) * interval_ms

            volatility = base_price * 0.001
            o = base_price
            c = o + random.uniform(-volatility, volatility)
            h = max(o, c) + random.uniform(0, volatility / 2)
            low = min(o, c) - random.uniform(0, volatility / 2)
            v = random.uniform(10, 500)

            candle = {
                "type": "candle",
                "coin": coin.upper(),
                "interval": interval,
                "t": candle_start,
                "o": round(o, 2),
                "h": round(h, 2),
                "l": round(low, 2),
                "c": round(c, 2),
                "v": round(v, 2),
            }

            await manager.send_json(websocket, candle)
            base_price = c
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.websocket("/allMids")
async def all_mids_stream(websocket: WebSocket) -> None:
    """
    Stream mid prices for all assets.
    """
    await manager.connect(websocket)

    coins = ["BTC", "ETH", "SOL", "ARB", "AVAX", "DOGE", "LINK", "MATIC"]
    base_prices = {
        "BTC": 95000.0,
        "ETH": 3500.0,
        "SOL": 180.0,
        "ARB": 1.5,
        "AVAX": 40.0,
        "DOGE": 0.12,
        "LINK": 18.0,
        "MATIC": 0.8,
    }

    try:
        while True:
            await asyncio.sleep(0.5)  # 500ms updates

            mids = {}
            for coin in coins:
                base = base_prices[coin]
                mid = base + random.uniform(-base * 0.001, base * 0.001)
                mids[coin] = round(mid, 4)
                base_prices[coin] = mid

            data = {
                "type": "allMids",
                "mids": mids,
                "timestamp": int(time.time() * 1000),
            }

            await manager.send_json(websocket, data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.websocket("/user/{address}")
async def user_stream(websocket: WebSocket, address: str) -> None:
    """
    Stream real-time updates for a user's account.

    Includes order fills, position updates, and balance changes.
    """
    await manager.connect(websocket)

    try:
        # Send initial connection confirmation
        await manager.send_json(
            websocket,
            {
                "type": "connected",
                "address": address,
                "timestamp": int(time.time() * 1000),
            },
        )

        while True:
            await asyncio.sleep(5)  # Heartbeat every 5 seconds
            await manager.send_json(
                websocket,
                {
                    "type": "heartbeat",
                    "timestamp": int(time.time() * 1000),
                },
            )
    except WebSocketDisconnect:
        manager.disconnect(websocket)
