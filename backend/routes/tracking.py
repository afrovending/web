"""
Order/Booking tracking routes for Afrovending API
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from config import db
from utils.auth import get_current_user

router = APIRouter(tags=["Tracking"])


class TrackingItem(BaseModel):
    id: str
    type: str  # "order" or "booking"
    status: str
    payment_status: str
    total: float
    created_at: str
    items_count: int
    vendor_name: Optional[str] = None
    service_name: Optional[str] = None
    booking_date: Optional[str] = None
    booking_time: Optional[str] = None
    delivery_confirmed: Optional[bool] = None
    tracking_updates: List[Dict[str, Any]] = []


@router.get("/tracking", response_model=List[TrackingItem])
async def get_all_tracking(user: dict = Depends(get_current_user)):
    """Get all orders and bookings for tracking"""
    tracking_items = []
    
    # Get orders
    orders = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    for order in orders:
        tracking_items.append(TrackingItem(
            id=order["id"],
            type="order",
            status=order["status"],
            payment_status=order.get("payment_status", "pending"),
            total=order["total"],
            created_at=order["created_at"],
            items_count=len(order.get("items", [])),
            tracking_updates=order.get("tracking_updates", [])
        ))
    
    # Get bookings
    bookings = await db.bookings.find({"customer_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    for booking in bookings:
        tracking_items.append(TrackingItem(
            id=booking["id"],
            type="booking",
            status=booking["status"],
            payment_status=booking["payment_status"],
            total=booking["price"],
            created_at=booking["created_at"],
            items_count=1,
            vendor_name=booking.get("vendor_name"),
            service_name=booking.get("service_name"),
            booking_date=booking.get("booking_date"),
            booking_time=booking.get("booking_time"),
            delivery_confirmed=booking.get("delivery_confirmed", False),
            tracking_updates=booking.get("tracking_updates", [])
        ))
    
    # Sort by created_at
    tracking_items.sort(key=lambda x: x.created_at, reverse=True)
    return tracking_items


@router.get("/tracking/{item_type}/{item_id}")
async def get_tracking_detail(item_type: str, item_id: str, user: dict = Depends(get_current_user)):
    """Get detailed tracking info for an order or booking"""
    if item_type == "order":
        item = await db.orders.find_one({"id": item_id}, {"_id": 0})
        if not item:
            raise HTTPException(status_code=404, detail="Order not found")
        if item["user_id"] != user["id"] and user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Generate tracking timeline
        timeline = [
            {"status": "placed", "title": "Order Placed", "timestamp": item["created_at"], "completed": True}
        ]
        
        status_order = ["pending", "processing", "shipped", "delivered"]
        current_idx = status_order.index(item["status"]) if item["status"] in status_order else -1
        
        for idx, status in enumerate(status_order[1:], 1):
            timeline.append({
                "status": status,
                "title": status.replace("_", " ").title(),
                "timestamp": None,
                "completed": idx <= current_idx
            })
        
        return {
            **item,
            "type": "order",
            "timeline": timeline
        }
    
    elif item_type == "booking":
        item = await db.bookings.find_one({"id": item_id}, {"_id": 0})
        if not item:
            raise HTTPException(status_code=404, detail="Booking not found")
        if item["customer_id"] != user["id"] and user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Generate tracking timeline
        timeline = [
            {"status": "created", "title": "Booking Created", "timestamp": item["created_at"], "completed": True}
        ]
        
        status_order = ["pending", "confirmed", "in_progress", "completed"]
        current_idx = status_order.index(item["status"]) if item["status"] in status_order else -1
        
        # Add payment status
        if item["payment_status"] == "paid" or item["payment_status"] == "released":
            timeline.append({
                "status": "paid",
                "title": "Payment Received",
                "timestamp": None,
                "completed": True
            })
        
        for idx, status in enumerate(status_order[1:], 1):
            timeline.append({
                "status": status,
                "title": status.replace("_", " ").title(),
                "timestamp": None,
                "completed": idx <= current_idx
            })
        
        if item.get("delivery_confirmed"):
            timeline.append({
                "status": "released",
                "title": "Payment Released",
                "timestamp": None,
                "completed": True
            })
        
        return {
            **item,
            "type": "booking",
            "timeline": timeline
        }
    
    else:
        raise HTTPException(status_code=400, detail="Invalid item type")
