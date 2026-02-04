from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.core.security import get_current_user
import uuid
import io
from pathlib import Path
from PIL import Image

router = APIRouter()

# アップロードディレクトリ
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif", ".heic", ".heif", ".svg"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
JPEG_QUALITY = 92


def compress_image(contents: bytes, ext: str) -> tuple[bytes, str]:
    """画像をリサイズ・圧縮して返す（元の品質をできるだけ維持）"""
    # SVGはそのまま返す
    if ext == ".svg":
        return contents, ext

    # GIFはアニメーションの可能性があるのでそのまま返す
    if ext == ".gif":
        return contents, ext

    img = Image.open(io.BytesIO(contents))

    # EXIF情報に基づいて回転を適用
    img = _apply_exif_orientation(img)

    output = io.BytesIO()
    if img.mode in ("RGBA", "P"):
        # 透過がある場合はWebPで保存（高品質）
        img.save(output, format="WEBP", quality=JPEG_QUALITY, method=6)
        return output.getvalue(), ".webp"
    elif ext == ".png":
        # PNGは透過なくてもPNGのまま保存
        img.save(output, format="PNG", optimize=True)
        return output.getvalue(), ".png"
    elif ext == ".webp":
        img.save(output, format="WEBP", quality=JPEG_QUALITY, method=6)
        return output.getvalue(), ".webp"
    else:
        img = img.convert("RGB")
        img.save(output, format="JPEG", quality=JPEG_QUALITY, optimize=True)
        return output.getvalue(), ".jpg"


def _apply_exif_orientation(img: Image.Image) -> Image.Image:
    """EXIF情報の回転を画像に適用"""
    try:
        from PIL import ExifTags
        exif = img.getexif()
        for tag, value in exif.items():
            if ExifTags.TAGS.get(tag) == "Orientation":
                if value == 3:
                    img = img.rotate(180, expand=True)
                elif value == 6:
                    img = img.rotate(270, expand=True)
                elif value == 8:
                    img = img.rotate(90, expand=True)
                break
    except Exception:
        pass
    return img


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """画像をアップロード（自動リサイズ・圧縮）"""
    # ファイル拡張子チェック
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"対応していないファイル形式です（{ext}）。対応形式: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # ファイルサイズチェック
    contents = await file.read()
    file_size_mb = len(contents) / 1024 / 1024
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"ファイルサイズが大きすぎます（{file_size_mb:.1f}MB）。上限: {MAX_FILE_SIZE // 1024 // 1024}MB"
        )

    # HEIC/HEIF → JPEGに変換
    if ext in (".heic", ".heif"):
        try:
            from pillow_heif import register_heif_opener
            register_heif_opener()
        except ImportError:
            raise HTTPException(
                status_code=400,
                detail="HEIC/HEIF形式のサポートに必要なライブラリがインストールされていません"
            )
        ext = ".jpg"

    # 画像を圧縮・リサイズ
    compressed, output_ext = compress_image(contents, ext)

    # ユニークなファイル名を生成
    filename = f"{uuid.uuid4()}{output_ext}"
    file_path = UPLOAD_DIR / filename

    # ファイルを保存
    with open(file_path, "wb") as f:
        f.write(compressed)

    # URLを返す
    image_url = f"/uploads/{filename}"
    return {"url": image_url, "filename": filename}
