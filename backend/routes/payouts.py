"""
Vendor payout routes for Afrovending API
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
import uuid
import os
import stripe

from config import db, logger, STRIPE_API_KEY, PLATFORM_FEE_PERCENT
from utils.auth import get_current_user

stripe.api_key = STRIPE_API_KEY

router = APIRouter(tags=["Vendor Payouts"])


class PayoutSummary(BaseModel):
    total_sales: float = 0.0
    pending_payout: float = 0.0
    available_balance: float = 0.0
    total_paid_out: float = 0.0
    platform_fees: float = 0.0
    stripe_connected: bool = False
    stripe_account_id: Optional[str] = None


class PayoutTransaction(BaseModel):
    id: str
    type: str
    amount: float
    description: str
    status: str
    booking_id: Optional[str] = None
    order_id: Optional[str] = None
    created_at: str


class PayoutRequest(BaseModel):
    amount: float


async def require_vendor(user: dict = Depends(get_current_user)) -> dict:
    """Require the current user to be a vendor"""
    if user.get("role") not in ["vendor", "admin"]:
        raise HTTPException(status_code=403, detail="Vendor access required")
    return user


@router.get("/vendor/payout/summary", response_model=PayoutSummary)
async def get_vendor_payout_summary(user: dict = Depends(require_vendor)):
    """Get vendor's payout summary"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    completed_bookings = await db.bookings.find({
        "vendor_id": vendor["id"],
        "delivery_confirmed": True
    }, {"_id": 0}).to_list(1000)
    
    total_sales = sum(b.get("price", 0) for b in completed_bookings)
    platform_fees = total_sales * (PLATFORM_FEE_PERCENT / 100)
    
    payouts = await db.vendor_payouts.find({
        "vendor_id": vendor["id"],
        "status": "completed"
    }, {"_id": 0}).to_list(1000)
    
    total_paid_out = sum(p.get("amount", 0) for p in payouts)
    available_balance = (total_sales - platform_fees) - total_paid_out
    
    pending_bookings = await db.bookings.find({
        "vendor_id": vendor["id"],
        "payment_status": "paid",
        "delivery_confirmed": False
    }, {"_id": 0}).to_list(1000)
    
    pending_payout = sum(b.get("price", 0) for b in pending_bookings)
    
    return PayoutSummary(
        total_sales=total_sales,
        pending_payout=pending_payout,
        available_balance=max(0, available_balance),
        total_paid_out=total_paid_out,
        platform_fees=platform_fees,
        stripe_connected=bool(vendor.get("stripe_account_id")),
        stripe_account_id=vendor.get("stripe_account_id")
    )


@router.get("/vendor/payout/transactions", response_model=List[PayoutTransaction])
async def get_vendor_payout_transactions(user: dict = Depends(require_vendor), limit: int = 50):
    """Get vendor's transaction history"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    transactions = []
    
    bookings = await db.bookings.find({
        "vendor_id": vendor["id"],
        "delivery_confirmed": True
    }, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    for booking in bookings:
        transactions.append(PayoutTransaction(
            id=f"earn_{booking['id']}",
            type="earning",
            amount=booking["price"],
            description=f"Service: {booking['service_name']}",
            status="completed",
            booking_id=booking["id"],
            created_at=booking.get("created_at", datetime.now(timezone.utc).isoformat())
        ))
        
        fee = booking["price"] * (PLATFORM_FEE_PERCENT / 100)
        transactions.append(PayoutTransaction(
            id=f"fee_{booking['id']}",
            type="fee",
            amount=-fee,
            description=f"Platform fee ({PLATFORM_FEE_PERCENT}%)",
            status="completed",
            booking_id=booking["id"],
            created_at=booking.get("created_at", datetime.now(timezone.utc).isoformat())
        ))
    
    payouts = await db.vendor_payouts.find({
        "vendor_id": vendor["id"]
    }, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    for payout in payouts:
        transactions.append(PayoutTransaction(
            id=payout["id"],
            type="payout",
            amount=-payout["amount"],
            description="Payout to Stripe account",
            status=payout["status"],
            created_at=payout.get("created_at", datetime.now(timezone.utc).isoformat())
        ))
    
    transactions.sort(key=lambda x: x.created_at, reverse=True)
    return transactions[:limit]


@router.post("/vendor/stripe/connect")
async def create_stripe_connect_link(request: Request, user: dict = Depends(require_vendor)):
    """Create a Stripe Connect onboarding link for the vendor"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    try:
        if vendor.get("stripe_account_id"):
            login_link = stripe.Account.create_login_link(vendor["stripe_account_id"])
            return {"url": login_link.url, "type": "login"}
        
        account = stripe.Account.create(
            type="express",
            country="US",
            email=user["email"],
            capabilities={
                "card_payments": {"requested": True},
                "transfers": {"requested": True},
            },
            business_type="individual",
            metadata={
                "vendor_id": vendor["id"],
                "user_id": user["id"]
            }
        )
        
        await db.vendors.update_one(
            {"id": vendor["id"]},
            {"$set": {"stripe_account_id": account.id}}
        )
        
        host_url = str(request.base_url).rstrip('/')
        account_link = stripe.AccountLink.create(
            account=account.id,
            refresh_url=f"{host_url}/api/vendor/stripe/refresh",
            return_url=f"{host_url}/api/vendor/stripe/return?account_id={account.id}",
            type="account_onboarding",
        )
        
        return {"url": account_link.url, "type": "onboarding", "account_id": account.id}
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe Connect error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/vendor/stripe/return")
async def stripe_connect_return(account_id: str, request: Request):
    """Handle return from Stripe Connect onboarding"""
    try:
        account = stripe.Account.retrieve(account_id)
        
        if account.charges_enabled:
            await db.vendors.update_one(
                {"stripe_account_id": account_id},
                {"$set": {"stripe_payouts_enabled": True}}
            )
        
        frontend_url = os.environ.get('FRONTEND_URL', 'https://afro-paypal-test.preview.emergentagent.com')
        return RedirectResponse(url=f"{frontend_url}/vendor/dashboard?stripe=connected")
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe return error: {str(e)}")
        frontend_url = os.environ.get('FRONTEND_URL', 'https://afro-paypal-test.preview.emergentagent.com')
        return RedirectResponse(url=f"{frontend_url}/vendor/dashboard?stripe=error")


