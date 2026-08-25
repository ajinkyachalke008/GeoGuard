import io
from typing import Tuple, Optional
from PIL import Image
from fastapi import HTTPException, UploadFile
from app.config.settings import settings


ALLOWED_MIME_TYPES = {
    "image/jpeg": "jpg",
    "image/pjpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heic",
}


async def validate_and_read_image(file: UploadFile) -> Tuple[bytes, str, int, int]:
    """
    Validates uploaded image file:
    - Verifies file size limit
    - Checks allowed file extensions and MIME types
    - Opens with Pillow to verify image data integrity
    Returns:
        (image_bytes, image_format, width, height)
    """
    filename = file.filename or "image.jpg"
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    
    if ext not in settings.allowed_extensions_list:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '.{ext}'. Supported formats: {', '.join(settings.allowed_extensions_list)}"
        )

    # Read image content
    content = await file.read()
    file_size_mb = len(content) / (1024 * 1024)
    
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")
    
    if file_size_mb > settings.MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File size ({file_size_mb:.2f}MB) exceeds the maximum limit of {settings.MAX_FILE_SIZE_MB}MB."
        )

    # Verify image integrity via Pillow
    try:
        image = Image.open(io.BytesIO(content))
        image.verify()  # verify integrity
        
        # Re-open for dimension reading (verify() closes/invalidates the stream)
        image = Image.open(io.BytesIO(content))
        width, height = image.size
        img_format = (image.format or ext).lower()
        
        return content, img_format, width, height
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Corrupted or invalid image file: {str(e)}"
        )
