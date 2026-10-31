"""
NEXUS Remote — Input control routes (Mouse, Keyboard, Media).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.api.routes.auth import get_bearer_token
from app.security.pairing import validate_token
from app.controllers.input_controller import (
    move_mouse, click_mouse, scroll_mouse,
    type_text, press_key, media_control
)

router = APIRouter(prefix="/input", tags=["input"])

# Schemas
class MouseMove(BaseModel):
    dx: int = Field(..., ge=-500, le=500)
    dy: int = Field(..., ge=-500, le=500)

class MouseClick(BaseModel):
    button: str = Field(default="left", pattern="^(left|right|middle)$")

class MouseScroll(BaseModel):
    dy: int = Field(..., ge=-20, le=20)

class KeyboardType(BaseModel):
    text: str = Field(..., max_length=500)

class KeyboardPress(BaseModel):
    key: str = Field(..., max_length=20)

class MediaAction(BaseModel):
    action: str = Field(..., pattern="^(playpause|next|prev|volup|voldown|mute)$")

def require_auth(token: str = Depends(get_bearer_token), db: Session = Depends(get_db)):
    device = validate_token(db, token)
    if not device:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return device

# Routes - Mouse
@router.post("/mouse/move")
def api_mouse_move(payload: MouseMove, _=Depends(require_auth)):
    return {"status": "ok"} if move_mouse(payload.dx, payload.dy) else HTTPException(500)

@router.post("/mouse/click")
def api_mouse_click(payload: MouseClick, _=Depends(require_auth)):
    return {"status": "ok"} if click_mouse(payload.button) else HTTPException(500)

@router.post("/mouse/scroll")
def api_mouse_scroll(payload: MouseScroll, _=Depends(require_auth)):
    return {"status": "ok"} if scroll_mouse(payload.dy) else HTTPException(500)

# Routes - Keyboard
@router.post("/keyboard/type")
def api_keyboard_type(payload: KeyboardType, _=Depends(require_auth)):
    return {"status": "ok"} if type_text(payload.text) else HTTPException(500)

@router.post("/keyboard/press")
def api_keyboard_press(payload: KeyboardPress, _=Depends(require_auth)):
    return {"status": "ok"} if press_key(payload.key) else HTTPException(500)

# Routes - Media
@router.post("/media")
def api_media(payload: MediaAction, _=Depends(require_auth)):
    return {"status": "ok"} if media_control(payload.action) else HTTPException(500)