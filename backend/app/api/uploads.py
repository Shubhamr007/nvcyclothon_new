import re
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from ..core.config import settings
from ..db import get_db
from ..models import WholesaleUpload
from ..schemas import UploadRead
from ..core.security import require_admin

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

_CONTENT_TYPES = {
    "csv": {"text/csv", "application/csv", "application/vnd.ms-excel"},
    "xlsx": {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
    "pdf": {"application/pdf"},
}


def safe_name(name: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]", "_", name.rsplit("/", 1)[-1])[:120] or "upload"


def _validate_upload(filename: str, content_type: Optional[str], content: bytes) -> None:
    extension = Path(filename).suffix.lower().lstrip(".")
    allowed = {item.strip().lower() for item in settings.allowed_upload_extensions.split(",")}
    if extension not in allowed or extension not in _CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="This file type is not permitted")
    if content_type not in _CONTENT_TYPES[extension]:
        raise HTTPException(status_code=415, detail="File content type does not match its extension")
    # Do not trust a browser-provided MIME type alone.
    if extension == "pdf" and not content.startswith(b"%PDF-"):
        raise HTTPException(status_code=415, detail="Invalid PDF file")
    if extension == "xlsx" and not content.startswith(b"PK\x03\x04"):
        raise HTTPException(status_code=415, detail="Invalid spreadsheet file")
    if extension == "csv" and b"\x00" in content:
        raise HTTPException(status_code=415, detail="Invalid CSV file")


@router.post("", response_model=list[UploadRead], status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
async def upload_wholesale_files(files: list[UploadFile] = File(...), db: Session = Depends(get_db)):
    if not files or len(files) > settings.max_files_per_upload:
        raise HTTPException(status_code=400, detail=f"Upload 1 to {settings.max_files_per_upload} files")
    created = []
    for item in files:
        content = await item.read(settings.max_upload_size_bytes + 1)
        if len(content) > settings.max_upload_size_bytes:
            raise HTTPException(status_code=413, detail=f"{item.filename} exceeds the 25 MB limit")
        filename = safe_name(item.filename or "upload")
        _validate_upload(filename, item.content_type, content)
        storage_key = f"{uuid.uuid4().hex}_{filename}"
        (settings.upload_path / storage_key).write_bytes(content)
        record = WholesaleUpload(original_name=filename, storage_key=storage_key, content_type=item.content_type, size_bytes=len(content))
        db.add(record)
        created.append(record)
    db.commit()
    for record in created:
        db.refresh(record)
    return created
