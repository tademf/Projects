"""
NEXUS Remote — Pairing and token logic.

Security model:
    - PIN is short-lived (memory only, regenerates on server restart)
    - Tokens are 32 random bytes → cryptographically unguessable
    - Only SHA-256 HASHES of tokens are stored in the DB
    - Token validation = hash(submitted) → DB lookup → check expiry/revocation

Why SHA-256 for tokens and not bcrypt:
    - Tokens are 256-bit random values, not user-chosen passwords
    - Brute-forcing a 256-bit token is computationally infeasible
    - bcrypt is for slow-hashing (needed only for low-entropy passwords)
    - SHA-256 is the correct choice for high-entropy tokens
"""

import hashlib
import hmac
import secrets
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.config import PAIRING_PIN, TOKEN_BYTES, TOKEN_TTL
from app.database.models import AuthToken, Device


# ---------------------------------------------------------------------------
# PIN verification
# ---------------------------------------------------------------------------
def verify_pin(submitted_pin: str) -> bool:
    """
    Constant-time PIN comparison.

    Uses `hmac.compare_digest` instead of `==` so response time does NOT
    leak how many characters matched. Prevents timing attacks.
    """
    if not submitted_pin:
        return False
    # Compare as bytes to avoid Unicode oddities
    return hmac.compare_digest(
        submitted_pin.encode("utf-8"),
        PAIRING_PIN.encode("utf-8"),
    )


# ---------------------------------------------------------------------------
# Token generation
# ---------------------------------------------------------------------------
def generate_token() -> tuple[str, str]:
    """
    Generate a new auth token.

    Returns:
        (plaintext_token, sha256_hash)

    The plaintext is sent to the phone once. The hash goes in the DB.
    """
    raw = secrets.token_urlsafe(TOKEN_BYTES)  # URL-safe base64, no padding
    return raw, hash_token(raw)


def hash_token(token: str) -> str:
    """SHA-256 hex digest of a token."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------------------
# Device + token creation
# ---------------------------------------------------------------------------
def create_device_token(
    db: Session,
    device_name: str,
    device_fingerprint: str,
) -> tuple[Device, str]:
    """
    Pair a device and issue a token.

    Flow:
        1. If a Device with this fingerprint exists → reuse it (re-pair)
        2. Otherwise create a new Device row
        3. Generate token, store hash + expiry in auth_tokens
        4. Return (device, plaintext_token)

    Re-pairing the same phone updates `last_seen_at` and issues a fresh
    token, but doesn't create a duplicate row.
    """
    # Find or create device
    device = (
        db.query(Device)
        .filter(Device.device_fingerprint == device_fingerprint)
        .first()
    )
    if device is None:
        device = Device(
            device_name=device_name,
            device_fingerprint=device_fingerprint,
            is_active=True,
        )
        db.add(device)
    else:
        # Re-pair → refresh name + re-activate if previously revoked
        device.device_name = device_name
        device.is_active = True
        device.last_seen_at = datetime.now(timezone.utc)

    db.flush()  # ensure device.id is populated before linking token

    # Generate token
    plaintext, token_hash = generate_token()
    token_row = AuthToken(
        device_id=device.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + TOKEN_TTL,
        is_revoked=False,
    )
    db.add(token_row)
    db.commit()
    db.refresh(device)

    return device, plaintext


# ---------------------------------------------------------------------------
# Token validation (used by protected endpoints)
# ---------------------------------------------------------------------------
def validate_token(db: Session, token: str) -> Device | None:
    """
    Validate a token and return the associated active device.

    Returns None if:
        - Token hash not in DB
        - Token expired
        - Token revoked
        - Device inactive

    Also updates `device.last_seen_at` on success.
    """
    if not token:
        return None

    token_hash = hash_token(token)
    row = (
        db.query(AuthToken)
        .filter(AuthToken.token_hash == token_hash)
        .first()
    )
    if row is None:
        return None

    now = datetime.now(timezone.utc)

    # `expires_at` from SQLite comes back naive (no tzinfo). Normalize it.
    expires_at = row.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if row.is_revoked or expires_at <= now:
        return None

    device = db.query(Device).filter(Device.id == row.device_id).first()
    if device is None or not device.is_active:
        return None

    # Update last_seen_at
    device.last_seen_at = now
    db.commit()

    return device


# ---------------------------------------------------------------------------
# Token revocation (logout)
# ---------------------------------------------------------------------------
def revoke_token(db: Session, token: str) -> bool:
    """Mark a token as revoked. Returns True if found & revoked."""
    if not token:
        return False
    token_hash = hash_token(token)
    row = (
        db.query(AuthToken)
        .filter(AuthToken.token_hash == token_hash)
        .first()
    )
    if row is None:
        return False
    row.is_revoked = True
    db.commit()
    return True