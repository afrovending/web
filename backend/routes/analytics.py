"""
Analytics routes for Afrovending API
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime, timezone, timedelta
from collections import defaultdict
import uuid

from config import db
from utils.auth import get_current_user
from models import (
    VendorAnalyticsResponse, SalesAnalytics, ProductAnalytics,
    TrafficAnalytics, ConversionAnalytics, CustomerAnalytics
)

router = APIRouter(tags=["Analytics"])


async def check_analytics_access(vendor_id: str) -> bool:
    """Check if vendor has Growth+ subscription for analytics access"""
    subscription = await db.vendor_subscriptions.find_one(
        {"vendor_id": vendor_id, "status": {"$in": ["active", "trialing"]}},
        {"_id": 0}
    )
    if subscription and subscription.get("plan_id") in ["growth", "pro", "enterprise"]:
        return True
    return False


@router.post("/analytics/track-view")
async def track_product_view(
    product_id: str,
    source: str = "direct",
    session_id: Optional[str] = None
):
    """Track a product view event"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0, "vendor_id": 1})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    view_event = {
        "id": str(uuid.uuid4()),
        "product_id": product_id,
        "vendor_id": product["vendor_id"],
        "user_id": None,
        "session_id": session_id or str(uuid.uuid4()),
        "source": source,
        "event_type": "view",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.analytics_events.insert_one(view_event)
    await db.products.update_one({"id": product_id}, {"$inc": {"view_count": 1}})
    
    return {"success": True}


@router.post("/analytics/track-cart-add")
async def track_cart_add(
    product_id: str,
    session_id: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Track a cart add event"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0, "vendor_id": 1})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    event = {
        "id": str(uuid.uuid4()),
        "product_id": product_id,
        "vendor_id": product["vendor_id"],
        "user_id": user["id"],
        "session_id": session_id or str(uuid.uuid4()),
        "event_type": "cart_add",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.analytics_events.insert_one(event)
    return {"success": True}


@router.get("/analytics/vendor", response_model=VendorAnalyticsResponse)
async def get_vendor_analytics(
    period: str = "30d",
    user: dict = Depends(get_current_user)
):
    """Get comprehensive analytics for vendor (Growth+ only)"""
    if user["role"] not in ["vendor", "admin"]:
        raise HTTPException(status_code=403, detail="Only vendors can access analytics")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    has_access = await check_analytics_access(vendor["id"])
    if not has_access and user["role"] != "admin":
        return VendorAnalyticsResponse(
            sales=SalesAnalytics(total_revenue=0, total_orders=0, average_order_value=0, revenue_trend=[], orders_trend=[]),
            top_products=[],
            traffic=TrafficAnalytics(total_views=0, unique_visitors=0, views_trend=[], top_sources=[]),
            conversions=ConversionAnalytics(view_to_cart_rate=0, cart_to_purchase_rate=0, overall_conversion_rate=0, funnel_data=[]),
            customers=CustomerAnalytics(total_customers=0, new_customers=0, returning_customers=0, top_locations=[]),
            period=period,
            has_access=False
        )
    
    now = datetime.now(timezone.utc)
    if period == "7d":
        start_date = now - timedelta(days=7)
    elif period == "30d":
        start_date = now - timedelta(days=30)
    elif period == "90d":
        start_date = now - timedelta(days=90)
    elif period == "1y":
        start_date = now - timedelta(days=365)
    else:
        start_date = now - timedelta(days=30)
    
    start_iso = start_date.isoformat()
    
    # Sales Analytics
    orders = await db.orders.find({
        "created_at": {"$gte": start_iso},
        "items.vendor_id": vendor["id"],
        "payment_status": "paid"
    }, {"_id": 0}).to_list(1000)
    
    total_revenue = 0.0
    vendor_orders = []
    for order in orders:
        vendor_items = [item for item in order.get("items", []) if item.get("vendor_id") == vendor["id"]]
        if vendor_items:
            order_revenue = sum(item.get("price", 0) * item.get("quantity", 1) for item in vendor_items)
            total_revenue += order_revenue
            vendor_orders.append({"date": order.get("created_at", "")[:10], "revenue": order_revenue})
    
    total_orders = len(vendor_orders)
    avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
    
    revenue_by_date = defaultdict(float)
    orders_by_date = defaultdict(int)
    for order in vendor_orders:
        revenue_by_date[order["date"]] += order["revenue"]
        orders_by_date[order["date"]] += 1
    
    revenue_trend = [{"date": d, "value": v} for d, v in sorted(revenue_by_date.items())]
    orders_trend = [{"date": d, "value": v} for d, v in sorted(orders_by_date.items())]
    
    # Product Analytics
    product_stats = defaultdict(lambda: {"views": 0, "cart_adds": 0, "purchases": 0, "revenue": 0})
    
    events = await db.analytics_events.find({
        "vendor_id": vendor["id"],
        "timestamp": {"$gte": start_iso}
    }, {"_id": 0}).to_list(10000)
    
    for event in events:
        pid = event.get("product_id")
        if event.get("event_type") == "view":
            product_stats[pid]["views"] += 1
        elif event.get("event_type") == "cart_add":
            product_stats[pid]["cart_adds"] += 1
    
    for order in orders:
        for item in order.get("items", []):
            if item.get("vendor_id") == vendor["id"]:
                pid = item.get("product_id")
                product_stats[pid]["purchases"] += item.get("quantity", 1)
                product_stats[pid]["revenue"] += item.get("price", 0) * item.get("quantity", 1)
    
    top_products = []
    for pid, stats in product_stats.items():
        product = await db.products.find_one({"id": pid}, {"_id": 0, "name": 1})
        if product:
            views = stats["views"]
            purchases = stats["purchases"]
            conversion = (purchases / views * 100) if views > 0 else 0
            top_products.append(ProductAnalytics(
                product_id=pid, product_name=product.get("name", "Unknown"),
                views=views, cart_adds=stats["cart_adds"], purchases=purchases,
                revenue=stats["revenue"], conversion_rate=round(conversion, 2)
            ))
    
    top_products.sort(key=lambda x: x.revenue, reverse=True)
    top_products = top_products[:10]
    
    # Traffic Analytics
    total_views = sum(s["views"] for s in product_stats.values())
    unique_sessions = len(set(e.get("session_id") for e in events if e.get("event_type") == "view"))
    
    source_counts = defaultdict(int)
    for event in events:
        if event.get("event_type") == "view":
            source_counts[event.get("source", "direct")] += 1
    
    top_sources = [{"source": s, "count": c} for s, c in sorted(source_counts.items(), key=lambda x: -x[1])[:5]]
    
    views_by_date = defaultdict(int)
    for event in events:
        if event.get("event_type") == "view":
            views_by_date[event.get("timestamp", "")[:10]] += 1
    
    views_trend = [{"date": d, "value": v} for d, v in sorted(views_by_date.items())]
    
    # Conversion Analytics
    total_cart_adds = sum(s["cart_adds"] for s in product_stats.values())
    total_purchases = sum(s["purchases"] for s in product_stats.values())
    
    view_to_cart = (total_cart_adds / total_views * 100) if total_views > 0 else 0
    cart_to_purchase = (total_purchases / total_cart_adds * 100) if total_cart_adds > 0 else 0
    overall_conversion = (total_purchases / total_views * 100) if total_views > 0 else 0
    
    funnel_data = [
        {"stage": "Views", "count": total_views, "rate": 100},
        {"stage": "Cart Adds", "count": total_cart_adds, "rate": round(view_to_cart, 1)},
        {"stage": "Purchases", "count": total_purchases, "rate": round(overall_conversion, 1)}
    ]
    
    # Customer Analytics
    customer_ids = set()
    for order in orders:
        customer_ids.add(order.get("user_id"))
    
    total_customers = len(customer_ids)
    
    return VendorAnalyticsResponse(
        sales=SalesAnalytics(
            total_revenue=round(total_revenue, 2), total_orders=total_orders,
            average_order_value=round(avg_order_value, 2),
            revenue_trend=revenue_trend, orders_trend=orders_trend
        ),
        top_products=top_products,
        traffic=TrafficAnalytics(
            total_views=total_views, unique_visitors=unique_sessions,
            views_trend=views_trend, top_sources=top_sources
        ),
        conversions=ConversionAnalytics(
            view_to_cart_rate=round(view_to_cart, 2),
            cart_to_purchase_rate=round(cart_to_purchase, 2),
            overall_conversion_rate=round(overall_conversion, 2),
            funnel_data=funnel_data
        ),
        customers=CustomerAnalytics(
            total_customers=total_customers,
            new_customers=total_customers,
            returning_customers=0,
            top_locations=[]
        ),
        period=period,
        has_access=True
    )
