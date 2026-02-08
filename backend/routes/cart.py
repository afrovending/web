"""
Cart, Wishlist, and Review routes for Afrovending API
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone
import uuid

from config import db
from utils.auth import get_current_user
from models import (
    CartItemBase, CartItemResponse, CartResponse, ApplyCouponRequest,
    WishlistItemResponse, ReviewCreate, ReviewResponse
)

router = APIRouter(tags=["Cart & Wishlist"])


@router.get("/cart", response_model=CartResponse)
async def get_cart(user: dict = Depends(get_current_user)):
    """Get the current user's cart"""
    cart_items = await db.cart_items.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    
    items = []
    subtotal = 0.0
    
    for item in cart_items:
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            vendor = await db.vendors.find_one({"id": product.get("vendor_id")}, {"_id": 0, "store_name": 1})
            
            price = product["price"]
            variant_sku = None
            product_image = product["images"][0] if product.get("images") else ""
            
            if item.get("variant_id") and product.get("variants"):
                variant = next((v for v in product["variants"] if v["id"] == item["variant_id"]), None)
                if variant:
                    if variant.get("price") is not None:
                        price = variant["price"]
                    if variant.get("sku"):
                        variant_sku = variant["sku"]
                    if variant.get("image"):
                        product_image = variant["image"]
            
            item_response = CartItemResponse(
                id=item["id"],
                product_id=product["id"],
                product_name=product["name"],
                product_image=product_image,
                price=price,
                quantity=item["quantity"],
                vendor_id=product.get("vendor_id", ""),
                vendor_name=vendor.get("store_name") if vendor else "Unknown",
                variant_id=item.get("variant_id"),
                selected_options=item.get("selected_options"),
                variant_sku=variant_sku
            )
            items.append(item_response)
            subtotal += price * item["quantity"]
    
    # Check for applied coupon
    applied_coupon = await db.cart_coupons.find_one({"user_id": user["id"]}, {"_id": 0})
    discount = 0.0
    discount_code = None
    
    if applied_coupon:
        coupon = await db.coupons.find_one({"id": applied_coupon["coupon_id"]}, {"_id": 0})
        if coupon and coupon.get("is_active"):
            discount_code = coupon["code"]
            if coupon["discount_type"] == "percentage":
                discount = subtotal * (coupon["discount_value"] / 100)
                if coupon.get("max_discount"):
                    discount = min(discount, coupon["max_discount"])
            else:
                discount = min(coupon["discount_value"], subtotal)
            discount = round(discount, 2)
    
    total = round(subtotal - discount, 2)
    
    return CartResponse(
        items=items, 
        subtotal=round(subtotal, 2), 
        discount=discount,
        discount_code=discount_code,
        total=total
    )


