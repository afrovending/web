"""
Coupon routes for Afrovending API
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone
import uuid

from config import db
from utils.auth import get_current_user
from models import (
    CouponCreate, CouponUpdate, CouponResponse, 
    ApplyCouponRequest, CouponValidationResponse
)

router = APIRouter(tags=["Coupons"])


@router.post("/coupons", response_model=CouponResponse)
async def create_coupon(coupon: CouponCreate, user: dict = Depends(get_current_user)):
    """Create a new coupon (admin or vendor)"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    is_admin = user.get("role") == "admin"
    
    if not is_admin and not vendor:
        raise HTTPException(status_code=403, detail="Only admins or vendors can create coupons")
    
    existing = await db.coupons.find_one({"code": coupon.code.upper()}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    vendor_id = None
    if vendor and not is_admin:
        vendor_id = vendor["id"]
    elif coupon.vendor_id:
        vendor_id = coupon.vendor_id
    
    coupon_id = str(uuid.uuid4())
    coupon_doc = {
        "id": coupon_id,
        **coupon.model_dump(),
        "code": coupon.code.upper(),
        "vendor_id": vendor_id,
        "used_count": 0,
        "created_by": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.coupons.insert_one(coupon_doc)
    return coupon_doc


@router.get("/coupons", response_model=List[CouponResponse])
async def get_coupons(user: dict = Depends(get_current_user), include_inactive: bool = False):
    """Get coupons (admin sees all, vendors see their own)"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    is_admin = user.get("role") == "admin"
    
    query = {}
    if not is_admin:
        if vendor:
            query["vendor_id"] = vendor["id"]
        else:
            raise HTTPException(status_code=403, detail="Access denied")
    
    if not include_inactive:
        query["is_active"] = True
    
    coupons = await db.coupons.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return coupons


@router.get("/coupons/{coupon_id}", response_model=CouponResponse)
async def get_coupon(coupon_id: str, user: dict = Depends(get_current_user)):
    """Get a specific coupon"""
    coupon = await db.coupons.find_one({"id": coupon_id}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return coupon


@router.put("/coupons/{coupon_id}", response_model=CouponResponse)
async def update_coupon(coupon_id: str, coupon_update: CouponUpdate, user: dict = Depends(get_current_user)):
    """Update a coupon"""
    existing = await db.coupons.find_one({"id": coupon_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    is_admin = user.get("role") == "admin"
    
    if not is_admin:
        if not vendor or existing.get("vendor_id") != vendor["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to update this coupon")
    
    update_data = {k: v for k, v in coupon_update.model_dump().items() if v is not None}
    if "code" in update_data:
        update_data["code"] = update_data["code"].upper()
    
    if update_data:
        await db.coupons.update_one({"id": coupon_id}, {"$set": update_data})
    
    updated = await db.coupons.find_one({"id": coupon_id}, {"_id": 0})
    return updated


@router.delete("/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, user: dict = Depends(get_current_user)):
    """Delete a coupon"""
    existing = await db.coupons.find_one({"id": coupon_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    is_admin = user.get("role") == "admin"
    
    if not is_admin:
        if not vendor or existing.get("vendor_id") != vendor["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to delete this coupon")
    
    await db.coupons.delete_one({"id": coupon_id})
    return {"message": "Coupon deleted"}


@router.post("/coupons/validate", response_model=CouponValidationResponse)
async def validate_coupon(request: ApplyCouponRequest, user: dict = Depends(get_current_user)):
    """Validate a coupon code and return discount amount"""
    code = request.code.upper().strip()
    
    coupon = await db.coupons.find_one({"code": code}, {"_id": 0})
    if not coupon:
        return CouponValidationResponse(valid=False, message="Invalid coupon code")
    
    if not coupon.get("is_active"):
        return CouponValidationResponse(valid=False, message="This coupon is no longer active")
    
    now = datetime.now(timezone.utc)
    if coupon.get("expiry_date"):
        expiry = datetime.fromisoformat(coupon["expiry_date"].replace("Z", "+00:00"))
        if now > expiry:
            return CouponValidationResponse(valid=False, message="This coupon has expired")
    
    if coupon.get("start_date"):
        start = datetime.fromisoformat(coupon["start_date"].replace("Z", "+00:00"))
        if now < start:
            return CouponValidationResponse(valid=False, message="This coupon is not yet active")
    
    if coupon.get("max_uses") and coupon.get("used_count", 0) >= coupon["max_uses"]:
        return CouponValidationResponse(valid=False, message="This coupon has reached its usage limit")
    
    user_usage = await db.coupon_usage.count_documents({
        "coupon_id": coupon["id"],
        "user_id": user["id"]
    })
    if user_usage >= coupon.get("max_uses_per_user", 1):
        return CouponValidationResponse(valid=False, message="You have already used this coupon")
    
    # Get cart to calculate discount
    cart_items = await db.cart_items.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    subtotal = 0.0
    
    for item in cart_items:
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            price = product["price"]
            if item.get("variant_id") and product.get("variants"):
                variant = next((v for v in product["variants"] if v["id"] == item["variant_id"]), None)
                if variant and variant.get("price") is not None:
                    price = variant["price"]
            subtotal += price * item["quantity"]
    
    if coupon.get("min_order_amount", 0) > subtotal:
        return CouponValidationResponse(
            valid=False, 
            message=f"Minimum order amount is ${coupon['min_order_amount']:.2f}"
        )
    
    if coupon["discount_type"] == "percentage":
        discount = subtotal * (coupon["discount_value"] / 100)
        if coupon.get("max_discount"):
            discount = min(discount, coupon["max_discount"])
    else:
        discount = min(coupon["discount_value"], subtotal)
    
    return CouponValidationResponse(
        valid=True,
        coupon=CouponResponse(**coupon),
        discount_amount=round(discount, 2),
        message=f"Coupon applied! You save ${discount:.2f}"
    )
