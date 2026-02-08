"""
Service routes for Afrovending API
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid

from config import db, logger
from utils.auth import require_vendor, get_current_user
from models import (
    ServiceCreate, ServiceUpdate, ServiceResponse, 
    ServiceAvailabilityBase, TimeSlotResponse
)

router = APIRouter(tags=["Services"])


@router.get("/services", response_model=List[ServiceResponse])
async def get_services(
    category_id: Optional[str] = None,
    category_ids: Optional[str] = None,
    vendor_id: Optional[str] = None,
    search: Optional[str] = None,
    location_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    min_duration: Optional[int] = None,
    max_duration: Optional[int] = None,
    tags: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    skip: int = 0,
    limit: int = 20
):
    """Get services with filtering and sorting"""
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
    if location_type:
        query["location_type"] = {"$in": [location_type, "both"]}
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
    if min_duration is not None:
        query["duration_minutes"] = {"$gte": min_duration}
    if max_duration is not None:
        query.setdefault("duration_minutes", {})["$lte"] = max_duration
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        query["tags"] = {"$in": tag_list}
    
    sort_dir = -1 if sort_order == "desc" else 1
    
    services = await db.services.find(query, {"_id": 0}).sort(sort_by, sort_dir).skip(skip).limit(limit).to_list(limit)
    
    for service in services:
        vendor = await db.vendors.find_one({"id": service.get("vendor_id")}, {"_id": 0, "store_name": 1})
        service["vendor_name"] = vendor.get("store_name") if vendor else "Unknown Vendor"
    
    return services


@router.get("/services/featured", response_model=List[ServiceResponse])
async def get_featured_services(limit: int = 8):
    """Get featured services"""
    services = await db.services.find({"is_active": True}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    for service in services:
        vendor = await db.vendors.find_one({"id": service.get("vendor_id")}, {"_id": 0, "store_name": 1})
        service["vendor_name"] = vendor.get("store_name") if vendor else "Unknown Vendor"
    
    return services


@router.get("/services/{service_id}", response_model=ServiceResponse)
async def get_service(service_id: str):
    """Get a single service by ID"""
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    vendor = await db.vendors.find_one({"id": service.get("vendor_id")}, {"_id": 0, "store_name": 1})
    service["vendor_name"] = vendor.get("store_name") if vendor else "Unknown Vendor"
    
    return service


@router.post("/services", response_model=ServiceResponse)
async def create_service(service: ServiceCreate, user: dict = Depends(require_vendor)):
    """Create a new service"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor and user["role"] != "admin":
        raise HTTPException(status_code=400, detail="You must be a vendor to create services")
    
    service_id = str(uuid.uuid4())
    vendor_id = vendor["id"] if vendor else user["id"]
    
    service_doc = {
        "id": service_id,
        "vendor_id": vendor_id,
        **service.model_dump(),
        "average_rating": 0.0,
        "review_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.services.insert_one(service_doc)
    
    # Create default availability (Mon-Fri, 9-5)
    for day in range(5):
        availability_doc = {
            "id": str(uuid.uuid4()),
            "service_id": service_id,
            "vendor_id": vendor_id,
            "day_of_week": day,
            "start_time": "09:00",
            "end_time": "17:00",
            "is_available": True
        }
        await db.service_availability.insert_one(availability_doc)
    
    service_doc["vendor_name"] = vendor.get("store_name") if vendor else "Admin"
    return service_doc


@router.put("/services/{service_id}", response_model=ServiceResponse)
async def update_service(service_id: str, service_update: ServiceUpdate, user: dict = Depends(require_vendor)):
    """Update a service"""
    existing = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Service not found")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if user["role"] != "admin" and (not vendor or vendor["id"] != existing["vendor_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to update this service")
    
    update_data = {k: v for k, v in service_update.model_dump().items() if v is not None}
    if update_data:
        await db.services.update_one({"id": service_id}, {"$set": update_data})
    
    updated = await db.services.find_one({"id": service_id}, {"_id": 0})
    vendor_doc = await db.vendors.find_one({"id": updated.get("vendor_id")}, {"_id": 0, "store_name": 1})
    updated["vendor_name"] = vendor_doc.get("store_name") if vendor_doc else "Unknown"
    
    return updated


@router.delete("/services/{service_id}")
async def delete_service(service_id: str, user: dict = Depends(require_vendor)):
    """Delete a service"""
    existing = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Service not found")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if user["role"] != "admin" and (not vendor or vendor["id"] != existing["vendor_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to delete this service")
    
    await db.services.delete_one({"id": service_id})
    await db.service_availability.delete_many({"service_id": service_id})
    
    return {"message": "Service deleted"}


# ==================== SERVICE AVAILABILITY ROUTES ====================

@router.get("/services/{service_id}/availability")
async def get_service_availability(service_id: str):
    """Get availability for a service"""
    availability = await db.service_availability.find({"service_id": service_id}, {"_id": 0}).to_list(20)
    return availability


@router.put("/services/{service_id}/availability")
async def update_service_availability(
    service_id: str, 
    availability: List[ServiceAvailabilityBase], 
    user: dict = Depends(require_vendor)
):
    """Update availability for a service"""
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if user["role"] != "admin" and (not vendor or vendor["id"] != service["vendor_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.service_availability.delete_many({"service_id": service_id})
    
    for avail in availability:
        avail_doc = {
            "id": str(uuid.uuid4()),
            "service_id": service_id,
            "vendor_id": service["vendor_id"],
            **avail.model_dump()
        }
        await db.service_availability.insert_one(avail_doc)
    
    return {"message": "Availability updated"}


@router.get("/services/{service_id}/timeslots")
async def get_available_timeslots(service_id: str, date: str):
    """Get available time slots for a specific date"""
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    try:
        booking_date = datetime.strptime(date, "%Y-%m-%d")
        day_of_week = booking_date.weekday()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    availability = await db.service_availability.find_one({
        "service_id": service_id,
        "day_of_week": day_of_week,
        "is_available": True
    }, {"_id": 0})
    
    if not availability:
        return []
    
    duration = service.get("duration_minutes", 60)
    start_hour, start_min = map(int, availability["start_time"].split(":"))
    end_hour, end_min = map(int, availability["end_time"].split(":"))
    
    slots = []
    current_time = datetime(booking_date.year, booking_date.month, booking_date.day, start_hour, start_min)
    end_time = datetime(booking_date.year, booking_date.month, booking_date.day, end_hour, end_min)
    
    existing_bookings = await db.bookings.find({
        "service_id": service_id,
        "booking_date": date,
        "status": {"$nin": ["cancelled"]}
    }, {"booking_time": 1}).to_list(100)
    booked_times = [b["booking_time"] for b in existing_bookings]
    
    while current_time + timedelta(minutes=duration) <= end_time:
        time_str = current_time.strftime("%H:%M")
        slots.append({
            "time": time_str,
            "is_available": time_str not in booked_times
        })
        current_time += timedelta(minutes=duration)
    
    return slots
