"""
NEXUS Remote — SQLAlchemy database configuration.

Uses SQLite because:
    - Zero configuration (single file, no server to run)
    - Perfect for a local-LAN app
    - Ships with Python (via sqlite3 driver)

The database file lives at: backend/nexus.db
"""

from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
# __file__ = backend/app/database/database.py
# .parent  = backend/app/database/
# .parent  = backend/app/
# .parent  = backend/
# Then we drop nexus.db into backend/nexus.db
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DATABASE_PATH = BACKEND_DIR / "nexus.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------
# `check_same_thread=False` is required for SQLite + FastAPI (multi-threaded).
# FastAPI's async workers each get a thread — SQLite defaults to disallowing
# access from other threads, so we relax that. SQLAlchemy handles the safety.
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,  # set True for SQL debug logging
)


# ---------------------------------------------------------------------------
# Session factory
# ---------------------------------------------------------------------------
# Every request gets its own Session object → use `get_db()` as a FastAPI dep.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ---------------------------------------------------------------------------
# Base class for models
# ---------------------------------------------------------------------------
class Base(DeclarativeBase):
    """All ORM models inherit from this."""
    pass


# ---------------------------------------------------------------------------
# Dependency — yields a session, always closes it
# ---------------------------------------------------------------------------
def get_db():
    """
    FastAPI dependency: gives each request a fresh Session.

    Usage in a route:
        @app.get("/something")
        def endpoint(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Init — create tables (idempotent, safe to call every startup)
# ---------------------------------------------------------------------------
def init_db() -> None:
    """Create all tables if they don't already exist."""
    # Import models so SQLAlchemy knows about them before create_all()
    from app.database import models  # noqa: F401
    Base.metadata.create_all(bind=engine)