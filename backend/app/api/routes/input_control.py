"""
NEXUS Remote — Input control routes (Mouse & Keyboard).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.api.routes.auth import get_bearer_token
from app.security.pairing import validate_token
from app.controllers.mouse_controller import move_mouse, click_mouse, scroll_mouse

router = APIRouter(prefix="/input", tags=["input"])

class MouseMove(BaseModel):
    dx: int = Field(..., ge=-500, le=500)
    dy: int = Field(..., ge=-500, le=500)

class MouseClick(BaseModel):
    button: str = Field(default="left", pattern="^(left|right|middle)$")

class MouseScroll(BaseModel):
    dy: int = Field(..., ge=-20, le=20)

def require_auth(token: str = Depends(get_bearer_token), db: Session = Depends(get_db)):
    device = validate_token(db, token)
    if not device:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return device

@router.post("/mouse/move")
def api_mouse_move(payload: MouseMove, _=Depends(require_auth)):
    if move_mouse(payload.dx, payload.dy):
        return {"status": "ok"}
    raise HTTPException(status_code=500, detail="Failed to move mouse")

@router.post("/mouse/click")
def api_mouse_click(payload: MouseClick, _=Depends(require_auth)):
    if click_mouse(payload.button):
        return {"status": "ok"}
    raise HTTPException(status_code=500, detail="Failed to click mouse")

@router.post("/mouse/scroll")
def api_mouse_scroll(payload: MouseScroll, _=Depends(require_auth)):
    if scroll_mouse(payload.dy):
        return {"status": "ok"}
    raise HTTPException(status_code=500, detail="Failed to scroll")