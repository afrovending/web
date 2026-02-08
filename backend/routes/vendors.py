"""
Vendor routes for Afrovending API
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import uuid

from config import db, logger
from utils.auth import get_current_user, require_admin
from models import VendorCreate, VendorResponse

router = APIRouter(tags=["Vendors"])


# ==================== STOREFRONT MODELS ====================

class SocialLinks(BaseModel):
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    twitter: Optional[str] = None
    tiktok: Optional[str] = None
    youtube: Optional[str] = None
    website: Optional[str] = None

class StorefrontTheme(BaseModel):
    primary_color: str = "#dc2626"  # Default red
    accent_color: str = "#1a1a1a"   # Default dark
    background_style: str = "light"  # light, dark, gradient
    layout_style: str = "grid"       # grid, list, masonry
    preset: Optional[str] = None     # preset theme name if using preset

class StorefrontSection(BaseModel):
    id: str
    type: str  # featured_products, about, categories, testimonials, gallery
    title: str
    enabled: bool = True
    order: int = 0
    settings: dict = {}

class StorefrontSettings(BaseModel):
    banner_url: Optional[str] = None
    logo_url: Optional[str] = None
    tagline: Optional[str] = None
    about_text: Optional[str] = None
    about_html: Optional[str] = None  # Rich text HTML
    theme: StorefrontTheme = StorefrontTheme()
    social_links: SocialLinks = SocialLinks()
    featured_product_ids: List[str] = []
    sections: List[StorefrontSection] = []
    show_reviews: bool = True
    show_product_count: bool = True
    show_member_since: bool = True
    custom_css: Optional[str] = None  # Advanced: custom CSS

class StorefrontUpdate(BaseModel):
    banner_url: Optional[str] = None
    logo_url: Optional[str] = None
    tagline: Optional[str] = None
    about_text: Optional[str] = None
    about_html: Optional[str] = None
    theme: Optional[StorefrontTheme] = None
    social_links: Optional[SocialLinks] = None
    featured_product_ids: Optional[List[str]] = None
    sections: Optional[List[StorefrontSection]] = None
    show_reviews: Optional[bool] = None
    show_product_count: Optional[bool] = None
    show_member_since: Optional[bool] = None
    custom_css: Optional[str] = None


# Theme presets
THEME_PRESETS = {
    "classic": {"primary_color": "#dc2626", "accent_color": "#1a1a1a", "background_style": "light"},
    "ocean": {"primary_color": "#0891b2", "accent_color": "#164e63", "background_style": "light"},
    "forest": {"primary_color": "#16a34a", "accent_color": "#14532d", "background_style": "light"},
    "sunset": {"primary_color": "#ea580c", "accent_color": "#7c2d12", "background_style": "light"},
    "royal": {"primary_color": "#7c3aed", "accent_color": "#4c1d95", "background_style": "light"},
    "midnight": {"primary_color": "#6366f1", "accent_color": "#312e81", "background_style": "dark"},
}


async def check_vendor_verified_status(vendor_id: str) -> bool:
    """Check if vendor has Growth+ subscription for verified seller badge"""
    subscription = await db.vendor_subscriptions.find_one(
        {"vendor_id": vendor_id, "status": {"$in": ["active", "trialing"]}, "plan_id": {"$in": ["growth", "pro", "enterprise"]}},
        {"_id": 0}
    )
    return subscription is not None


@router.get("/vendors", response_model=List[VendorResponse])
async def get_vendors(
    is_approved: Optional[bool] = None,
    skip: int = 0,
    limit: int = 20
):
    """Get all vendors with optional filtering"""
    query = {}
    if is_approved is not None:
        query["is_approved"] = is_approved
    
    vendors = await db.vendors.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    for vendor in vendors:
        vendor["is_verified_seller"] = await check_vendor_verified_status(vendor["id"])
        sub = await db.vendor_subscriptions.find_one(
            {"vendor_id": vendor["id"], "status": {"$in": ["active", "trialing"]}},
            {"_id": 0, "plan_id": 1}
        )
        vendor["subscription_plan"] = sub.get("plan_id") if sub else "starter"
    
    return vendors


@router.get("/vendors/featured", response_model=List[VendorResponse])
async def get_featured_vendors(limit: int = 4):
    """Get featured vendors by sales"""
    vendors = await db.vendors.find({"is_approved": True}, {"_id": 0}).sort("total_sales", -1).limit(limit).to_list(limit)
    
    for vendor in vendors:
        vendor["is_verified_seller"] = await check_vendor_verified_status(vendor["id"])
        sub = await db.vendor_subscriptions.find_one(
            {"vendor_id": vendor["id"], "status": {"$in": ["active", "trialing"]}},
            {"_id": 0, "plan_id": 1}
        )
        vendor["subscription_plan"] = sub.get("plan_id") if sub else "starter"
    
    return vendors


@router.get("/vendors/{vendor_id}", response_model=VendorResponse)
async def get_vendor(vendor_id: str):
    """Get a single vendor by ID"""
    vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    vendor["is_verified_seller"] = await check_vendor_verified_status(vendor_id)
    sub = await db.vendor_subscriptions.find_one(
        {"vendor_id": vendor_id, "status": {"$in": ["active", "trialing"]}},
        {"_id": 0, "plan_id": 1}
    )
    vendor["subscription_plan"] = sub.get("plan_id") if sub else "starter"
    
    return vendor


@router.post("/vendors", response_model=VendorResponse)
async def create_vendor(vendor: VendorCreate, user: dict = Depends(get_current_user)):
    """Create a new vendor profile"""
    existing = await db.vendors.find_one({"user_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="You already have a vendor profile")
    
    vendor_id = str(uuid.uuid4())
    vendor_doc = {
        "id": vendor_id,
        "user_id": user["id"],
        **vendor.model_dump(),
        "is_approved": False,
        "total_sales": 0.0,
        "product_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.vendors.insert_one(vendor_doc)
    await db.users.update_one({"id": user["id"]}, {"$set": {"role": "vendor", "vendor_id": vendor_id}})
    
    return VendorResponse(**vendor_doc)


@router.put("/vendors/{vendor_id}", response_model=VendorResponse)
async def update_vendor(vendor_id: str, vendor_update: VendorCreate, user: dict = Depends(get_current_user)):
    """Update a vendor profile"""
    existing = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    if user["role"] != "admin" and existing["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.vendors.update_one({"id": vendor_id}, {"$set": vendor_update.model_dump()})
    
    updated = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    return updated


@router.put("/vendors/{vendor_id}/approve")
async def approve_vendor(vendor_id: str, user: dict = Depends(require_admin)):
    """Approve a vendor (admin only)"""
    result = await db.vendors.update_one({"id": vendor_id}, {"$set": {"is_approved": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return {"message": "Vendor approved"}
