"""
NEXUS Remote — File controller.
Handles secure file uploads and downloads.
"""
from pathlib import Path

# Define a secure folder on your PC to receive files
UPLOAD_DIR = Path.home() / "NexusTransfers"
UPLOAD_DIR.mkdir(exist_ok=True)

def get_upload_dir() -> Path:
    return UPLOAD_DIR

def is_safe_path(filename: str) -> bool:
    """Prevents directory traversal (e.g., ../../Windows/System32)"""
    return ".." not in filename and "/" not in filename and "\\" not in filename

def get_file_list() -> list[dict]:
    """Returns a list of files in the upload directory."""
    files = []
    for f in UPLOAD_DIR.iterdir():
        if f.is_file():
            files.append({
                "name": f.name,
                "size": f.stat().st_size,
                "modified": f.stat().st_mtime
            })
    return sorted(files, key=lambda x: x["modified"], reverse=True)