"""
User routes for Afrovending API
Handles user profile and shipping addresses
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field
import uuid

from config import db, logger
from utils.auth import get_current_user

router = APIRouter(tags=["Users"])


# ==================== MODELS ====================

class ShippingAddress(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str = Field(..., min_length=1, max_length=50)  # e.g., "Home", "Work", "Mom's House"
    recipient_name: str = Field(..., min_length=1, max_length=100)
    street_address: str = Field(..., min_length=1, max_length=200)
    apartment: Optional[str] = Field(None, max_length=50)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    postal_code: str = Field(..., min_length=1, max_length=20)
    country: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    is_default: bool = False
    created_at: Optional[str] = None

class CreateAddressRequest(BaseModel):
    label: str = Field(..., min_length=1, max_length=50)
    recipient_name: str = Field(..., min_length=1, max_length=100)
    street_address: str = Field(..., min_length=1, max_length=200)
    apartment: Optional[str] = Field(None, max_length=50)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    postal_code: str = Field(..., min_length=1, max_length=20)
    country: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    is_default: bool = False

class UpdateAddressRequest(BaseModel):
    label: Optional[str] = Field(None, min_length=1, max_length=50)
    recipient_name: Optional[str] = Field(None, min_length=1, max_length=100)
    street_address: Optional[str] = Field(None, min_length=1, max_length=200)
    apartment: Optional[str] = Field(None, max_length=50)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    state: Optional[str] = Field(None, min_length=1, max_length=100)
    postal_code: Optional[str] = Field(None, min_length=1, max_length=20)
    country: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)


# ==================== SHIPPING ADDRESS ROUTES ====================

@router.get("/user/addresses", response_model=List[ShippingAddress])
async def get_shipping_addresses(user: dict = Depends(get_current_user)):
    """Get all shipping addresses for the current user"""
    user_doc = await db.users.find_one({"id": user["id"]}, {"_id": 0, "shipping_addresses": 1})
    
    if not user_doc or "shipping_addresses" not in user_doc:
        return []
    
    return user_doc.get("shipping_addresses", [])


@router.post("/user/addresses", response_model=ShippingAddress)
async def create_shipping_address(
    request: CreateAddressRequest,
    user: dict = Depends(get_current_user)
):
    """Add a new shipping address"""
    # Get current addresses
    user_doc = await db.users.find_one({"id": user["id"]}, {"_id": 0, "shipping_addresses": 1})
    addresses = user_doc.get("shipping_addresses", []) if user_doc else []
    
    # Check limit (max 10 addresses)
    if len(addresses) >= 10:
        raise HTTPException(status_code=400, detail="Maximum 10 addresses allowed")
    
    # Create new address
    new_address = ShippingAddress(
        label=request.label,
        recipient_name=request.recipient_name,
        street_address=request.street_address,
        apartment=request.apartment,
        city=request.city,
        state=request.state,
        postal_code=request.postal_code,
        country=request.country,
        phone=request.phone,
        is_default=request.is_default or len(addresses) == 0,  # First address is default
        created_at=datetime.now(timezone.utc).isoformat()
    )
    
    # If this is set as default, unset others
    if new_address.is_default:
        for addr in addresses:
            addr["is_default"] = False
    
    addresses.append(new_address.model_dump())
    
    # Update user document
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"shipping_addresses": addresses}}
    )
    
    logger.info(f"User {user['id']} added new shipping address: {new_address.label}")
    return new_address


@router.get("/user/addresses/{address_id}", response_model=ShippingAddress)
async def get_shipping_address(
    address_id: str,
    user: dict = Depends(get_current_user)
):
    """Get a specific shipping address"""
    user_doc = await db.users.find_one({"id": user["id"]}, {"_id": 0, "shipping_addresses": 1})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    addresses = user_doc.get("shipping_addresses", [])
    
    for addr in addresses:
        if addr.get("id") == address_id:
            return addr
    
    raise HTTPException(status_code=404, detail="Address not found")


@router.put("/user/addresses/{address_id}", response_model=ShippingAddress)
async def update_shipping_address(
    address_id: str,
    request: UpdateAddressRequest,
    user: dict = Depends(get_current_user)
):
    """Update a shipping address"""
    user_doc = await db.users.find_one({"id": user["id"]}, {"_id": 0, "shipping_addresses": 1})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    addresses = user_doc.get("shipping_addresses", [])
    
    # Find and update the address
    address_found = False
    for i, addr in enumerate(addresses):
        if addr.get("id") == address_id:
            address_found = True
            update_data = request.model_dump(exclude_none=True)
            addresses[i].update(update_data)
            break
    
    if not address_found:
        raise HTTPException(status_code=404, detail="Address not found")
    
    # Update user document
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"shipping_addresses": addresses}}
    )
    
    logger.info(f"User {user['id']} updated shipping address: {address_id}")
    return addresses[i]


@router.delete("/user/addresses/{address_id}")
async def delete_shipping_address(
    address_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete a shipping address"""
    user_doc = await db.users.find_one({"id": user["id"]}, {"_id": 0, "shipping_addresses": 1})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    addresses = user_doc.get("shipping_addresses", [])
    original_length = len(addresses)
    
    # Find the address to delete
    deleted_was_default = False
    addresses = [addr for addr in addresses if addr.get("id") != address_id]
    
    if len(addresses) == original_length:
        raise HTTPException(status_code=404, detail="Address not found")
    
    # Check if deleted address was default
    for addr in user_doc.get("shipping_addresses", []):
        if addr.get("id") == address_id and addr.get("is_default"):
            deleted_was_default = True
            break
    
    # If deleted address was default and there are remaining addresses, set first as default
    if deleted_was_default and len(addresses) > 0:
        addresses[0]["is_default"] = True
    
    # Update user document
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"shipping_addresses": addresses}}
    )
    
    logger.info(f"User {user['id']} deleted shipping address: {address_id}")
    return {"message": "Address deleted successfully"}


@router.put("/user/addresses/{address_id}/default", response_model=ShippingAddress)
async def set_default_address(
    address_id: str,
    user: dict = Depends(get_current_user)
):
    """Set a shipping address as the default"""
    user_doc = await db.users.find_one({"id": user["id"]}, {"_id": 0, "shipping_addresses": 1})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    addresses = user_doc.get("shipping_addresses", [])
    
    # Find the address and set as default
    address_found = False
    updated_address = None
    
    for addr in addresses:
        if addr.get("id") == address_id:
            addr["is_default"] = True
            address_found = True
            updated_address = addr
        else:
            addr["is_default"] = False
    
    if not address_found:
        raise HTTPException(status_code=404, detail="Address not found")
    
    # Update user document
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"shipping_addresses": addresses}}
    )
    
    logger.info(f"User {user['id']} set default address: {address_id}")
    return updated_address


@router.get("/user/addresses/default", response_model=Optional[ShippingAddress])
async def get_default_address(user: dict = Depends(get_current_user)):
    """Get the default shipping address for the current user"""
    user_doc = await db.users.find_one({"id": user["id"]}, {"_id": 0, "shipping_addresses": 1})
    
    if not user_doc:
        return None
    
    addresses = user_doc.get("shipping_addresses", [])
    
    for addr in addresses:
        if addr.get("is_default"):
            return addr
    
    # Return first address if no default set
    if addresses:
        return addresses[0]
    
    return None
