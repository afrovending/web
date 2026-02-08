"""
Product routes for Afrovending API
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
from pydantic import BaseModel

from config import db, logger
from utils.auth import require_vendor, get_current_user
from models import (
    ProductCreate, ProductUpdate, ProductResponse, 
    ServiceResponse, SUBSCRIPTION_PLANS
)

router = APIRouter(tags=["Products"])

# Additional models needed for this module
class SearchFilters(BaseModel):
    search: Optional[str] = None
    category_id: Optional[str] = None
    category_ids: Optional[List[str]] = None
    vendor_id: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_rating: Optional[float] = None
    tags: Optional[List[str]] = None
    in_stock: Optional[bool] = None
    sort_by: str = "created_at"
    sort_order: str = "desc"
    skip: int = 0
    limit: int = 20

class SearchResult(BaseModel):
    products: List[ProductResponse] = []
    services: List[ServiceResponse] = []
    total_products: int = 0
    total_services: int = 0
    filters_applied: Dict[str, Any] = {}


async def check_vendor_verified_status(vendor_id: str) -> bool:
    """Check if vendor has Growth+ subscription for verified seller badge"""
    subscription = await db.vendor_subscriptions.find_one(
        {"vendor_id": vendor_id, "status": {"$in": ["active", "trialing"]}, "plan_id": {"$in": ["growth", "pro", "enterprise"]}},
        {"_id": 0}
    )
    return subscription is not None


@router.get("/search")
async def unified_search(
    q: Optional[str] = None,
    type: Optional[str] = None,
    category_id: Optional[str] = None,
    category_ids: Optional[str] = None,
    vendor_id: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    tags: Optional[str] = None,
    location_type: Optional[str] = None,
    in_stock: Optional[bool] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    skip: int = 0,
    limit: int = 20
):
    """Unified search endpoint for products and services"""
    category_list = category_ids.split(",") if category_ids else []
    if category_id:
        category_list.append(category_id)
    tag_list = [t.strip() for t in tags.split(",")] if tags else []
    
    filters_applied = {}
    if q:
        filters_applied["search"] = q
    if category_list:
        filters_applied["categories"] = category_list
    if min_price is not None:
        filters_applied["min_price"] = min_price
    if max_price is not None:
        filters_applied["max_price"] = max_price
    if min_rating is not None:
        filters_applied["min_rating"] = min_rating
    
    results = {"products": [], "services": [], "total_products": 0, "total_services": 0, "filters_applied": filters_applied}
    sort_dir = -1 if sort_order == "desc" else 1
    
    # Search products
    if type != "services":
        product_query = {"is_active": True}
        
        if q:
            product_query["$or"] = [
                {"name": {"$regex": q, "$options": "i"}},
                {"description": {"$regex": q, "$options": "i"}},
                {"tags": {"$elemMatch": {"$regex": q, "$options": "i"}}}
            ]
        if category_list:
            product_query["category_id"] = {"$in": category_list}
        if vendor_id:
            product_query["vendor_id"] = vendor_id
        if min_price is not None:
            product_query["price"] = {"$gte": min_price}
        if max_price is not None:
            product_query.setdefault("price", {})["$lte"] = max_price
        if tag_list:
            product_query["tags"] = {"$in": tag_list}
        if in_stock:
            product_query["stock"] = {"$gt": 0}
        if min_rating is not None:
            product_query["average_rating"] = {"$gte": min_rating}
        
        results["total_products"] = await db.products.count_documents(product_query)
        products = await db.products.find(product_query, {"_id": 0}).sort(sort_by, sort_dir).skip(skip).limit(limit).to_list(limit)
        
        for product in products:
            vendor = await db.vendors.find_one({"id": product.get("vendor_id")}, {"_id": 0, "store_name": 1})
            product["vendor_name"] = vendor.get("store_name") if vendor else "Unknown"
            product["is_verified_seller"] = await check_vendor_verified_status(product.get("vendor_id"))
        
        results["products"] = products
    
    # Search services
    if type != "products":
        service_query = {"is_active": True}
        
        if q:
            service_query["$or"] = [
                {"name": {"$regex": q, "$options": "i"}},
                {"description": {"$regex": q, "$options": "i"}},
                {"tags": {"$elemMatch": {"$regex": q, "$options": "i"}}}
            ]
        if category_list:
            service_query["category_id"] = {"$in": category_list}
        if vendor_id:
            service_query["vendor_id"] = vendor_id
        if min_price is not None:
            service_query["price"] = {"$gte": min_price}
        if max_price is not None:
            service_query.setdefault("price", {})["$lte"] = max_price
        if tag_list:
            service_query["tags"] = {"$in": tag_list}
        if location_type:
            service_query["location_type"] = location_type
        if min_rating is not None:
            service_query["average_rating"] = {"$gte": min_rating}
        
        results["total_services"] = await db.services.count_documents(service_query)
        services = await db.services.find(service_query, {"_id": 0}).sort(sort_by, sort_dir).skip(skip).limit(limit).to_list(limit)
        
        for service in services:
            vendor = await db.vendors.find_one({"id": service.get("vendor_id")}, {"_id": 0, "store_name": 1})
            service["vendor_name"] = vendor.get("store_name") if vendor else "Unknown"
        
        results["services"] = services
    
    return results


@router.get("/search/suggestions")
async def search_suggestions(q: str, limit: int = 10):
    """Get search suggestions based on query"""
    if len(q) < 2:
        return {"suggestions": []}
    
    suggestions = set()
    
    products = await db.products.find(
        {"name": {"$regex": q, "$options": "i"}, "is_active": True},
        {"_id": 0, "name": 1}
    ).limit(limit).to_list(limit)
    
    for p in products:
        suggestions.add(p["name"])
    
    services = await db.services.find(
        {"name": {"$regex": q, "$options": "i"}, "is_active": True},
        {"_id": 0, "name": 1}
    ).limit(limit).to_list(limit)
    
    for s in services:
        suggestions.add(s["name"])
    
    categories = await db.categories.find(
        {"name": {"$regex": q, "$options": "i"}},
        {"_id": 0, "name": 1}
    ).limit(5).to_list(5)
    
    for c in categories:
        suggestions.add(c["name"])
    
    return {"suggestions": list(suggestions)[:limit]}


@router.get("/products", response_model=List[ProductResponse])
async def get_products(
    category_id: Optional[str] = None,
    category_ids: Optional[str] = None,
    vendor_id: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    in_stock: Optional[bool] = None,
    tags: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    skip: int = 0,
    limit: int = 20,
    include_count: bool = False
):
    """Get products with filtering and sorting"""
    query = {"is_active": True}
    
    category_list = []
    if category_ids:
        category_list = [c.strip() for c in category_ids.split(",")]
    if category_id:
        category_list.append(category_id)
    if category_list:
        query["category_id"] = {"$in": category_list} if len(category_list) > 1 else category_list[0]
    
    if vendor_id:
        query["vendor_id"] = vendor_id
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$elemMatch": {"$regex": search, "$options": "i"}}}
        ]
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price
    if min_rating is not None:
        query["average_rating"] = {"$gte": min_rating}
    if in_stock:
        query["stock"] = {"$gt": 0}
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        query["tags"] = {"$in": tag_list}
    
    sort_dir = -1 if sort_order == "desc" else 1
    
    products = await db.products.find(query, {"_id": 0}).sort(sort_by, sort_dir).skip(skip).limit(limit).to_list(limit)
    
    for product in products:
        vendor = await db.vendors.find_one({"id": product.get("vendor_id")}, {"_id": 0, "store_name": 1})
        product["vendor_name"] = vendor.get("store_name") if vendor else "Unknown Vendor"
        product["is_verified_seller"] = await check_vendor_verified_status(product.get("vendor_id"))
    
    return products


@router.get("/products/featured", response_model=List[ProductResponse])
async def get_featured_products(limit: int = 8):
    """Get featured products"""
    products = await db.products.find({"is_active": True}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    for product in products:
        vendor = await db.vendors.find_one({"id": product.get("vendor_id")}, {"_id": 0, "store_name": 1})
        product["vendor_name"] = vendor.get("store_name") if vendor else "Unknown Vendor"
        product["is_verified_seller"] = await check_vendor_verified_status(product.get("vendor_id"))
    
    return products


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    """Get a single product by ID"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    vendor = await db.vendors.find_one({"id": product.get("vendor_id")}, {"_id": 0, "store_name": 1})
    product["vendor_name"] = vendor.get("store_name") if vendor else "Unknown Vendor"
    product["is_verified_seller"] = await check_vendor_verified_status(product.get("vendor_id"))
    
    return product


