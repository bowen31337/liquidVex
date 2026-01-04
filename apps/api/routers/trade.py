"""
Trade Router - Order placement, modification, and cancellation endpoints.
"""

from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class OrderRequest(BaseModel):
    """Request body for placing a new order."""

    coin: str
    is_buy: bool
    limit_px: float = 0.0  # 0 for market orders
    sz: float
    order_type: Literal["limit", "market", "stop_limit", "stop_market"] = "limit"
    stop_px: float | None = None  # Trigger price for stop orders
    reduce_only: bool = False
    post_only: bool = False
    tif: Literal["GTC", "IOC", "FOK"] = "GTC"
    # Signature from wallet
    signature: str
    timestamp: int


class OrderResponse(BaseModel):
    """Response after order operation."""

    success: bool
    order_id: int | None = None
    message: str | None = None


class CancelRequest(BaseModel):
    """Request body for canceling an order."""

    coin: str
    oid: int
    signature: str
    timestamp: int


class ModifyRequest(BaseModel):
    """Request body for modifying an existing order."""

    coin: str
    oid: int
    new_px: float | None = None
    new_sz: float | None = None
    signature: str
    timestamp: int


class CancelAllRequest(BaseModel):
    """Request body for canceling all orders."""

    coin: str | None = None  # Optional: cancel for specific coin only
    signature: str
    timestamp: int


class ClosePositionRequest(BaseModel):
    """Request body for closing a position."""

    coin: str
    signature: str
    timestamp: int


@router.post("/place", response_model=OrderResponse)
async def place_order(request: OrderRequest) -> OrderResponse:
    """
    Place a new order.

    The request must include a valid signature from the user's wallet.
    The backend proxies the signed payload to Hyperliquid.

    Args:
        request: Order details including signature

    Returns:
        Order placement result with order ID if successful.
    """
    # Validate signature and proxy to Hyperliquid
    # Placeholder implementation
    return OrderResponse(
        success=True,
        order_id=12345,
        message="Order placed successfully",
    )


@router.post("/cancel", response_model=OrderResponse)
async def cancel_order(request: CancelRequest) -> OrderResponse:
    """
    Cancel an existing order.

    Args:
        request: Cancellation details including order ID and signature

    Returns:
        Cancellation result.
    """
    return OrderResponse(
        success=True,
        message=f"Order {request.oid} canceled successfully",
    )


@router.post("/modify", response_model=OrderResponse)
async def modify_order(request: ModifyRequest) -> OrderResponse:
    """
    Modify an existing order's price and/or size.

    Args:
        request: Modification details

    Returns:
        Modification result.
    """
    if request.new_px is None and request.new_sz is None:
        raise HTTPException(
            status_code=400,
            detail="At least one of new_px or new_sz must be provided",
        )

    return OrderResponse(
        success=True,
        order_id=request.oid,
        message="Order modified successfully",
    )


@router.post("/cancel-all", response_model=OrderResponse)
async def cancel_all_orders(request: CancelAllRequest) -> OrderResponse:
    """
    Cancel all open orders, optionally for a specific coin.

    Args:
        request: Cancellation request with optional coin filter

    Returns:
        Cancellation result.
    """
    coin_msg = f" for {request.coin}" if request.coin else ""
    return OrderResponse(
        success=True,
        message=f"All orders{coin_msg} canceled successfully",
    )


@router.post("/close-position", response_model=OrderResponse)
async def close_position(request: ClosePositionRequest) -> OrderResponse:
    """
    Close an entire position for a coin at market price.

    Args:
        request: Position close request

    Returns:
        Result of the close operation.
    """
    return OrderResponse(
        success=True,
        message=f"Position for {request.coin} closed successfully",
    )
