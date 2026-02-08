"""
Image upload routes for Afrovending API
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import FileResponse
import uuid
import aiofiles
from botocore.exceptions import ClientError

from config import db, logger, s3_client, S3_BUCKET_NAME, S3_PUBLIC_URL, UPLOAD_DIR
from utils.auth import get_current_user

router = APIRouter(tags=["Upload"])


@router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Upload an image file for products or services to S3"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.")
    
    # Validate file size (max 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")
    
    # Generate unique filename
    ext = file.filename.split('.')[-1].lower() if '.' in file.filename else 'jpg'
    filename = f"products/{uuid.uuid4()}.{ext}"
    
    # Check if S3 is configured
    if s3_client and S3_BUCKET_NAME:
        try:
            # Upload to S3
            s3_client.put_object(
                Body=contents,
                Bucket=S3_BUCKET_NAME,
                Key=filename,
                ContentType=file.content_type,
                ACL='public-read'
            )
            
            # Return the S3 public URL
            image_url = f"{S3_PUBLIC_URL}/{filename}"
            logger.info(f"Image uploaded to S3: {filename} by user {user['id']}")
            return {"url": image_url, "filename": filename, "storage": "s3"}
            
        except ClientError as e:
            logger.error(f"S3 upload failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to upload image to cloud storage")
    else:
        # Fallback to local storage if S3 is not configured
        local_filename = f"{uuid.uuid4()}.{ext}"
        filepath = UPLOAD_DIR / local_filename
        
        async with aiofiles.open(filepath, 'wb') as f:
            await f.write(contents)
        
        image_url = f"/api/uploads/{local_filename}"
        logger.info(f"Image uploaded locally: {local_filename} by user {user['id']}")
        return {"url": image_url, "filename": local_filename, "storage": "local"}


@router.get("/uploads/{filename}")
async def get_uploaded_image(filename: str):
    """Serve uploaded images from local storage (fallback)"""
    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(filepath)
