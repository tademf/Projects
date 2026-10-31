"""
NEXUS Remote — configuration and runtime state.

Holds:
    - App metadata (name, version)
    - Pairing PIN (generated once per startup, stored in memory)
    - Token lifetime settings
    - Allowed file-transfer directory (Phase 6)

Environment overrides (optional):
    NEXUS_PORT              → default 8000
    NEXUS_TOKEN_TTL_HOURS   → default 24
"""

import os
import secrets
from datetime import timedelta


# ---------------------------------------------------------------------------
# App metadata
# ---------------------------------------------------------------------------
APP_NAME = "NEXUS Remote"
APP_VERSION = "0.2.0"
PHASE = 2


# ---------------------------------------------------------------------------
# Server settings
# ---------------------------------------------------------------------------
HOST = "0.0.0.0"
PORT = int(os.getenv("NEXUS_PORT", "8000"))


# ---------------------------------------------------------------------------
# Pairing PIN
# ---------------------------------------------------------------------------
def _generate_pin() -> str:
    """
    Generate a cryptographically secure 6-digit PIN.

    Uses `secrets`, NOT `random`:
        - `random` is predictable (seeded from time)
        - `secrets` pulls from OS entropy → unguessable

    Result: "000000" to "999999", zero-padded.
    """
    return f"{secrets.randbelow(1_000_000):06d}"


# Generated ONCE per server startup. Regenerated on restart.
PAIRING_PIN: str = _generate_pin()


# ---------------------------------------------------------------------------
# Token settings
# ---------------------------------------------------------------------------
TOKEN_BYTES = 32  # 32 bytes = 256 bits of entropy (industry standard)
TOKEN_TTL = timedelta(hours=int(os.getenv("NEXUS_TOKEN_TTL_HOURS", "24")))


# ---------------------------------------------------------------------------
# Display helper — print PIN nicely on startup
# ---------------------------------------------------------------------------
def print_startup_banner() -> None:
    """Print a friendly banner with the PIN on server startup."""
    line = "=" * 60
    print()
    print(line)
    print(f"  {APP_NAME} v{APP_VERSION} — Phase {PHASE}")
    print(line)
    print(f"  Pairing PIN:  {PAIRING_PIN}")
    print(f"  Open:         http://localhost:{PORT}/docs")
    print(f"  Phone URL:    http://<PC-IP>:{PORT}/")
    print(line)
    print()