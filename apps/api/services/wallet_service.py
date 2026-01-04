"""
Wallet Service for session key management and wallet operations
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class SessionKey:
    id: str
    name: str
    address: str
    created_at: datetime
    last_used: datetime
    is_active: bool
    permissions: List[str]

class WalletService:
    """Service for managing wallet operations and session keys"""

    def __init__(self):
        # In-memory storage for session keys (in production, this should be a database)
        self._session_keys: Dict[str, SessionKey] = {}

    async def create_session_key(
        self,
        name: str,
        permissions: List[str],
        address: Optional[str] = None
    ) -> SessionKey:
        """Create a new session key"""
        import secrets
        import hashlib

        # Generate a unique session key ID
        session_key_id = secrets.token_urlsafe(32)

        # Generate address if not provided
        if not address:
            address = "0x" + hashlib.sha256(f"{session_key_id}_{name}".encode()).hexdigest()[:40]

        # Create session key
        session_key = SessionKey(
            id=session_key_id,
            name=name,
            address=address,
            created_at=datetime.utcnow(),
            last_used=datetime.utcnow(),
            is_active=True,
            permissions=permissions
        )

        # Store in our database
        self._session_keys[session_key_id] = session_key

        logger.info(f"Session key created: {session_key_id} for address {address}")
        return session_key

    async def revoke_session_key(self, key_id: str) -> bool:
        """Revoke a session key"""
        if key_id not in self._session_keys:
            return False

        session_key = self._session_keys[key_id]
        if not session_key.is_active:
            return True  # Already revoked

        # Mark as revoked
        session_key.is_active = False
        session_key.last_used = datetime.utcnow()

        logger.info(f"Session key revoked: {key_id} for address {session_key.address}")
        return True

    async def get_session_key(self, key_id: str) -> Optional[SessionKey]:
        """Get a specific session key"""
        return self._session_keys.get(key_id)

    async def get_all_session_keys(self) -> List[SessionKey]:
        """Get all session keys"""
        return list(self._session_keys.values())

    async def verify_session_key(self, key_id: str) -> bool:
        """Verify that a session key is still active and valid"""
        session_key = await self.get_session_key(key_id)
        if not session_key:
            return False

        if not session_key.is_active:
            return False

        # Update last used timestamp
        session_key.last_used = datetime.utcnow()
        return True

    async def delete_session_key(self, key_id: str) -> bool:
        """Delete a session key completely"""
        if key_id not in self._session_keys:
            return False

        session_key = self._session_keys.pop(key_id)
        logger.info(f"Session key deleted: {key_id} for address {session_key.address}")
        return True

    async def get_active_session_keys(self) -> List[SessionKey]:
        """Get all active session keys"""
        return [key for key in self._session_keys.values() if key.is_active]

    async def cleanup_expired_session_keys(self, max_age_hours: int = 24) -> int:
        """Clean up expired session keys (placeholder for future implementation)"""
        # This would be useful for cleaning up old session keys
        # For now, we don't expire session keys automatically
        return 0