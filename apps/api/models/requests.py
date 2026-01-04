"""
Enhanced Request Models with Validation

Pydantic models with built-in validators for security and data integrity.
"""

from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from validators import SecurityValidator


class BaseTradingRequest(BaseModel):
    """Base model for all trading requests with signature validation."""

    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True)

    signature: str = Field(..., min_length=1, description="Cryptographic signature from wallet")
    timestamp: int = Field(..., description="Request timestamp for replay protection")

    @field_validator("signature")
    @classmethod
    def validate_signature(cls, v: str) -> str:
        """Validate signature format."""
        if not SecurityValidator.validate_signature_format(v):
            raise ValueError("Invalid signature format. Expected hex string (0x...)")
        return v

    @field_validator("timestamp")
    @classmethod
    def validate_timestamp(cls, v: int) -> int:
        """Validate timestamp is reasonable."""
        import time
        current_time = int(time.time())

        # Check timestamp isn't too far in the past or future
        if abs(current_time - v) > 300:  # 5 minutes
            raise ValueError(f"Timestamp too old or too far in the future. Current: {current_time}, Provided: {v}")

        return v


class OrderRequest(BaseTradingRequest):
    """Request body for placing a new order."""

    coin: str = Field(..., min_length=2, max_length=10, description="Trading pair symbol (e.g., BTC, ETH)")
    is_buy: bool = Field(..., alias='isBuy', description="True for buy order, False for sell")
    limit_px: float = Field(default=0.0, ge=0, alias='limitPx', description="Limit price (0 for market orders)")
    sz: float = Field(..., gt=0, le=1000000, description="Order size in base currency")
    order_type: Literal["limit", "market", "stop_limit", "stop_market"] = Field(
        default="limit", alias='orderType', description="Order type"
    )
    stop_px: Optional[float] = Field(
        default=None, ge=0, alias='stopPx', description="Trigger price for stop orders"
    )
    reduce_only: bool = Field(default=False, alias='reduceOnly', description="Reduce existing position only")
    post_only: bool = Field(default=False, alias='postOnly', description="Post as maker only")
    tif: Literal["GTC", "IOC", "FOK"] = Field(
        default="GTC", description="Time-in-force: Good-Til-Cancel, Immediate-or-Cancel, Fill-or-Kill"
    )

    @field_validator("coin")
    @classmethod
    def validate_coin(cls, v: str) -> str:
        """Validate coin symbol format."""
        if not SecurityValidator.validate_coin_symbol(v):
            raise ValueError(f"Invalid coin symbol: {v}. Must be uppercase letters, 2-10 characters")
        return v.upper()

    @model_validator(mode="after")
    def validate_order_logic(self) -> "OrderRequest":
        """Validate order type combinations."""
        # Market orders must have limit_px = 0
        if self.order_type == "market" and self.limit_px != 0:
            raise ValueError("Market orders must have limit_px = 0")

        # Limit orders must have price > 0
        if self.order_type == "limit" and self.limit_px <= 0:
            raise ValueError("Limit orders must have limit_px > 0")

        # Stop orders must have stop_px
        if "stop" in self.order_type and self.stop_px is None:
            raise ValueError("Stop orders must have stop_px specified")

        # Post-only requires limit order
        if self.post_only and self.order_type != "limit":
            raise ValueError("Post-only is only valid for limit orders")

        # IOC/FOK don't make sense with post-only
        if self.post_only and self.tif in ["IOC", "FOK"]:
            raise ValueError("Post-only cannot be combined with IOC or FOK")

        return self


class CancelRequest(BaseTradingRequest):
    """Request body for canceling an order."""

    coin: str = Field(..., min_length=2, max_length=10, description="Trading pair symbol")
    oid: int = Field(..., gt=0, description="Order ID to cancel")

    @field_validator("coin")
    @classmethod
    def validate_coin(cls, v: str) -> str:
        """Validate coin symbol format."""
        if not SecurityValidator.validate_coin_symbol(v):
            raise ValueError(f"Invalid coin symbol: {v}")
        return v.upper()


class ModifyRequest(BaseTradingRequest):
    """Request body for modifying an existing order."""

    coin: str = Field(..., min_length=2, max_length=10, description="Trading pair symbol")
    oid: int = Field(..., gt=0, description="Order ID to modify")
    new_px: Optional[float] = Field(default=None, ge=0, alias='newPx', description="New limit price")
    new_sz: Optional[float] = Field(default=None, gt=0, le=1000000, alias='newSz', description="New order size")

    @field_validator("coin")
    @classmethod
    def validate_coin(cls, v: str) -> str:
        """Validate coin symbol format."""
        if not SecurityValidator.validate_coin_symbol(v):
            raise ValueError(f"Invalid coin symbol: {v}")
        return v.upper()

    @model_validator(mode="after")
    def validate_modification(self) -> "ModifyRequest":
        """Validate at least one field is being modified."""
        if self.new_px is None and self.new_sz is None:
            raise ValueError("At least one of new_px or new_sz must be provided")
        return self


class CancelAllRequest(BaseTradingRequest):
    """Request body for canceling all orders."""

    coin: Optional[str] = Field(
        default=None, min_length=2, max_length=10, description="Optional: cancel for specific coin only"
    )

    @field_validator("coin")
    @classmethod
    def validate_coin(cls, v: Optional[str]) -> Optional[str]:
        """Validate coin symbol format if provided."""
        if v is not None and not SecurityValidator.validate_coin_symbol(v):
            raise ValueError(f"Invalid coin symbol: {v}")
        return v.upper() if v else None


class ClosePositionRequest(BaseTradingRequest):
    """Request body for closing a position."""

    coin: str = Field(..., min_length=2, max_length=10, description="Trading pair symbol")

    @field_validator("coin")
    @classmethod
    def validate_coin(cls, v: str) -> str:
        """Validate coin symbol format."""
        if not SecurityValidator.validate_coin_symbol(v):
            raise ValueError(f"Invalid coin symbol: {v}")
        return v.upper()


class ModifyPositionRequest(BaseTradingRequest):
    """Request body for modifying position size."""

    coin: str = Field(..., min_length=2, max_length=10, description="Trading pair symbol")
    addSize: Optional[float] = Field(
        default=None, gt=0, le=1000000, description="Size to add to position"
    )
    reduceSize: Optional[float] = Field(
        default=None, gt=0, le=1000000, description="Size to reduce from position"
    )

    @field_validator("coin")
    @classmethod
    def validate_coin(cls, v: str) -> str:
        """Validate coin symbol format."""
        if not SecurityValidator.validate_coin_symbol(v):
            raise ValueError(f"Invalid coin symbol: {v}")
        return v.upper()

    @model_validator(mode="after")
    def validate_position_modification(self) -> "ModifyPositionRequest":
        """Validate exactly one operation is specified."""
        if self.addSize is None and self.reduceSize is None:
            raise ValueError("Either addSize or reduceSize must be provided")

        if self.addSize is not None and self.reduceSize is not None:
            raise ValueError("Cannot provide both addSize and reduceSize")

        return self


class SetMarginModeRequest(BaseTradingRequest):
    """Request body for setting margin mode."""

    coin: str = Field(..., min_length=2, max_length=10, description="Trading pair symbol")
    marginType: Literal['cross', 'isolated'] = Field(
        ..., alias='marginType', description="Margin mode: cross or isolated"
    )

    @field_validator("coin")
    @classmethod
    def validate_coin(cls, v: str) -> str:
        """Validate coin symbol format."""
        if not SecurityValidator.validate_coin_symbol(v):
            raise ValueError(f"Invalid coin symbol: {v}")
        return v.upper()
