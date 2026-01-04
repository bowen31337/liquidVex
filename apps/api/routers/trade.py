"""
Trade Router - Order placement, modification, and cancellation endpoints.
"""

from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

router = APIRouter()


class OrderRequest(BaseModel):
    """Request body for placing a new order."""

    model_config = ConfigDict(populate_by_name=True)

    coin: str
    is_buy: bool = Field(alias='isBuy')
    limit_px: float = Field(default=0.0, alias='limitPx')  # 0 for market orders
    sz: float
    order_type: Literal["limit", "market", "stop_limit", "stop_market"] = Field(default="limit", alias='orderType')
    stop_px: float | None = Field(default=None, alias='stopPx')  # Trigger price for stop orders
    reduce_only: bool = Field(default=False, alias='reduceOnly')
    post_only: bool = Field(default=False, alias='postOnly')
    tif: Literal["GTC", "IOC", "FOK"] = "GTC"
    # Signature from wallet
    signature: str
    timestamp: int


class OrderResponse(BaseModel):
    """Response after order operation."""

    model_config = ConfigDict(populate_by_name=True)

    success: bool
    order_id: int | None = Field(default=None, alias='orderId')
    message: str | None = None


class CancelRequest(BaseModel):
    """Request body for canceling an order."""

    model_config = ConfigDict(populate_by_name=True)

    coin: str
    oid: int
    signature: str
    timestamp: int


class ModifyRequest(BaseModel):
    """Request body for modifying an existing order."""

    model_config = ConfigDict(populate_by_name=True)

    coin: str
    oid: int
    new_px: float | None = Field(default=None, alias='newPx')
    new_sz: float | None = Field(default=None, alias='newSz')
    signature: str
    timestamp: int


class CancelAllRequest(BaseModel):
    """Request body for canceling all orders."""

    model_config = ConfigDict(populate_by_name=True)

    coin: str | None = None  # Optional: cancel for specific coin only
    signature: str
    timestamp: int


class ClosePositionRequest(BaseModel):
    """Request body for closing a position."""

    model_config = ConfigDict(populate_by_name=True)

    coin: str
    signature: str
    timestamp: int


class ModifyPositionRequest(BaseModel):
    """Request body for modifying position size."""

    model_config = ConfigDict(populate_by_name=True)

    coin: str
    addSize: float | None = None  # Size to add to position
    reduceSize: float | None = None  # Size to reduce from position
    signature: str
    timestamp: int


class SetMarginModeRequest(BaseModel):
    """Request body for setting margin mode."""

    model_config = ConfigDict(populate_by_name=True)

    coin: str
    marginType: Literal['cross', 'isolated']
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


@router.post("/modify-position", response_model=OrderResponse)
async def modify_position(request: ModifyPositionRequest) -> OrderResponse:
    """
    Modify position size by adding to or reducing from existing position.

    Args:
        request: Position modification request

    Returns:
        Result of the modification operation.
    """
    if request.addSize is None and request.reduceSize is None:
        raise HTTPException(
            status_code=400,
            detail="Either addSize or reduceSize must be provided",
        )

    if request.addSize is not None and request.reduceSize is not None:
        raise HTTPException(
            status_code=400,
            detail="Cannot provide both addSize and reduceSize",
        )

    if request.addSize is not None and request.addSize <= 0:
        raise HTTPException(
            status_code=400,
            detail="addSize must be positive",
        )

    if request.reduceSize is not None and request.reduceSize <= 0:
        raise HTTPException(
            status_code=400,
            detail="reduceSize must be positive",
        )

    action = "added" if request.addSize is not None else "reduced"
    size = request.addSize if request.addSize is not None else request.reduceSize

    return OrderResponse(
        success=True,
        message=f"Position for {request.coin} {action} by {size}",
    )


@router.post("/set-margin-mode", response_model=OrderResponse)
async def set_margin_mode(request: SetMarginModeRequest) -> OrderResponse:
    """
    Set margin mode for a position (cross or isolated).

    Args:
        request: Margin mode setting request

    Returns:
        Result of the margin mode change operation.
    """
    return OrderResponse(
        success=True,
        message=f"Margin mode for {request.coin} set to {request.marginType}",
    )