@router.get("/vendor/stripe/refresh")
async def stripe_connect_refresh(request: Request):
    """Handle refresh from Stripe Connect"""
    frontend_url = os.environ.get('FRONTEND_URL', 'https://afro-paypal-test.preview.emergentagent.com')
    return RedirectResponse(url=f"{frontend_url}/vendor/dashboard?stripe=refresh")


@router.get("/vendor/stripe/status")
async def get_stripe_connect_status(user: dict = Depends(require_vendor)):
    """Check vendor's Stripe Connect status"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    if not vendor.get("stripe_account_id"):
        return {
            "connected": False,
            "charges_enabled": False,
            "payouts_enabled": False,
            "details_submitted": False
        }
    
    try:
        account = stripe.Account.retrieve(vendor["stripe_account_id"])
        return {
            "connected": True,
            "account_id": account.id,
            "charges_enabled": account.charges_enabled,
            "payouts_enabled": account.payouts_enabled,
            "details_submitted": account.details_submitted
        }
    except stripe.error.StripeError as e:
        logger.error(f"Stripe status error: {str(e)}")
        return {"connected": False, "error": str(e)}


@router.post("/vendor/payout/request")
async def request_payout(payout_req: PayoutRequest, user: dict = Depends(require_vendor)):
    """Request a payout to vendor's connected Stripe account"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    if not vendor.get("stripe_account_id"):
        raise HTTPException(status_code=400, detail="Please connect your Stripe account first")
    
    completed_bookings = await db.bookings.find({
        "vendor_id": vendor["id"],
        "delivery_confirmed": True
    }, {"_id": 0}).to_list(1000)
    
    total_sales = sum(b.get("price", 0) for b in completed_bookings)
    platform_fees = total_sales * (PLATFORM_FEE_PERCENT / 100)
    
    payouts = await db.vendor_payouts.find({
        "vendor_id": vendor["id"],
        "status": "completed"
    }, {"_id": 0}).to_list(1000)
    
    total_paid_out = sum(p.get("amount", 0) for p in payouts)
    available_balance = (total_sales - platform_fees) - total_paid_out
    
    if payout_req.amount > available_balance:
        raise HTTPException(status_code=400, detail=f"Insufficient balance. Available: ${available_balance:.2f}")
    
    if payout_req.amount < 1.00:
        raise HTTPException(status_code=400, detail="Minimum payout amount is $1.00")
    
    try:
        transfer = stripe.Transfer.create(
            amount=int(payout_req.amount * 100),
            currency="usd",
            destination=vendor["stripe_account_id"],
            metadata={"vendor_id": vendor["id"], "user_id": user["id"]}
        )
        
        payout_id = str(uuid.uuid4())
        payout_doc = {
            "id": payout_id,
            "vendor_id": vendor["id"],
            "amount": payout_req.amount,
            "stripe_transfer_id": transfer.id,
            "status": "completed",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.vendor_payouts.insert_one(payout_doc)
        
        return {
            "message": "Payout successful",
            "payout_id": payout_id,
            "amount": payout_req.amount,
            "transfer_id": transfer.id
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Payout error: {str(e)}")
        payout_doc = {
            "id": str(uuid.uuid4()),
            "vendor_id": vendor["id"],
            "amount": payout_req.amount,
            "status": "failed",
            "error": str(e),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.vendor_payouts.insert_one(payout_doc)
        raise HTTPException(status_code=400, detail=f"Payout failed: {str(e)}")
