"""
Authentication utilities for Afrovending API
Supports both JWT and Google OAuth session tokens
"""
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import HTTPException, Depends, Request, Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from config import db, JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION_HOURS

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_access_token(data: dict) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_user_from_google_session(token: str) -> Optional[dict]:
    """Check Google OAuth session and return user if valid"""
    session = await db.google_sessions.find_one(
        {"session_token": token},
        {"_id": 0}
    )
    
    if not session:
        return None
    
    # Check expiry
    expires_at = session.get("expires_at")
    if expires_at:
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            await db.google_sessions.delete_one({"session_token": token})
            return None
    
    user = await db.users.find_one({"id": session["user_id"]}, {"_id": 0})
    return user


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """
    Get the current authenticated user
    Supports both JWT token (header) and Google OAuth session (cookie)
    """
    # 1. Try Google OAuth session from cookie first
    session_token = request.cookies.get("session_token")
    if session_token:
        user = await get_user_from_google_session(session_token)
        if user:
            return user
    
    # 2. Try JWT from Authorization header
    if credentials and credentials.credentials:
        try:
            payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = payload.get("sub")
            if user_id:
                user = await db.users.find_one({"id": user_id}, {"_id": 0})
                if user:
                    return user
        except JWTError:
            pass
        
        # 3. Try as Google session token in header
        user = await get_user_from_google_session(credentials.credentials)
        if user:
            return user
    
    raise HTTPException(status_code=401, detail="Not authenticated")


async def get_optional_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[dict]:
    """Get the current user if authenticated, None otherwise"""
    try:
        return await get_current_user(request, credentials)
    except HTTPException:
        return None


async def require_vendor(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """Require the current user to be a vendor or admin"""
    user = await get_current_user(request, credentials)
    if user.get("role") not in ["vendor", "admin"]:
        raise HTTPException(status_code=403, detail="Vendor access required")
    return user


async def require_admin(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """Require the current user to be an admin"""
    user = await get_current_user(request, credentials)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def get_current_vendor(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """Get current vendor profile - user must be an approved vendor"""
    user = await get_current_user(request, credentials)
    
    if user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Vendor access required")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    if not vendor.get("is_approved"):
        raise HTTPException(status_code=403, detail="Vendor not approved yet")
    
    return vendor
