"""
NEXUS Remote — File Transfer routes.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.api.routes.auth import get_bearer_token
from app.security.pairing import validate_token
from app.controllers.file_controller import get_upload_dir, is_safe_path, get_file_list

router = APIRouter(prefix="/files", tags=["files"])

def require_auth(token: str = Depends(get_bearer_token), db: Session = Depends(get_db)):
    device = validate_token(db, token)
    if not device:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return device

@router.get("/list")
def list_files(_=Depends(require_auth)):
    return {"files": get_file_list()}

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), _=Depends(require_auth)):
    if not is_safe_path(file.filename):
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    upload_dir = get_upload_dir()
    file_path = upload_dir / file.filename
    
    try:
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                buffer.write(chunk)
        return {"status": "ok", "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{filename}")
def download_file(filename: str, _=Depends(require_auth)):
    if not is_safe_path(filename):
        raise HTTPException(status_code=400, detail="Invalid filename")
        
    file_path = get_upload_dir() / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(path=file_path, filename=filename, media_type="application/octet-stream")