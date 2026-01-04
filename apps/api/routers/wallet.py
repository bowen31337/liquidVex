"""
Session Key Management API Endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import hashlib
import secrets
import logging

from config import settings
from services.wallet_service import WalletService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/wallet", tags=["wallet"])

class SessionKeyRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    permissions: List[str] = Field(["trade", "view"], description="List of permissions for this session key")

class SessionKeyResponse(BaseModel):
    id: str
    name: str
    address: str
    created_at: datetime
    last_used: datetime
    is_active: bool
    permissions: List[str]

class RevokeSessionKeyResponse(BaseModel):
    success: bool
    message: str

# In-memory storage for session keys (in production, this should be a database)
session_keys_db = {}

@router.post("/create-session-key", response_model=SessionKeyResponse)
async def create_session_key(
    request: SessionKeyRequest,
    background_tasks: BackgroundTasks,
    wallet_service: WalletService = Depends()
):
    """
    Create a new session key for reduced signing requirements.
    """
    try:
        # Create a new wallet service instance
        service = WalletService()

        # Create session key
        session_key = await service.create_session_key(
            name=request.name,
            permissions=request.permissions
        )

        # Add background task to log the creation
        background_tasks.add_task(
            logger.info,
            f"Session key created: {session_key.id} for address {session_key.address}"
        )

        return SessionKeyResponse(
            id=session_key.id,
            name=session_key.name,
            address=session_key.address,
            created_at=session_key.created_at,
            last_used=session_key.last_used,
            is_active=session_key.is_active,
            permissions=session_key.permissions
        )

    except Exception as e:
        logger.error(f"Failed to create session key: {e}")
        raise HTTPException(status_code=500, detail="Failed to create session key")

@router.post("/revoke-session-key/{key_id}", response_model=RevokeSessionKeyResponse)
async def revoke_session_key(
    key_id: str,
    background_tasks: BackgroundTasks
):
    """
    Revoke a session key, requiring wallet signature for future operations.
    """
    try:
        # Create a new wallet service instance
        service = WalletService()

        # Get the session key first to get its address
        session_key = await service.get_session_key(key_id)
        if not session_key:
            raise HTTPException(status_code=404, detail="Session key not found")

        if not session_key.is_active:
            return RevokeSessionKeyResponse(
                success=True,
                message="Session key was already revoked"
            )

        # Revoke the session key
        success = await service.revoke_session_key(key_id)
        if not success:
            raise HTTPException(status_code=404, detail="Session key not found")

        # Add background task to log the revocation
        background_tasks.add_task(
            logger.info,
            f"Session key revoked: {key_id} for address {session_key.address}"
        )

        return RevokeSessionKeyResponse(
            success=True,
            message="Session key revoked successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to revoke session key {key_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to revoke session key")

@router.get("/session-keys", response_model=List[SessionKeyResponse])
async def get_session_keys():
    """
    Get all session keys for the current user.
    """
    try:
        # Create a new wallet service instance
        service = WalletService()

        # Get all session keys
        session_keys = await service.get_all_session_keys()

        # Convert to response model
        return [
            SessionKeyResponse(
                id=key.id,
                name=key.name,
                address=key.address,
                created_at=key.created_at,
                last_used=key.last_used,
                is_active=key.is_active,
                permissions=key.permissions
            )
            for key in session_keys
        ]

    except Exception as e:
        logger.error(f"Failed to get session keys: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve session keys")

@router.get("/session-keys/{key_id}", response_model=SessionKeyResponse)
async def get_session_key(key_id: str):
    """
    Get details for a specific session key.
    """
    try:
        # Create a new wallet service instance
        service = WalletService()

        session_key = await service.get_session_key(key_id)
        if not session_key:
            raise HTTPException(status_code=404, detail="Session key not found")

        return SessionKeyResponse(
            id=session_key.id,
            name=session_key.name,
            address=session_key.address,
            created_at=session_key.created_at,
            last_used=session_key.last_used,
            is_active=session_key.is_active,
            permissions=session_key.permissions
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get session key {key_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve session key")

@router.delete("/session-keys/{key_id}", response_model=RevokeSessionKeyResponse)
async def delete_session_key(
    key_id: str,
    background_tasks: BackgroundTasks
):
    """
    Delete a session key completely from the system.
    """
    try:
        # Create a new wallet service instance
        service = WalletService()

        session_key = await service.get_session_key(key_id)
        if not session_key:
            raise HTTPException(status_code=404, detail="Session key not found")

        # Delete the session key
        success = await service.delete_session_key(key_id)
        if not success:
            raise HTTPException(status_code=404, detail="Session key not found")

        # Add background task to log the deletion
        background_tasks.add_task(
            logger.info,
            f"Session key deleted: {key_id} for address {session_key.address}"
        )

        return RevokeSessionKeyResponse(
            success=True,
            message="Session key deleted successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete session key {key_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete session key")

@router.post("/verify-session-key/{key_id}")
async def verify_session_key(key_id: str):
    """
    Verify that a session key is still active and valid.
    """
    try:
        # Create a new wallet service instance
        service = WalletService()

        session_key = await service.get_session_key(key_id)
        if not session_key:
            raise HTTPException(status_code=404, detail="Session key not found")

        if not session_key.is_active:
            raise HTTPException(status_code=400, detail="Session key has been revoked")

        # Verify the session key (this updates last_used timestamp)
        valid = await service.verify_session_key(key_id)
        if not valid:
            raise HTTPException(status_code=400, detail="Session key verification failed")

        return {
            "valid": True,
            "key_id": key_id,
            "permissions": session_key.permissions,
            "last_used": session_key.last_used
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to verify session key {key_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify session key")