@router.post("/cart/apply-coupon")
async def apply_coupon_to_cart(request: ApplyCouponRequest, user: dict = Depends(get_current_user)):
    """Apply a coupon code to the cart"""
    code = request.code.upper().strip()
    
    coupon = await db.coupons.find_one({"code": code}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=400, detail="Invalid coupon code")
    
    if not coupon.get("is_active"):
        raise HTTPException(status_code=400, detail="This coupon is no longer active")
    
    now = datetime.now(timezone.utc)
    if coupon.get("expiry_date"):
        expiry = datetime.fromisoformat(coupon["expiry_date"].replace("Z", "+00:00"))
        if now > expiry:
            raise HTTPException(status_code=400, detail="This coupon has expired")
    
    if coupon.get("max_uses") and coupon.get("used_count", 0) >= coupon["max_uses"]:
        raise HTTPException(status_code=400, detail="This coupon has reached its usage limit")
    
    user_usage = await db.coupon_usage.count_documents({
        "coupon_id": coupon["id"],
        "user_id": user["id"]
    })
    if user_usage >= coupon.get("max_uses_per_user", 1):
        raise HTTPException(status_code=400, detail="You have already used this coupon")
    
    # Get cart subtotal to check minimum
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
        raise HTTPException(
            status_code=400, 
            detail=f"Minimum order amount is ${coupon['min_order_amount']:.2f}"
        )
    
    # Remove any existing coupon and apply new one
    await db.cart_coupons.delete_many({"user_id": user["id"]})
    await db.cart_coupons.insert_one({
        "user_id": user["id"],
        "coupon_id": coupon["id"],
        "applied_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Calculate discount
    if coupon["discount_type"] == "percentage":
        discount = subtotal * (coupon["discount_value"] / 100)
        if coupon.get("max_discount"):
            discount = min(discount, coupon["max_discount"])
    else:
        discount = min(coupon["discount_value"], subtotal)
    
    return {
        "message": f"Coupon applied! You save ${discount:.2f}",
        "discount": round(discount, 2),
        "code": coupon["code"]
    }


@router.delete("/cart/coupon")
async def remove_coupon_from_cart(user: dict = Depends(get_current_user)):
    """Remove applied coupon from cart"""
    await db.cart_coupons.delete_many({"user_id": user["id"]})
    return {"message": "Coupon removed"}


@router.post("/cart/items")
async def add_to_cart(item: CartItemBase, user: dict = Depends(get_current_user)):
    """Add an item to cart"""
    product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    variant_id = item.variant_id
    selected_options = item.selected_options
    
    if product.get("has_variants") and product.get("variants"):
        if not variant_id and not selected_options:
            raise HTTPException(status_code=400, detail="Please select product options")
        
        variant = None
        if variant_id:
            variant = next((v for v in product["variants"] if v["id"] == variant_id), None)
        elif selected_options:
            variant = next(
                (v for v in product["variants"] if v.get("options") == selected_options),
                None
            )
        
        if not variant:
            raise HTTPException(status_code=400, detail="Selected variant not found")
        
        if variant.get("stock", 0) < item.quantity:
            raise HTTPException(status_code=400, detail="Not enough stock for selected variant")
        
        variant_id = variant["id"]
        selected_options = variant.get("options", {})
    
    query = {"user_id": user["id"], "product_id": item.product_id}
    if variant_id:
        query["variant_id"] = variant_id
    else:
        query["variant_id"] = None
    
    existing = await db.cart_items.find_one(query)
    
    if existing:
        new_qty = existing["quantity"] + item.quantity
        await db.cart_items.update_one({"id": existing["id"]}, {"$set": {"quantity": new_qty}})
    else:
        cart_item = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "product_id": item.product_id,
            "quantity": item.quantity,
            "variant_id": variant_id,
            "selected_options": selected_options
        }
        await db.cart_items.insert_one(cart_item)
    
    return {"message": "Item added to cart"}


@router.put("/cart/items/{item_id}")
async def update_cart_item(item_id: str, quantity: int, user: dict = Depends(get_current_user)):
    """Update cart item quantity"""
    if quantity <= 0:
        await db.cart_items.delete_one({"id": item_id, "user_id": user["id"]})
    else:
        await db.cart_items.update_one({"id": item_id, "user_id": user["id"]}, {"$set": {"quantity": quantity}})
    return {"message": "Cart updated"}


@router.delete("/cart/items/{item_id}")
async def remove_from_cart(item_id: str, user: dict = Depends(get_current_user)):
    """Remove item from cart"""
    await db.cart_items.delete_one({"id": item_id, "user_id": user["id"]})
    return {"message": "Item removed from cart"}


@router.delete("/cart")
async def clear_cart(user: dict = Depends(get_current_user)):
    """Clear all items from cart"""
    await db.cart_items.delete_many({"user_id": user["id"]})
    return {"message": "Cart cleared"}


# ==================== WISHLIST ROUTES ====================

@router.get("/wishlist", response_model=List[WishlistItemResponse])
async def get_wishlist(user: dict = Depends(get_current_user)):
    """Get the current user's wishlist"""
    wishlist_items = await db.wishlists.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    
    items = []
    for item in wishlist_items:
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            vendor = await db.vendors.find_one({"id": product.get("vendor_id")}, {"_id": 0, "store_name": 1})
            items.append(WishlistItemResponse(
                id=item["id"],
                product_id=product["id"],
                product_name=product["name"],
                product_image=product["images"][0] if product.get("images") else "",
                price=product["price"],
                vendor_name=vendor.get("store_name") if vendor else "Unknown"
            ))
    
    return items


@router.post("/wishlist/{product_id}")
async def add_to_wishlist(product_id: str, user: dict = Depends(get_current_user)):
    """Add a product to wishlist"""
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    existing = await db.wishlists.find_one({"user_id": user["id"], "product_id": product_id})
    if existing:
        return {"message": "Already in wishlist"}
    
    wishlist_item = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "product_id": product_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.wishlists.insert_one(wishlist_item)
    return {"message": "Added to wishlist"}


@router.delete("/wishlist/{product_id}")
async def remove_from_wishlist(product_id: str, user: dict = Depends(get_current_user)):
    """Remove a product from wishlist"""
    await db.wishlists.delete_one({"user_id": user["id"], "product_id": product_id})
    return {"message": "Removed from wishlist"}


# ==================== PRODUCT REVIEW ROUTES ====================

@router.get("/products/{product_id}/reviews", response_model=List[ReviewResponse])
async def get_product_reviews(product_id: str):
    """Get reviews for a product"""
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return reviews


@router.post("/products/{product_id}/reviews", response_model=ReviewResponse)
async def create_review(product_id: str, review: ReviewCreate, user: dict = Depends(get_current_user)):
    """Create a review for a product"""
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    existing = await db.reviews.find_one({"product_id": product_id, "user_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="You already reviewed this product")
    
    review_id = str(uuid.uuid4())
    review_doc = {
        "id": review_id,
        "product_id": product_id,
        "user_id": user["id"],
        "user_name": f"{user['first_name']} {user['last_name']}",
        "rating": review.rating,
        "title": review.title,
        "comment": review.comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reviews.insert_one(review_doc)
    
    # Update product average rating
    all_reviews = await db.reviews.find({"product_id": product_id}, {"rating": 1}).to_list(1000)
    avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
    await db.products.update_one(
        {"id": product_id}, 
        {"$set": {"average_rating": round(avg_rating, 1), "review_count": len(all_reviews)}}
    )
    
    return review_doc
