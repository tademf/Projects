"""
NEXUS Remote — WebSocket system stats streamer + input handler.

Endpoint:  ws://<PC-IP>:8000/ws/system?token=<bearer-token>

Streams live CPU/RAM/disk/etc. every second AND listens for mouse commands.
Requires a valid auth token. Invalid/missing token → connection closed with code 4401.
"""

import asyncio
import json
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.database.database import SessionLocal
from app.security.pairing import validate_token
from app.services.system_monitor import get_device_info, get_system_stats, format_uptime
from app.controllers.input_controller import move_mouse, click_mouse

router = APIRouter(tags=["websocket"])

STREAM_INTERVAL_SECONDS = 1.0


def _validate_ws_token(token: str | None) -> bool:
    """Validate a token using a fresh DB session (WebSocket has no DI)."""
    if not token:
        return False
    db = SessionLocal()
    try:
        device = validate_token(db, token)
        return device is not None
    finally:
        db.close()


@router.websocket("/ws/system")
async def system_ws(websocket: WebSocket):
    """
    WebSocket endpoint for live system stats AND mouse control.
    """
    token = websocket.query_params.get("token")

    # Auth check
    if not _validate_ws_token(token):
        await websocket.close(code=4401)
        return

    await websocket.accept()

    # Send device info once
    try:
        await websocket.send_text(json.dumps({
            "type": "hello",
            "device": get_device_info(),
            "server_time": datetime.now(timezone.utc).isoformat(),
            "interval_ms": int(STREAM_INTERVAL_SECONDS * 1000),
        }))
    except Exception:
        await websocket.close()
        return

    # Stream loop AND listen for input commands
    try:
        while True:
            # 1. Send stats
            stats = get_system_stats()
            payload = {
                "type": "stats",
                "data": stats,
                "uptime_human": format_uptime(stats["uptime_seconds"]),
            }
            await websocket.send_text(json.dumps(payload))

            # 2. Wait for incoming mouse commands (with 1s timeout)
            try:
                message = await asyncio.wait_for(
                    websocket.receive_text(), timeout=STREAM_INTERVAL_SECONDS
                )
                data = json.loads(message)
                if data.get("type") == "mouse_move":
                    move_mouse(data["dx"], data["dy"])
                elif data.get("type") == "mouse_click":
                    click_mouse(data["button"])
            except asyncio.TimeoutError:
                pass  # No message in 1s, just loop and send stats again

    except WebSocketDisconnect:
        return
    except Exception:
        try:
            await websocket.close()
        except Exception:
            pass
        return