"""
Account Router - Account state, positions, and order history endpoints.
"""

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class AccountState(BaseModel):
    """Current account state including balances and margins."""

    equity: float
    margin_used: float
    available_balance: float
    withdrawable: float
    cross_margin_summary: dict[str, float]


class Position(BaseModel):
    """An open position."""

    coin: str
    side: Literal["long", "short"]
    entry_px: float
    sz: float
    leverage: float
    margin_used: float
    unrealized_pnl: float
    realized_pnl: float
    liquidation_px: float
    margin_type: Literal["cross", "isolated"]


class Order(BaseModel):
    """An open or historical order."""

    oid: int
    coin: str
    side: Literal["B", "A"]  # Buy or Ask (Sell)
    limit_px: float
    sz: float
    orig_sz: float
    status: Literal["open", "filled", "canceled", "triggered"]
    timestamp: int
    order_type: Literal["limit", "market", "stop_limit", "stop_market"]
    reduce_only: bool
    post_only: bool
    tif: Literal["GTC", "IOC", "FOK"]


class Trade(BaseModel):
    """An executed trade."""

    coin: str
    side: Literal["B", "A"]
    px: float
    sz: float
    time: int
    fee: float
    hash: str


class AccountHistory(BaseModel):
    """Account order and trade history."""

    orders: list[Order]
    trades: list[Trade]


@router.get("/state/{address}", response_model=AccountState)
async def get_account_state(address: str) -> AccountState:
    """
    Get current account state for a wallet address.

    Args:
        address: The wallet address (0x...)

    Returns:
        Account balances, margins, and equity.
    """
    # Placeholder - will query Hyperliquid
    return AccountState(
        equity=10000.0,
        margin_used=2500.0,
        available_balance=7500.0,
        withdrawable=5000.0,
        cross_margin_summary={
            "account_value": 10000.0,
            "total_margin_used": 2500.0,
        },
    )


@router.get("/positions/{address}", response_model=list[Position])
async def get_positions(address: str) -> list[Position]:
    """
    Get all open positions for a wallet address.

    Args:
        address: The wallet address

    Returns:
        List of open positions with PnL information.
    """
    # Placeholder data
    return [
        Position(
            coin="BTC",
            side="long",
            entry_px=94500.0,
            sz=0.5,
            leverage=10,
            margin_used=4725.0,
            unrealized_pnl=460.25,
            realized_pnl=0.0,
            liquidation_px=85050.0,
            margin_type="cross",
        ),
    ]


@router.get("/orders/{address}", response_model=list[Order])
async def get_open_orders(address: str) -> list[Order]:
    """
    Get all open orders for a wallet address.

    Args:
        address: The wallet address

    Returns:
        List of open orders.
    """
    import time

    # Placeholder data
    return [
        Order(
            oid=12345,
            coin="ETH",
            side="B",
            limit_px=3400.0,
            sz=2.0,
            orig_sz=2.0,
            status="open",
            timestamp=int(time.time() * 1000) - 300000,
            order_type="limit",
            reduce_only=False,
            post_only=True,
            tif="GTC",
        ),
    ]


@router.get("/history/{address}", response_model=AccountHistory)
async def get_account_history(
    address: str,
    limit: int = 100,
    offset: int = 0,
) -> AccountHistory:
    """
    Get order and trade history for a wallet address.

    Args:
        address: The wallet address
        limit: Maximum records per type
        offset: Pagination offset

    Returns:
        Historical orders and trades.
    """
    import time

    now = int(time.time() * 1000)

    return AccountHistory(
        orders=[
            Order(
                oid=12340,
                coin="BTC",
                side="B",
                limit_px=93000.0,
                sz=0.5,
                orig_sz=0.5,
                status="filled",
                timestamp=now - 86400000,
                order_type="limit",
                reduce_only=False,
                post_only=False,
                tif="GTC",
            ),
        ],
        trades=[
            Trade(
                coin="BTC",
                side="B",
                px=93000.0,
                sz=0.5,
                time=now - 86400000,
                fee=4.65,
                hash="0x123abc...",
            ),
        ],
    )
