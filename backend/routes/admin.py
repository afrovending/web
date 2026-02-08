"""
Admin routes for Afrovending API - Enhanced with Analytics
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from collections import defaultdict

from config import db
from utils.auth import get_current_user
from models import UserResponse, OrderResponse

router = APIRouter(tags=["Admin"])


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """Require the current user to be an admin"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.get("/admin/stats")
async def get_admin_stats(user: dict = Depends(require_admin)):
    """Get platform statistics for admin dashboard"""
    total_users = await db.users.count_documents({})
    total_vendors = await db.vendors.count_documents({})
    total_products = await db.products.count_documents({})
    total_services = await db.services.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_bookings = await db.bookings.count_documents({})
    pending_vendors = await db.vendors.count_documents({"is_approved": False})
    
    # Calculate revenue
    paid_orders = await db.orders.find({"payment_status": "paid"}, {"total": 1}).to_list(10000)
    total_order_revenue = sum(o.get("total", 0) for o in paid_orders)
    
    paid_bookings = await db.bookings.find({"payment_status": {"$in": ["paid", "released"]}}, {"price": 1}).to_list(10000)
    total_booking_revenue = sum(b.get("price", 0) for b in paid_bookings)
    
    total_revenue = total_order_revenue + total_booking_revenue
    
    return {
        "total_users": total_users,
        "total_vendors": total_vendors,
        "total_products": total_products,
        "total_services": total_services,
        "total_orders": total_orders,
        "total_bookings": total_bookings,
        "pending_vendors": pending_vendors,
        "total_revenue": round(total_revenue, 2),
        "order_revenue": round(total_order_revenue, 2),
        "booking_revenue": round(total_booking_revenue, 2)
    }


