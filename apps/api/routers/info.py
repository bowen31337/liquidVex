"""
Info Router - Exchange metadata and market information endpoints.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class AssetInfo(BaseModel):
    """Information about a tradable asset."""

    coin: str
    sz_decimals: int
    px_decimals: int
    min_sz: float
    max_leverage: int
    funding_rate: float
    open_interest: float
    volume_24h: float
    price_change_24h: float


class ExchangeMeta(BaseModel):
    """Exchange metadata including all assets."""

    exchange: str
    assets: list[AssetInfo]


class FundingRate(BaseModel):
    """Funding rate at a specific timestamp."""

    timestamp: int
    rate: float


class Candle(BaseModel):
    """OHLCV candlestick data."""

    t: int  # Timestamp
    o: float  # Open
    h: float  # High
    l: float  # Low
    c: float  # Close
    v: float  # Volume


class OrderBookLevel(BaseModel):
    """A single price level in the order book."""

    px: float  # Price
    sz: float  # Size
    n: int  # Number of orders


class OrderBookData(BaseModel):
    """Order book data with bids and asks."""

    bids: list[OrderBookLevel]
    asks: list[OrderBookLevel]


@router.get("/meta", response_model=ExchangeMeta)
async def get_exchange_meta() -> ExchangeMeta:
    """
    Get exchange metadata including all available trading pairs.

    Returns exchange information and a list of all tradable assets
    with their specifications.
    """
    # Placeholder data - will be replaced with Hyperliquid SDK calls
    return ExchangeMeta(
        exchange="Hyperliquid",
        assets=[
            AssetInfo(
                coin="BTC",
                sz_decimals=4,
                px_decimals=1,
                min_sz=0.001,
                max_leverage=50,
                funding_rate=0.0001,
                open_interest=1500000000.0,
                volume_24h=500000000.0,
                price_change_24h=2.34,
            ),
            AssetInfo(
                coin="ETH",
                sz_decimals=3,
                px_decimals=2,
                min_sz=0.01,
                max_leverage=50,
                funding_rate=0.00015,
                open_interest=800000000.0,
                volume_24h=300000000.0,
                price_change_24h=-1.25,
            ),
        ],
    )


@router.get("/asset/{coin}", response_model=AssetInfo)
async def get_asset_info(coin: str) -> AssetInfo:
    """
    Get detailed information about a specific trading pair.

    Args:
        coin: The coin symbol (e.g., 'BTC', 'ETH')

    Returns:
        Detailed asset information including trading parameters.

    Raises:
        HTTPException: If the coin is not found.
    """
    coin = coin.upper()

    # Placeholder - will use actual exchange data
    assets = {
        "BTC": AssetInfo(
            coin="BTC",
            sz_decimals=4,
            px_decimals=1,
            min_sz=0.001,
            max_leverage=50,
            funding_rate=0.0001,
            open_interest=1500000000.0,
            volume_24h=500000000.0,
            price_change_24h=2.34,
        ),
        "ETH": AssetInfo(
            coin="ETH",
            sz_decimals=3,
            px_decimals=2,
            min_sz=0.01,
            max_leverage=50,
            funding_rate=0.00015,
            open_interest=800000000.0,
            volume_24h=300000000.0,
            price_change_24h=-1.25,
        ),
    }

    if coin not in assets:
        raise HTTPException(status_code=404, detail=f"Asset {coin} not found")

    return assets[coin]


@router.get("/funding/{coin}", response_model=list[FundingRate])
async def get_funding_history(coin: str, limit: int = 100) -> list[FundingRate]:
    """
    Get funding rate history for a specific coin.

    Args:
        coin: The coin symbol
        limit: Maximum number of records to return (default 100)

    Returns:
        List of historical funding rates with timestamps.
    """
    # Placeholder data
    import time

    now = int(time.time() * 1000)
    hour_ms = 3600000

    return [
        FundingRate(timestamp=now - i * hour_ms, rate=0.0001 + (i % 10) * 0.00001)
        for i in range(min(limit, 100))
    ]


@router.get("/candles/{coin}", response_model=list[Candle])
async def get_candles(
    coin: str,
    interval: str = "1h",
    limit: int = 500,
) -> list[Candle]:
    """
    Get OHLCV candlestick data for charting.

    Args:
        coin: The coin symbol
        interval: Timeframe (1m, 5m, 15m, 1h, 4h, 1d)
        limit: Maximum number of candles (default 500)

    Returns:
        List of OHLCV candles sorted by timestamp descending.
    """
    # Placeholder data - will connect to actual data source
    import random
    import time

    interval_ms = {
        "1m": 60000,
        "5m": 300000,
        "15m": 900000,
        "1h": 3600000,
        "4h": 14400000,
        "1d": 86400000,
    }.get(interval, 3600000)

    now = int(time.time() * 1000)
    base_price = 95000.0 if coin.upper() == "BTC" else 3500.0

    candles = []
    for i in range(min(limit, 500)):
        t = now - i * interval_ms
        volatility = base_price * 0.001
        o = base_price + random.uniform(-volatility, volatility)
        c = o + random.uniform(-volatility, volatility)
        h = max(o, c) + random.uniform(0, volatility)
        low = min(o, c) - random.uniform(0, volatility)
        v = random.uniform(100, 10000)

        candles.append(Candle(t=t, o=o, h=h, l=low, c=c, v=v))
        base_price = c

    return candles


@router.get("/orderbook/{coin}", response_model=OrderBookData)
async def get_order_book(coin: str, limit: int = 20) -> OrderBookData:
    """
    Get current order book for a specific trading pair.

    Args:
        coin: The coin symbol
        limit: Number of price levels to return (default 20)

    Returns:
        Order book with bids (buy orders) and asks (sell orders).
    """
    # Placeholder data - will connect to actual exchange
    import random

    coin = coin.upper()
    base_price = 95000.0 if coin == "BTC" else 3500.0

    # Generate mock order book data
    bids = []
    asks = []

    for i in range(limit):
        # Generate bids (below current price)
        bid_price = base_price - (i + 1) * base_price * 0.0001
        bid_size = random.uniform(0.1, 10.0)
        bids.append(
            OrderBookLevel(px=bid_price, sz=bid_size, n=random.randint(1, 20))
        )

        # Generate asks (above current price)
        ask_price = base_price + (i + 1) * base_price * 0.0001
        ask_size = random.uniform(0.1, 10.0)
        asks.append(
            OrderBookLevel(px=ask_price, sz=ask_size, n=random.randint(1, 20))
        )

    return OrderBookData(bids=bids, asks=asks)