@router.post("/products", response_model=ProductResponse)
async def create_product(product: ProductCreate, user: dict = Depends(require_vendor)):
    """Create a new product"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor and user["role"] != "admin":
        raise HTTPException(status_code=400, detail="You must be a vendor to create products")
    
    # Check subscription product limit
    if vendor:
        current_product_count = await db.products.count_documents({"vendor_id": vendor["id"]})
        
        subscription = await db.vendor_subscriptions.find_one(
            {"vendor_id": vendor["id"], "status": {"$in": ["active", "trialing"]}},
            {"_id": 0}
        )
        
        if subscription:
            product_limit = subscription.get("product_limit", 5)
        else:
            product_limit = SUBSCRIPTION_PLANS["starter"].product_limit
        
        if product_limit != -1 and current_product_count >= product_limit:
            raise HTTPException(
                status_code=403, 
                detail=f"Product limit reached ({product_limit} products). Upgrade your subscription to add more products."
            )
    
    product_id = str(uuid.uuid4())
    vendor_id = vendor["id"] if vendor else user["id"]
    
    product_data = product.model_dump()
    
    if product_data.get("variants"):
        for variant in product_data["variants"]:
            if not variant.get("id"):
                variant["id"] = str(uuid.uuid4())
    
    if product_data.get("has_variants") and product_data.get("variants"):
        product_data["stock"] = sum(v.get("stock", 0) for v in product_data["variants"])
    
    product_doc = {
        "id": product_id,
        "vendor_id": vendor_id,
        **product_data,
        "average_rating": 0.0,
        "review_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.products.insert_one(product_doc)
    await db.vendors.update_one({"id": vendor_id}, {"$inc": {"product_count": 1}})
    
    product_doc["vendor_name"] = vendor.get("store_name") if vendor else "Admin"
    return product_doc


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, product_update: ProductUpdate, user: dict = Depends(require_vendor)):
    """Update a product"""
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if user["role"] != "admin" and (not vendor or vendor["id"] != existing["vendor_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to update this product")
    
    update_data = {k: v for k, v in product_update.model_dump().items() if v is not None}
    
    if update_data.get("variants"):
        for variant in update_data["variants"]:
            if not variant.get("id"):
                variant["id"] = str(uuid.uuid4())
    
    if update_data.get("has_variants") and update_data.get("variants"):
        update_data["stock"] = sum(v.get("stock", 0) for v in update_data["variants"])
    
    if update_data:
        await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    vendor_doc = await db.vendors.find_one({"id": updated.get("vendor_id")}, {"_id": 0, "store_name": 1})
    updated["vendor_name"] = vendor_doc.get("store_name") if vendor_doc else "Unknown"
    
    return updated


@router.delete("/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(require_vendor)):
    """Delete a product"""
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if user["role"] != "admin" and (not vendor or vendor["id"] != existing["vendor_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to delete this product")
    
    await db.products.delete_one({"id": product_id})
    await db.vendors.update_one({"id": existing["vendor_id"]}, {"$inc": {"product_count": -1}})
    
    return {"message": "Product deleted"}
