"""
NEXUS Remote — FastAPI backend entry point.

Phase 1: Health endpoints ✅
Phase 2: Database layer (in progress)

The database auto-creates tables on startup. Safe to restart — tables
are only created if they don't already exist.
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI

from app.database.database import init_db


# ---------------------------------------------------------------------------
# Lifespan — runs on startup and shutdown
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP
    print("[NEXUS] Initializing database...")
    init_db()
    print("[NEXUS] Database ready.")
    yield
    # SHUTDOWN
    print("[NEXUS] Shutting down.")


# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title="NEXUS Remote",
    description="Your PC. Your Phone. One Connected Experience.",
    version="0.2.0",  # bumped for Phase 2
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/")
async def root():
    """Friendly landing endpoint — confirms the server is up."""
    return {
        "app": "NEXUS Remote",
        "version": "0.2.0",
        "message": "Server is running",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
async def health():
    """Health check endpoint used by the phone."""
    return {
        "status": "ok",
        "service": "nexus-remote-backend",
        "version": "0.2.0",
        "phase": "2",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }