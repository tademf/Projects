"""
NEXUS Remote — SQLAlchemy ORM models.

Tables:
    devices      — one row per paired Android phone
    auth_tokens  — one row per login session (tokens stored HASHED)
"""

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


def utcnow() -> datetime:
    """Timezone-aware UTC now — SQLite stores this as ISO string."""
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Device
# ---------------------------------------------------------------------------
class Device(Base):
    """
    A paired Android phone.

    `device_fingerprint` is a stable identifier the phone generates once
    (e.g. hashed from a UUID stored in IndexedDB). Prevents duplicate rows
    if a user re-pairs the same phone.
    """
    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    device_name: Mapped[str] = mapped_column(String(120), nullable=False)
    device_fingerprint: Mapped[str] = mapped_column(
        String(128), nullable=False, unique=True, index=True
    )
    paired_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # One device → many tokens
    tokens: Mapped[list["AuthToken"]] = relationship(
        "AuthToken", back_populates="device", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Device id={self.id} name={self.device_name!r}>"


# ---------------------------------------------------------------------------
# AuthToken
# ---------------------------------------------------------------------------
class AuthToken(Base):
    """
    A session token issued after successful pairing.

    We ONLY store `token_hash` (SHA-256). The plaintext token is returned
    to the phone once — if it's lost, the user re-pairs.
    """
    __tablename__ = "auth_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    device_id: Mapped[int] = mapped_column(
        ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_hash: Mapped[str] = mapped_column(
        String(64), nullable=False, unique=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    device: Mapped["Device"] = relationship("Device", back_populates="tokens")

    # Composite index for "find valid tokens for this device" queries
    __table_args__ = (
        Index("ix_tokens_device_valid", "device_id", "is_revoked"),
    )

    def __repr__(self) -> str:
        return f"<AuthToken id={self.id} device_id={self.device_id}>"