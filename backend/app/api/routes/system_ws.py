"""
NEXUS Remote — WebSocket system stats streamer.

Endpoint:  ws://<PC-IP>:8000/ws/system?token=<bearer-token>

Streams live CPU/RAM/disk/etc. every second.
Requires a valid auth token. Invalid/missing token → connection closed with code 4401.
"""

import asyncio
import json
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.database.database import SessionLocal
from app.security.pairing import validate_token
from app.services.system_monitor import get_device_info, get_system_stats, format_uptime


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
    WebSocket endpoint for live system stats.

    Query param: ?token=<auth-token>
    First message sent: {"type": "hello", "device": {...}}
    Then every second:  {"type": "stats", "data": {...}}
    """
    token = websocket.query_params.get("token")

    # Auth check
    if not _validate_ws_token(token):
        await websocket.close(code=4401)  # 4401 = custom "Unauthorized"
        return

    await websocket.accept()

    # Send device info once, so the UI can render header
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

    # Stream loop
    try:
        while True:
            stats = get_system_stats()
            payload = {
                "type": "stats",
                "data": stats,
                "uptime_human": format_uptime(stats["uptime_seconds"]),
            }
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(STREAM_INTERVAL_SECONDS)
    except WebSocketDisconnect:
        # Client closed → clean exit
        return
    except Exception:
        # Anything else → close cleanly, don't crash the server
        try:
            await websocket.close()
        except Exception:
            pass
        return