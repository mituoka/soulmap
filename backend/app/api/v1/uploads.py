from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.core.security import get_current_user
import uuid
import os
from pathlib import Path

router = APIRouter()

# アップロードディレクトリ
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """画像をアップロード"""
    # ファイル拡張子チェック
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # ファイルサイズチェック
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {MAX_FILE_SIZE // 1024 // 1024}MB"
        )

    # ユニークなファイル名を生成
    filename = f"{uuid.uuid4()}{ext}"
    file_path = UPLOAD_DIR / filename

    # ファイルを保存
    with open(file_path, "wb") as f:
        f.write(contents)

    # URLを返す
    image_url = f"/uploads/{filename}"
    return {"url": image_url, "filename": filename}