@router.get("/admin/analytics/overview")
async def get_admin_analytics_overview(
    period: str = Query("30d", description="Time period: 7d, 30d, 90d, 1y"),
    user: dict = Depends(require_admin)
):
    """Get comprehensive analytics overview for admin dashboard"""
    now = datetime.now(timezone.utc)
    
    if period == "7d":
        start_date = now - timedelta(days=7)
        prev_start = now - timedelta(days=14)
    elif period == "30d":
        start_date = now - timedelta(days=30)
        prev_start = now - timedelta(days=60)
    elif period == "90d":
        start_date = now - timedelta(days=90)
        prev_start = now - timedelta(days=180)
    elif period == "1y":
        start_date = now - timedelta(days=365)
        prev_start = now - timedelta(days=730)
    else:
        start_date = now - timedelta(days=30)
        prev_start = now - timedelta(days=60)
    
    start_iso = start_date.isoformat()
    prev_iso = prev_start.isoformat()
    
    # Current period stats
    current_orders = await db.orders.find({
        "created_at": {"$gte": start_iso},
        "payment_status": "paid"
    }, {"_id": 0, "total": 1, "created_at": 1, "user_id": 1}).to_list(10000)
    
    current_bookings = await db.bookings.find({
        "created_at": {"$gte": start_iso},
        "payment_status": {"$in": ["paid", "released"]}
    }, {"_id": 0, "price": 1, "created_at": 1, "customer_id": 1}).to_list(10000)
    
    current_users = await db.users.count_documents({"created_at": {"$gte": start_iso}})
    current_vendors = await db.vendors.count_documents({"created_at": {"$gte": start_iso}})
    
    # Previous period stats
    prev_orders = await db.orders.find({
        "created_at": {"$gte": prev_iso, "$lt": start_iso},
        "payment_status": "paid"
    }, {"_id": 0, "total": 1}).to_list(10000)
    
    prev_bookings = await db.bookings.find({
        "created_at": {"$gte": prev_iso, "$lt": start_iso},
        "payment_status": {"$in": ["paid", "released"]}
    }, {"_id": 0, "price": 1}).to_list(10000)
    
    prev_users = await db.users.count_documents({"created_at": {"$gte": prev_iso, "$lt": start_iso}})
    prev_vendors = await db.vendors.count_documents({"created_at": {"$gte": prev_iso, "$lt": start_iso}})
    
    # Calculate metrics
    current_revenue = sum(o.get("total", 0) for o in current_orders) + sum(b.get("price", 0) for b in current_bookings)
    prev_revenue = sum(o.get("total", 0) for o in prev_orders) + sum(b.get("price", 0) for b in prev_bookings)
    
    current_transactions = len(current_orders) + len(current_bookings)
    prev_transactions = len(prev_orders) + len(prev_bookings)
    
    # Calculate changes
    revenue_change = ((current_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
    transactions_change = ((current_transactions - prev_transactions) / prev_transactions * 100) if prev_transactions > 0 else 0
    users_change = ((current_users - prev_users) / prev_users * 100) if prev_users > 0 else 0
    vendors_change = ((current_vendors - prev_vendors) / prev_vendors * 100) if prev_vendors > 0 else 0
    
    # Unique customers
    customer_ids = set()
    for o in current_orders:
        customer_ids.add(o.get("user_id"))
    for b in current_bookings:
        customer_ids.add(b.get("customer_id"))
    
    return {
        "period": period,
        "revenue": {
            "total": round(current_revenue, 2),
            "change": round(revenue_change, 1),
            "orders": round(sum(o.get("total", 0) for o in current_orders), 2),
            "bookings": round(sum(b.get("price", 0) for b in current_bookings), 2)
        },
        "transactions": {
            "total": current_transactions,
            "change": round(transactions_change, 1),
            "orders": len(current_orders),
            "bookings": len(current_bookings)
        },
        "users": {
            "new": current_users,
            "change": round(users_change, 1)
        },
        "vendors": {
            "new": current_vendors,
            "change": round(vendors_change, 1)
        },
        "customers": {
            "active": len(customer_ids)
        }
    }


@router.get("/admin/analytics/revenue-chart")
async def get_revenue_chart(
    period: str = Query("30d", description="Time period: 7d, 30d, 90d, 1y"),
    user: dict = Depends(require_admin)
):
    """Get revenue data for chart visualization"""
    now = datetime.now(timezone.utc)
    
    if period == "7d":
        start_date = now - timedelta(days=7)
        date_format = "%b %d"
    elif period == "30d":
        start_date = now - timedelta(days=30)
        date_format = "%b %d"
    elif period == "90d":
        start_date = now - timedelta(days=90)
        date_format = "%b %d"
    else:
        start_date = now - timedelta(days=365)
        date_format = "%b %Y"
    
    start_iso = start_date.isoformat()
    
    orders = await db.orders.find({
        "created_at": {"$gte": start_iso},
        "payment_status": "paid"
    }, {"_id": 0, "total": 1, "created_at": 1}).to_list(10000)
    
    bookings = await db.bookings.find({
        "created_at": {"$gte": start_iso},
        "payment_status": {"$in": ["paid", "released"]}
    }, {"_id": 0, "price": 1, "created_at": 1}).to_list(10000)
    
    # Aggregate by date
    revenue_by_date = defaultdict(lambda: {"orders": 0, "bookings": 0, "total": 0})
    
    for order in orders:
        date_key = order.get("created_at", "")[:10]
        revenue_by_date[date_key]["orders"] += order.get("total", 0)
        revenue_by_date[date_key]["total"] += order.get("total", 0)
    
    for booking in bookings:
        date_key = booking.get("created_at", "")[:10]
        revenue_by_date[date_key]["bookings"] += booking.get("price", 0)
        revenue_by_date[date_key]["total"] += booking.get("price", 0)
    
    # Sort and format
    chart_data = []
    for date_str in sorted(revenue_by_date.keys()):
        try:
            date_obj = datetime.fromisoformat(date_str)
            formatted_date = date_obj.strftime(date_format)
        except:
            formatted_date = date_str
        
        chart_data.append({
            "date": formatted_date,
            "orders": round(revenue_by_date[date_str]["orders"], 2),
            "bookings": round(revenue_by_date[date_str]["bookings"], 2),
            "total": round(revenue_by_date[date_str]["total"], 2)
        })
    
    return chart_data


@router.get("/admin/analytics/user-growth")
async def get_user_growth(
    period: str = Query("30d", description="Time period: 7d, 30d, 90d, 1y"),
    user: dict = Depends(require_admin)
):
    """Get user growth data for chart visualization"""
    now = datetime.now(timezone.utc)
    
    if period == "7d":
        start_date = now - timedelta(days=7)
    elif period == "30d":
        start_date = now - timedelta(days=30)
    elif period == "90d":
        start_date = now - timedelta(days=90)
    else:
        start_date = now - timedelta(days=365)
    
    start_iso = start_date.isoformat()
    
    users = await db.users.find({"created_at": {"$gte": start_iso}}, {"_id": 0, "created_at": 1, "role": 1}).to_list(10000)
    
    # Aggregate by date
    growth_by_date = defaultdict(lambda: {"customers": 0, "vendors": 0, "total": 0})
    
    for u in users:
        date_key = u.get("created_at", "")[:10]
        growth_by_date[date_key]["total"] += 1
        if u.get("role") == "vendor":
            growth_by_date[date_key]["vendors"] += 1
        else:
            growth_by_date[date_key]["customers"] += 1
    
    chart_data = []
    cumulative_total = await db.users.count_documents({"created_at": {"$lt": start_iso}})
    
    for date_str in sorted(growth_by_date.keys()):
        cumulative_total += growth_by_date[date_str]["total"]
        chart_data.append({
            "date": date_str,
            "new_users": growth_by_date[date_str]["total"],
            "customers": growth_by_date[date_str]["customers"],
            "vendors": growth_by_date[date_str]["vendors"],
            "cumulative": cumulative_total
        })
    
    return chart_data


@router.get("/admin/analytics/top-vendors")
async def get_top_vendors(
    period: str = Query("30d"),
    limit: int = Query(10),
    user: dict = Depends(require_admin)
):
    """Get top performing vendors"""
    now = datetime.now(timezone.utc)
    
    if period == "7d":
        start_date = now - timedelta(days=7)
    elif period == "30d":
        start_date = now - timedelta(days=30)
    elif period == "90d":
        start_date = now - timedelta(days=90)
    else:
        start_date = now - timedelta(days=365)
    
    start_iso = start_date.isoformat()
    
    # Get all vendors
    vendors = await db.vendors.find({}, {"_id": 0}).to_list(1000)
    
    vendor_stats = []
    for vendor in vendors:
        # Orders revenue
        orders = await db.orders.find({
            "created_at": {"$gte": start_iso},
            "payment_status": "paid",
            "items.vendor_id": vendor["id"]
        }, {"_id": 0, "items": 1}).to_list(10000)
        
        order_revenue = 0
        for order in orders:
            for item in order.get("items", []):
                if item.get("vendor_id") == vendor["id"]:
                    order_revenue += item.get("price", 0) * item.get("quantity", 1)
        
        # Bookings revenue
        bookings = await db.bookings.find({
            "created_at": {"$gte": start_iso},
            "payment_status": {"$in": ["paid", "released"]},
            "vendor_id": vendor["id"]
        }, {"_id": 0, "price": 1}).to_list(10000)
        
        booking_revenue = sum(b.get("price", 0) for b in bookings)
        
        total_revenue = order_revenue + booking_revenue
        
        if total_revenue > 0:
            vendor_stats.append({
                "id": vendor["id"],
                "store_name": vendor.get("store_name", "Unknown"),
                "revenue": round(total_revenue, 2),
                "orders": len(orders),
                "bookings": len(bookings),
                "product_count": vendor.get("product_count", 0)
            })
    
    # Sort by revenue
    vendor_stats.sort(key=lambda x: x["revenue"], reverse=True)
    
    return vendor_stats[:limit]


@router.get("/admin/analytics/top-products")
async def get_top_products(
    period: str = Query("30d"),
    limit: int = Query(10),
    user: dict = Depends(require_admin)
):
    """Get top selling products"""
    now = datetime.now(timezone.utc)
    
    if period == "7d":
        start_date = now - timedelta(days=7)
    elif period == "30d":
        start_date = now - timedelta(days=30)
    else:
        start_date = now - timedelta(days=90)
    
    start_iso = start_date.isoformat()
    
    orders = await db.orders.find({
        "created_at": {"$gte": start_iso},
        "payment_status": "paid"
    }, {"_id": 0, "items": 1}).to_list(10000)
    
    product_stats = defaultdict(lambda: {"quantity": 0, "revenue": 0})
    
    for order in orders:
        for item in order.get("items", []):
            pid = item.get("product_id")
            product_stats[pid]["quantity"] += item.get("quantity", 1)
            product_stats[pid]["revenue"] += item.get("price", 0) * item.get("quantity", 1)
    
    top_products = []
    for pid, stats in product_stats.items():
        product = await db.products.find_one({"id": pid}, {"_id": 0, "name": 1, "images": 1})
        if product:
            top_products.append({
                "id": pid,
                "name": product.get("name", "Unknown"),
                "image": product.get("images", [None])[0],
                "quantity_sold": stats["quantity"],
                "revenue": round(stats["revenue"], 2)
            })
    
    top_products.sort(key=lambda x: x["revenue"], reverse=True)
    
    return top_products[:limit]


@router.get("/admin/analytics/category-breakdown")
async def get_category_breakdown(user: dict = Depends(require_admin)):
    """Get sales breakdown by category"""
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    
    category_stats = []
    for cat in categories:
        products = await db.products.find({"category_id": cat["id"]}, {"_id": 0, "id": 1}).to_list(10000)
        product_ids = [p["id"] for p in products]
        
        orders = await db.orders.find({"payment_status": "paid"}, {"_id": 0, "items": 1}).to_list(10000)
        
        revenue = 0
        quantity = 0
        for order in orders:
            for item in order.get("items", []):
                if item.get("product_id") in product_ids:
                    revenue += item.get("price", 0) * item.get("quantity", 1)
                    quantity += item.get("quantity", 1)
        
        if revenue > 0:
            category_stats.append({
                "id": cat["id"],
                "name": cat["name"],
                "revenue": round(revenue, 2),
                "quantity": quantity,
                "product_count": len(products)
            })
    
    category_stats.sort(key=lambda x: x["revenue"], reverse=True)
    
    return category_stats


@router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(user: dict = Depends(require_admin), skip: int = 0, limit: int = 50):
    """Get all users (admin only)"""
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    return users


@router.put("/admin/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, admin: dict = Depends(require_admin)):
    """Update a user's role (admin only)"""
    valid_roles = ["customer", "vendor", "admin"]
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")
    
    result = await db.users.update_one({"id": user_id}, {"$set": {"role": role}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User role updated"}


@router.get("/admin/orders", response_model=List[OrderResponse])
async def get_all_orders(user: dict = Depends(require_admin), skip: int = 0, limit: int = 50):
    """Get all orders (admin only)"""
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return orders
