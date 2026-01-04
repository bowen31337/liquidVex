"""
Input Validation and Security Module

Provides enhanced validation for API requests including:
- SQL injection prevention
- XSS attack prevention
- Data type validation
- Signature verification placeholder
- Sanitization of user inputs
"""

import re
from typing import Any
from fastapi import HTTPException, Request
from pydantic import field_validator, model_validator


class SecurityValidator:
    """Security validation utilities for API requests."""

    # SQL injection patterns
    SQL_INJECTION_PATTERNS = [
        r"(\bunion\b.*\bselect\b)",
        r"(\bselect\b.*\bfrom\b)",
        r"(\binsert\b.*\binto\b)",
        r"(\bdelete\b.*\bfrom\b)",
        r"(\bdrop\b.*\btable\b)",
        r"(\bexec\b|\bexecute\b)",
        r"(--|\#|\/\*|\*\/)",
        r"(\bor\b.*=.*\bor\b)",
        r"(\band\b.*=.*\band\b)",
        r"('.*--)",
        r"(1=1|1 = 1)",
    ]

    # XSS attack patterns
    XSS_PATTERNS = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"on\w+\s*=",  # Event handlers like onclick=
        r"<iframe",
        r"<embed",
        r"<object",
        r"eval\s*\(",
        r"expression\s*\(",
    ]

    # Path traversal patterns
    PATH_TRAVERSAL_PATTERNS = [
        r"\.\./",
        r"\.\.\.",
        r"~",
    ]

    @classmethod
    def check_sql_injection(cls, value: str) -> bool:
        """
        Check if a string contains SQL injection patterns.

        Args:
            value: String to check

        Returns:
            True if SQL injection detected
        """
        if not isinstance(value, str):
            return False

        value_lower = value.lower()

        for pattern in cls.SQL_INJECTION_PATTERNS:
            if re.search(pattern, value_lower, re.IGNORECASE):
                return True

        return False

    @classmethod
    def check_xss(cls, value: str) -> bool:
        """
        Check if a string contains XSS attack patterns.

        Args:
            value: String to check

        Returns:
            True if XSS attack detected
        """
        if not isinstance(value, str):
            return False

        value_lower = value.lower()

        for pattern in cls.XSS_PATTERNS:
            if re.search(pattern, value_lower, re.IGNORECASE):
                return True

        return False

    @classmethod
    def check_path_traversal(cls, value: str) -> bool:
        """
        Check if a string contains path traversal patterns.

        Args:
            value: String to check

        Returns:
            True if path traversal detected
        """
        if not isinstance(value, str):
            return False

        for pattern in cls.PATH_TRAVERSAL_PATTERNS:
            if re.search(pattern, value):
                return True

        return False

    @classmethod
    def sanitize_string(cls, value: str) -> str:
        """
        Sanitize a string by removing dangerous characters.

        Args:
            value: String to sanitize

        Returns:
            Sanitized string
        """
        if not isinstance(value, str):
            return value

        # Remove null bytes
        value = value.replace("\x00", "")

        # Trim whitespace
        value = value.strip()

        return value

    @classmethod
    def validate_input(cls, field_name: str, value: Any) -> None:
        """
        Comprehensive input validation.

        Args:
            field_name: Name of the field being validated
            value: Value to validate

        Raises:
            HTTPException: If validation fails
        """
        # Check string values for security issues
        if isinstance(value, str):
            # Sanitize first
            value = cls.sanitize_string(value)

            # Check SQL injection
            if cls.check_sql_injection(value):
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "Invalid input detected",
                        "field": field_name,
                        "reason": "SQL injection pattern detected",
                    },
                )

            # Check XSS
            if cls.check_xss(value):
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "Invalid input detected",
                        "field": field_name,
                        "reason": "XSS pattern detected",
                    },
                )

            # Check path traversal
            if cls.check_path_traversal(value):
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "Invalid input detected",
                        "field": field_name,
                        "reason": "Path traversal pattern detected",
                    },
                )

            # Check length limits
            if len(value) > 10000:  # 10KB limit per field
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "Input too large",
                        "field": field_name,
                        "max_length": 10000,
                    },
                )

    @classmethod
    def validate_signature_format(cls, signature: str) -> bool:
        """
        Validate signature format (hex string).

        Args:
            signature: Signature string to validate

        Returns:
            True if valid signature format
        """
        if not isinstance(signature, str):
            return False

        # Check if it's a hex string (0x prefix or just hex)
        signature_clean = signature.lower().replace("0x", "")

        # Check length (typical Ethereum signatures are 130 chars: 0x + 64 + 64)
        if len(signature_clean) not in [130, 132]:
            return False

        # Check if it's valid hex
        try:
            int(signature_clean, 16)
            return True
        except ValueError:
            return False

    @classmethod
    def validate_coin_symbol(cls, coin: str) -> bool:
        """
        Validate cryptocurrency symbol format.

        Args:
            coin: Coin symbol to validate

        Returns:
            True if valid coin symbol
        """
        if not isinstance(coin, str):
            return False

        # Coin symbols should be uppercase letters only, 2-10 characters
        if not re.match(r"^[A-Z]{2,10}$", coin):
            return False

        return True


async def validate_request_body(request: Request, body: dict) -> None:
    """
    Validate entire request body for security issues.

    Args:
        request: FastAPI Request object
        body: Request body as dictionary

    Raises:
        HTTPException: If validation fails
    """
    # Check total payload size
    import json
    body_size = len(json.dumps(body))
    if body_size > 1_000_000:  # 1MB limit
        raise HTTPException(
            status_code=413,
            detail={"error": "Request body too large", "max_size": "1MB"},
        )

    # Validate each field
    for field_name, field_value in body.items():
        # Skip signature validation (handled separately)
        if field_name in ["signature", "timestamp"]:
            continue

        SecurityValidator.validate_input(field_name, field_value)


def validate_trading_signature(signature: str, timestamp: int, max_age_seconds: int = 60) -> None:
    """
    Validate trading request signature and timestamp.

    Args:
        signature: Cryptographic signature
        timestamp: Request timestamp
        max_age_seconds: Maximum age of timestamp (default 60 seconds)

    Raises:
        HTTPException: If validation fails
    """
    import time

    # Validate signature format
    if not SecurityValidator.validate_signature_format(signature):
        raise HTTPException(
            status_code=401,
            detail={
                "error": "Invalid signature format",
                "expected": "Hex string (0x...)",
            },
        )

    # Validate timestamp
    current_time = int(time.time())
    time_diff = abs(current_time - timestamp)

    if time_diff > max_age_seconds:
        raise HTTPException(
            status_code=401,
            detail={
                "error": "Request timestamp expired",
                "provided": timestamp,
                "current": current_time,
                "max_age": max_age_seconds,
            },
        )

    # In production, verify the signature against the user's public key
    # This is a placeholder for actual cryptographic verification
    # Example:
    # verify_eth_signature(signature, message_hash, public_key)
