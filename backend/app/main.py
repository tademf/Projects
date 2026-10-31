"""
NEXUS Remote — FastAPI backend entry point.

Phase 1: Health endpoints ✅
Phase 2: Database + PIN + Pairing ✅
Phase 3: System monitor + WebSocket stream
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
# 👇 NEW IMPORT
from fastapi.middleware.cors import CORSMiddleware

from app.config import print_startup_banner, APP_VERSION, PHASE
from app.database.database import init_db
from app.api.routes import auth as auth_routes
from app.api.routes import system_ws


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[NEXUS] Initializing database...")
    init_db()
    print("[NEXUS] Database ready.")
    print_startup_banner()
    yield
    print("[NEXUS] Shutting down.")


app = FastAPI(
    title="NEXUS Remote",
    description="Your PC. Your Phone. One Connected Experience.",
    version=APP_VERSION,
    lifespan=lifespan,
)

# 👇 NEW CORS MIDDLEWARE BLOCK
# This allows your React app on port 5173 to talk to your FastAPI backend on port 8000.
# Without this, the browser blocks the fetch() request!
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (fine for local dev)
    allow_credentials=True,
    allow_methods=["*"],  # Allows POST, GET, etc.
    allow_headers=["*"],  # Allows Authorization headers
)

# Register routers
app.include_router(auth_routes.router)
app.include_router(system_ws.router)


@app.get("/")
async def root():
    return {
        "app": "NEXUS Remote",
        "version": APP_VERSION,
        "phase": PHASE,
        "message": "Server is running",
        "docs": "/docs",
        "health": "/health",
        "auth": "/auth/pair",
        "ws": "/ws/system",
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "nexus-remote-backend",
        "version": APP_VERSION,
        "phase": PHASE,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }