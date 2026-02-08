"""
Authentication utilities for Afrovending API
"""
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from config import db, JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION_HOURS, logger

security = HTTPBearer()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_vendor(user: dict = Depends(get_current_user)) -> dict:
    """Get current vendor - user must be a vendor with approved status"""
    if user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Vendor access required")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    if not vendor.get("is_approved"):
        raise HTTPException(status_code=403, detail="Vendor not approved yet")
    
    return vendor

async def get_current_admin(user: dict = Depends(get_current_user)) -> dict:
    """Get current admin - user must have admin role"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False))) -> dict:
    """Get current user if authenticated, None otherwise"""
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id:
            user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
            return user
    except:
        pass
    return None
