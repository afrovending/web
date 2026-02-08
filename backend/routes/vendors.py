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



# ==================== STOREFRONT ROUTES ====================

@router.get("/vendors/{vendor_id}/storefront")
async def get_storefront(vendor_id: str):
    """Get vendor storefront settings (public)"""
    vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Get storefront settings, return defaults if not set
    storefront = vendor.get("storefront", {})
    
    # Merge with defaults
    default_settings = StorefrontSettings().model_dump()
    for key, value in default_settings.items():
        if key not in storefront:
            storefront[key] = value
    
    # Include some vendor info
    storefront["vendor_id"] = vendor_id
    storefront["store_name"] = vendor.get("store_name", "")
    storefront["is_verified_seller"] = await check_vendor_verified_status(vendor_id)
    
    # Get featured products if any
    if storefront.get("featured_product_ids"):
        products = await db.products.find(
            {"id": {"$in": storefront["featured_product_ids"]}, "is_active": True},
            {"_id": 0}
        ).to_list(length=10)
        storefront["featured_products"] = products
    else:
        # Get top selling products as default featured
        products = await db.products.find(
            {"vendor_id": vendor_id, "is_active": True},
            {"_id": 0}
        ).sort("total_sold", -1).limit(6).to_list(length=6)
        storefront["featured_products"] = products
    
    return storefront


@router.put("/vendors/{vendor_id}/storefront")
async def update_storefront(
    vendor_id: str,
    update: StorefrontUpdate,
    user: dict = Depends(get_current_user)
):
    """Update vendor storefront settings"""
    vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    if user["role"] != "admin" and vendor["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get current storefront settings
    current = vendor.get("storefront", {})
    
    # Update only provided fields
    update_data = update.model_dump(exclude_none=True)
    
    # Handle nested objects properly
    if "theme" in update_data and update_data["theme"]:
        current_theme = current.get("theme", {})
        current_theme.update(update_data["theme"])
        update_data["theme"] = current_theme
    
    if "social_links" in update_data and update_data["social_links"]:
        current_social = current.get("social_links", {})
        current_social.update(update_data["social_links"])
        update_data["social_links"] = current_social
    
    current.update(update_data)
    
    await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {"storefront": current}}
    )
    
    logger.info(f"Storefront updated for vendor {vendor_id}")
    return {"message": "Storefront updated", "storefront": current}


@router.get("/vendors/{vendor_id}/storefront/theme-presets")
async def get_theme_presets(vendor_id: str):
    """Get available theme presets"""
    return {"presets": THEME_PRESETS}


@router.post("/vendors/{vendor_id}/storefront/apply-preset")
async def apply_theme_preset(
    vendor_id: str,
    preset_name: str,
    user: dict = Depends(get_current_user)
):
    """Apply a theme preset to the storefront"""
    vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    if user["role"] != "admin" and vendor["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if preset_name not in THEME_PRESETS:
        raise HTTPException(status_code=400, detail="Invalid preset name")
    
    preset = THEME_PRESETS[preset_name]
    
    # Get current storefront and update theme
    current = vendor.get("storefront", {})
    current_theme = current.get("theme", {})
    current_theme.update(preset)
    current_theme["preset"] = preset_name
    current["theme"] = current_theme
    
    await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {"storefront": current}}
    )
    
    return {"message": f"Applied {preset_name} theme", "theme": current_theme}


@router.put("/vendors/{vendor_id}/storefront/featured-products")
async def update_featured_products(
    vendor_id: str,
    product_ids: List[str],
    user: dict = Depends(get_current_user)
):
    """Update featured products for storefront"""
    vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    if user["role"] != "admin" and vendor["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Validate that products belong to this vendor
    valid_products = await db.products.find(
        {"id": {"$in": product_ids}, "vendor_id": vendor_id},
        {"_id": 0, "id": 1}
    ).to_list(length=10)
    
    valid_ids = [p["id"] for p in valid_products]
    
    # Limit to 6 featured products
    valid_ids = valid_ids[:6]
    
    # Update storefront
    await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {"storefront.featured_product_ids": valid_ids}}
    )
    
    return {"message": "Featured products updated", "featured_product_ids": valid_ids}


@router.put("/vendors/{vendor_id}/storefront/sections")
async def update_storefront_sections(
    vendor_id: str,
    sections: List[StorefrontSection],
    user: dict = Depends(get_current_user)
):
    """Update storefront section order and visibility"""
    vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    if user["role"] != "admin" and vendor["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    sections_data = [s.model_dump() for s in sections]
    
    await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {"storefront.sections": sections_data}}
    )
    
    return {"message": "Sections updated", "sections": sections_data}
