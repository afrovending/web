"""
Authentication routes for Afrovending API
Supports both JWT (email/password) and Google OAuth
"""
from fastapi import APIRouter, HTTPException, Depends, Response, Request, Cookie
from fastapi.responses import JSONResponse
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid
import httpx

from config import db, logger
from utils.auth import hash_password, verify_password, create_access_token, get_current_user
from models import UserCreate, UserLogin, UserResponse, TokenResponse

router = APIRouter(tags=["Authentication"])

# Session duration for Google OAuth
SESSION_DURATION_DAYS = 7


# ==================== GOOGLE OAUTH ROUTES ====================

@router.post("/auth/google/session")
async def process_google_session(request: Request, response: Response):
    """
    Process Google OAuth session_id and create a session
    Called by frontend after redirect from auth.emergentagent.com
    """
    try:
        body = await request.json()
        session_id = body.get("session_id")
        
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id is required")
        
        # Exchange session_id for user data from Emergent Auth
        async with httpx.AsyncClient() as client:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            
            if auth_response.status_code != 200:
                logger.error(f"Google auth failed: {auth_response.text}")
                raise HTTPException(status_code=401, detail="Invalid session")
            
            google_data = auth_response.json()
        
        email = google_data.get("email")
        name = google_data.get("name", "")
        picture = google_data.get("picture", "")
        google_session_token = google_data.get("session_token")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": email}, {"_id": 0})
        
        if existing_user:
            # Update existing user with Google profile info
            user_id = existing_user["id"]
            await db.users.update_one(
                {"id": user_id},
                {"$set": {
                    "picture": picture,
                    "google_id": google_data.get("id"),
                    "last_login": datetime.now(timezone.utc).isoformat()
                }}
            )
            user = existing_user
        else:
            # Create new user from Google data
            user_id = str(uuid.uuid4())
            name_parts = name.split(" ", 1)
            first_name = name_parts[0] if name_parts else "User"
            last_name = name_parts[1] if len(name_parts) > 1 else ""
            
            user = {
                "id": user_id,
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "role": "customer",
                "picture": picture,
                "google_id": google_data.get("id"),
                "password_hash": None,  # No password for Google users
                "created_at": datetime.now(timezone.utc).isoformat(),
                "last_login": datetime.now(timezone.utc).isoformat(),
                "vendor_id": None
            }
            await db.users.insert_one(user)
            logger.info(f"New Google user registered: {email}")
        
        # Create session in database
        session_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "session_token": google_session_token,
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=SESSION_DURATION_DAYS)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.google_sessions.insert_one(session_doc)
        
        # Also create a JWT token for API compatibility
        jwt_token = create_access_token({"sub": user_id})
        
        # Set session cookie
        json_response = JSONResponse(content={
            "success": True,
            "access_token": jwt_token,
            "user": {
                "id": user.get("id", user_id),
                "email": email,
                "first_name": user.get("first_name", first_name),
                "last_name": user.get("last_name", last_name),
                "role": user.get("role", "customer"),
                "picture": picture,
                "created_at": user.get("created_at"),
                "vendor_id": user.get("vendor_id")
            }
        })
        
        # Set httpOnly cookie with session token
        json_response.set_cookie(
            key="session_token",
            value=google_session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=SESSION_DURATION_DAYS * 24 * 60 * 60,
            path="/"
        )
        
        return json_response
        
    except httpx.HTTPError as e:
        logger.error(f"HTTP error during Google auth: {e}")
        raise HTTPException(status_code=500, detail="Authentication service unavailable")
    except Exception as e:
        logger.error(f"Google auth error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/google/logout")
async def google_logout(
    request: Request,
    response: Response,
    session_token: Optional[str] = Cookie(None)
):
    """Logout and clear Google session"""
    if session_token:
        await db.google_sessions.delete_one({"session_token": session_token})
    
    json_response = JSONResponse(content={"success": True, "message": "Logged out"})
    json_response.delete_cookie(
        key="session_token",
        path="/",
        secure=True,
        samesite="none"
    )
    
    return json_response


async def get_user_from_session(
    request: Request,
    session_token: Optional[str] = Cookie(None)
) -> Optional[dict]:
    """
    Get user from Google session token (cookie or header)
    Returns None if not authenticated via Google OAuth
    """
    # Try cookie first
    token = session_token
    
    # Fallback to Authorization header
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if not token:
        return None
    
    # Check Google session
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
    
    # Get user
    user = await db.users.find_one({"id": session["user_id"]}, {"_id": 0})
    return user


# ==================== JWT AUTH ROUTES (existing) ====================

@router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register a new user with email/password"""
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "role": user_data.role,
        "password_hash": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "vendor_id": None
    }
    
    await db.users.insert_one(user_doc)
    logger.info(f"New user registered: {user_data.email}")
    
    token = create_access_token({"sub": user_id})
    user_response = UserResponse(
        id=user_id,
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=user_data.role,
        created_at=user_doc["created_at"],
        vendor_id=None
    )
    
    return TokenResponse(access_token=token, user=user_response)


@router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login with email/password and get access token"""
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check if user has a password (not a Google-only user)
    if not user.get("password_hash"):
        raise HTTPException(
            status_code=401, 
            detail="This account uses Google login. Please sign in with Google."
        )
    
    if not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": user["id"]})
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        first_name=user["first_name"],
        last_name=user["last_name"],
        role=user["role"],
        created_at=user["created_at"],
        vendor_id=user.get("vendor_id")
    )
    
    return TokenResponse(access_token=token, user=user_response)


@router.get("/auth/me")
async def get_me(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Get current user profile
    Supports both JWT token and Google OAuth session
    """
    # First try Google OAuth session
    google_user = await get_user_from_session(request, session_token)
    if google_user:
        return UserResponse(
            id=google_user["id"],
            email=google_user["email"],
            first_name=google_user.get("first_name", ""),
            last_name=google_user.get("last_name", ""),
            role=google_user.get("role", "customer"),
            created_at=google_user.get("created_at", ""),
            vendor_id=google_user.get("vendor_id")
        )
    
    # Fallback to JWT auth
    try:
        user = await get_current_user(request)
        return UserResponse(**user)
    except:
        raise HTTPException(status_code=401, detail="Not authenticated")
