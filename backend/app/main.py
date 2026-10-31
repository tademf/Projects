"""
NEXUS Remote — FastAPI backend entry point.

Phase 1 scope:
    - Health check endpoint (/health)
    - Root endpoint (/) so we can confirm the server is reachable

Everything else (WebSocket, auth, controllers) comes in later phases.
"""

from datetime import datetime, timezone

from fastapi import FastAPI

# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------
# `title` and `version` show up in the auto-generated /docs page.
# We'll add CORS + auth middleware in later phases.
app = FastAPI(
    title="NEXUS Remote",
    description="Your PC. Your Phone. One Connected Experience.",
    version="0.1.0",
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/")
async def root():
    """Friendly landing endpoint — confirms the server is up."""
    return {
        "app": "NEXUS Remote",
        "message": "Server is running",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
async def health():
    """
    Health check endpoint.

    The Android phone will hit this to verify it can reach the PC
    before attempting any other operations.
    """
    return {
        "status": "ok",
        "service": "nexus-remote-backend",
        "version": "0.1.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }              