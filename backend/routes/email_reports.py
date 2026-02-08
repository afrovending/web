"""
Email Reports routes for Afrovending API
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from collections import defaultdict

from config import db, SENDGRID_API_KEY, SENDER_EMAIL
from utils.auth import get_current_user
from models import VendorEmailPreferences, UpdateEmailPreferencesRequest, WeeklyReportData

router = APIRouter(tags=["Email Reports"])


@router.get("/vendor/email-preferences", response_model=VendorEmailPreferences)
async def get_email_preferences(user: dict = Depends(get_current_user)):
    """Get vendor's email notification preferences"""
    if user["role"] not in ["vendor", "admin"]:
        raise HTTPException(status_code=403, detail="Only vendors can access email preferences")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    preferences = vendor.get("email_preferences", {})
    return VendorEmailPreferences(
        weekly_analytics_report=preferences.get("weekly_analytics_report", True),
        order_notifications=preferences.get("order_notifications", True),
        booking_notifications=preferences.get("booking_notifications", True),
        marketing_emails=preferences.get("marketing_emails", True)
    )


@router.put("/vendor/email-preferences", response_model=VendorEmailPreferences)
async def update_email_preferences(
    request: UpdateEmailPreferencesRequest,
    user: dict = Depends(get_current_user)
):
    """Update vendor's email notification preferences"""
    if user["role"] not in ["vendor", "admin"]:
        raise HTTPException(status_code=403, detail="Only vendors can update email preferences")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    current = vendor.get("email_preferences", {
        "weekly_analytics_report": True,
        "order_notifications": True,
        "booking_notifications": True,
        "marketing_emails": True
    })
    
    update_data = request.model_dump(exclude_none=True)
    current.update(update_data)
    
    await db.vendors.update_one({"id": vendor["id"]}, {"$set": {"email_preferences": current}})
    
    return VendorEmailPreferences(**current)


async def generate_weekly_report_data(vendor: dict, vendor_user: dict) -> WeeklyReportData:
    """Generate weekly report data for a vendor"""
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)
    
    week_ago_iso = week_ago.isoformat()
    two_weeks_ago_iso = two_weeks_ago.isoformat()
    
    # This week's orders
    current_orders = await db.orders.find({
        "created_at": {"$gte": week_ago_iso},
        "items.vendor_id": vendor["id"],
        "payment_status": "paid"
    }, {"_id": 0}).to_list(1000)
    
    # Previous week's orders
    previous_orders = await db.orders.find({
        "created_at": {"$gte": two_weeks_ago_iso, "$lt": week_ago_iso},
        "items.vendor_id": vendor["id"],
        "payment_status": "paid"
    }, {"_id": 0}).to_list(1000)
    
    # Calculate current week revenue
    current_revenue = 0.0
    for order in current_orders:
        for item in order.get("items", []):
            if item.get("vendor_id") == vendor["id"]:
                current_revenue += item.get("price", 0) * item.get("quantity", 1)
    
    # Calculate previous week revenue
    previous_revenue = 0.0
    for order in previous_orders:
        for item in order.get("items", []):
            if item.get("vendor_id") == vendor["id"]:
                previous_revenue += item.get("price", 0) * item.get("quantity", 1)
    
    current_order_count = len(current_orders)
    previous_order_count = len(previous_orders)
    
    revenue_change = ((current_revenue - previous_revenue) / previous_revenue * 100) if previous_revenue > 0 else 0
    orders_change = ((current_order_count - previous_order_count) / previous_order_count * 100) if previous_order_count > 0 else 0
    
    avg_order_value = current_revenue / current_order_count if current_order_count > 0 else 0
    
    # Views
    current_views = await db.analytics_events.count_documents({
        "vendor_id": vendor["id"],
        "event_type": "view",
        "timestamp": {"$gte": week_ago_iso}
    })
    
    previous_views = await db.analytics_events.count_documents({
        "vendor_id": vendor["id"],
        "event_type": "view",
        "timestamp": {"$gte": two_weeks_ago_iso, "$lt": week_ago_iso}
    })
    
    views_change = ((current_views - previous_views) / previous_views * 100) if previous_views > 0 else 0
    
    # Conversion rates
    cart_adds = await db.analytics_events.count_documents({
        "vendor_id": vendor["id"],
        "event_type": "cart_add",
        "timestamp": {"$gte": week_ago_iso}
    })
    
    purchases = sum(
        sum(1 for item in order.get("items", []) if item.get("vendor_id") == vendor["id"])
        for order in current_orders
    )
    
    view_to_cart = (cart_adds / current_views * 100) if current_views > 0 else 0
    cart_to_purchase = (purchases / cart_adds * 100) if cart_adds > 0 else 0
    overall_conversion = (purchases / current_views * 100) if current_views > 0 else 0
    
    # Top products
    product_stats = defaultdict(lambda: {"views": 0, "purchases": 0, "revenue": 0})
    
    events = await db.analytics_events.find({
        "vendor_id": vendor["id"],
        "timestamp": {"$gte": week_ago_iso}
    }, {"_id": 0}).to_list(10000)
    
    for event in events:
        if event.get("event_type") == "view":
            product_stats[event.get("product_id")]["views"] += 1
    
    for order in current_orders:
        for item in order.get("items", []):
            if item.get("vendor_id") == vendor["id"]:
                pid = item.get("product_id")
                product_stats[pid]["purchases"] += item.get("quantity", 1)
                product_stats[pid]["revenue"] += item.get("price", 0) * item.get("quantity", 1)
    
    top_products = []
    for pid, stats in sorted(product_stats.items(), key=lambda x: -x[1]["revenue"])[:5]:
        product = await db.products.find_one({"id": pid}, {"_id": 0, "name": 1})
        if product:
            top_products.append({
                "product_id": pid,
                "product_name": product.get("name", "Unknown"),
                "views": stats["views"],
                "purchases": stats["purchases"],
                "revenue": stats["revenue"]
            })
    
    # Customer count
    customer_ids = set()
    for order in current_orders:
        customer_ids.add(order.get("user_id"))
    
    return WeeklyReportData(
        vendor_name=vendor.get("store_name", "Vendor"),
        period_start=week_ago.strftime("%b %d"),
        period_end=now.strftime("%b %d, %Y"),
        total_revenue=round(current_revenue, 2),
        total_orders=current_order_count,
        average_order_value=round(avg_order_value, 2),
        revenue_change=round(revenue_change, 1),
        orders_change=round(orders_change, 1),
        total_views=current_views,
        unique_visitors=current_views,
        views_change=round(views_change, 1),
        view_to_cart_rate=round(view_to_cart, 1),
        cart_to_purchase_rate=round(cart_to_purchase, 1),
        overall_conversion_rate=round(overall_conversion, 2),
        top_products=top_products,
        new_customers=len(customer_ids),
        returning_customers=0,
        top_locations=[]
    )


@router.get("/vendor/weekly-report/preview")
async def preview_weekly_report(user: dict = Depends(get_current_user)):
    """Preview the weekly analytics report that would be sent"""
    if user["role"] not in ["vendor", "admin"]:
        raise HTTPException(status_code=403, detail="Only vendors can preview reports")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    # Check subscription access
    subscription = await db.vendor_subscriptions.find_one(
        {"vendor_id": vendor["id"], "status": {"$in": ["active", "trialing"]}},
        {"_id": 0}
    )
    
    if not subscription or subscription.get("plan_id") not in ["growth", "pro", "enterprise"]:
        raise HTTPException(
            status_code=403,
            detail="Weekly analytics reports are available for Growth+ plans only"
        )
    
    vendor_user = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    report_data = await generate_weekly_report_data(vendor, vendor_user)
    
    return report_data.model_dump()


@router.post("/admin/send-weekly-reports")
async def trigger_weekly_reports(user: dict = Depends(get_current_user)):
    """Admin endpoint to trigger weekly report emails (normally run by scheduler)"""
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if not SENDGRID_API_KEY:
        raise HTTPException(status_code=500, detail="Email service not configured")
    
    # Find vendors with Growth+ subscriptions who have weekly reports enabled
    subscriptions = await db.vendor_subscriptions.find({
        "status": {"$in": ["active", "trialing"]},
        "plan_id": {"$in": ["growth", "pro", "enterprise"]}
    }, {"_id": 0}).to_list(1000)
    
    sent_count = 0
    for sub in subscriptions:
        vendor = await db.vendors.find_one({"id": sub["vendor_id"]}, {"_id": 0})
        if not vendor:
            continue
        
        preferences = vendor.get("email_preferences", {})
        if not preferences.get("weekly_analytics_report", True):
            continue
        
        vendor_user = await db.users.find_one({"id": vendor["user_id"]}, {"_id": 0})
        if not vendor_user:
            continue
        
        sent_count += 1
    
    return {"message": f"Would send reports to {sent_count} vendors", "count": sent_count}
