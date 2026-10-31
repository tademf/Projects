"""
NEXUS Remote — Authentication routes.

Endpoints:
    POST /auth/pair      — exchange PIN for an auth token
    GET  /auth/verify    — check if a token is still valid
    POST /auth/disconnect — revoke the current token
"""

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.security.pairing import (
    create_device_token,
    revoke_token,
    validate_token,
    verify_pin,
)


router = APIRouter(prefix="/auth", tags=["auth"])


class PairRequest(BaseModel):
    pin: str = Field(..., min_length=6, max_length=6)
    device_name: str = Field(..., min_length=1, max_length=120)
    device_fingerprint: str = Field(..., min_length=16, max_length=128)


class PairResponse(BaseModel):
    token: str
    device_id: int
    device_name: str
    message: str


class VerifyResponse(BaseModel):
    valid: bool
    device_id: int | None = None
    device_name: str | None = None


def get_bearer_token(authorization: str | None = Header(default=None)) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must be 'Bearer <token>'",
        )
    return parts[1]


@router.post("/pair", response_model=PairResponse)
def pair_device(payload: PairRequest, db: Session = Depends(get_db)):
    if not verify_pin(payload.pin):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid PIN",
        )
    device, plaintext_token = create_device_token(
        db=db,
        device_name=payload.device_name,
        device_fingerprint=payload.device_fingerprint,
    )
    return PairResponse(
        token=plaintext_token,
        device_id=device.id,
        device_name=device.device_name,
        message="Paired successfully. Store the token securely.",
    )


@router.get("/verify", response_model=VerifyResponse)
def verify_auth(
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db),
):
    device = validate_token(db, token)
    if device is None:
        return VerifyResponse(valid=False)
    return VerifyResponse(
        valid=True,
        device_id=device.id,
        device_name=device.device_name,
    )


@router.post("/disconnect")
def disconnect(
    token: str = Depends(get_bearer_token),
    db: Session = Depends(get_db),
):
    ok = revoke_token(db, token)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token not found",
        )
    return {"message": "Token revoked"}