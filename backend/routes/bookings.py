"""
Booking routes for Afrovending API
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from typing import List
from datetime import datetime, timezone
import uuid

from config import db, logger, STRIPE_API_KEY
from utils.auth import get_current_user, require_vendor
from models import (
    BookingCreate, BookingResponse, BookingStatusUpdate,
    ServiceCheckoutRequest, ReviewCreate, ReviewResponse
)

# Import Stripe checkout
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest

router = APIRouter(tags=["Bookings"])


# Email notification functions (imported from main server)
async def send_booking_created_email(vendor_email: str, vendor_name: str, booking: dict):
    """Send email notification to vendor when a new booking is created"""
    from config import SENDGRID_API_KEY, SENDER_EMAIL
    if not SENDGRID_API_KEY:
        return
    
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail
    
    subject = f"New Booking: {booking['service_name']}"
    html_content = f"""
    <h2>New Booking Received!</h2>
    <p>Hi {vendor_name},</p>
    <p>You have a new booking for <strong>{booking['service_name']}</strong>.</p>
    <ul>
        <li><strong>Customer:</strong> {booking['customer_name']}</li>
        <li><strong>Date:</strong> {booking['booking_date']}</li>
        <li><strong>Time:</strong> {booking['booking_time']}</li>
        <li><strong>Price:</strong> ${booking['price']:.2f}</li>
    </ul>
    <p>Please confirm the booking at your earliest convenience.</p>
    """
    
    try:
        message = Mail(from_email=SENDER_EMAIL, to_emails=vendor_email, subject=subject, html_content=html_content)
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        sg.send(message)
    except Exception as e:
        logger.error(f"Failed to send booking email: {e}")


async def send_booking_status_email(customer_email: str, customer_name: str, booking: dict, new_status: str):
    """Send email notification to customer when booking status changes"""
    from config import SENDGRID_API_KEY, SENDER_EMAIL
    if not SENDGRID_API_KEY:
        return
    
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail
    
    status_messages = {
        "confirmed": "Your booking has been confirmed!",
        "in_progress": "Your service is now in progress.",
        "completed": "Your service has been completed.",
        "cancelled": "Your booking has been cancelled."
    }
    
    subject = f"Booking Update: {booking['service_name']}"
    html_content = f"""
    <h2>Booking Status Update</h2>
    <p>Hi {customer_name},</p>
    <p>{status_messages.get(new_status, f'Your booking status is now: {new_status}')}</p>
    <ul>
        <li><strong>Service:</strong> {booking['service_name']}</li>
        <li><strong>Date:</strong> {booking['booking_date']}</li>
        <li><strong>Time:</strong> {booking['booking_time']}</li>
        <li><strong>Status:</strong> {new_status.replace('_', ' ').title()}</li>
    </ul>
    """
    
    try:
        message = Mail(from_email=SENDER_EMAIL, to_emails=customer_email, subject=subject, html_content=html_content)
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        sg.send(message)
    except Exception as e:
        logger.error(f"Failed to send status email: {e}")


async def send_payment_released_email(vendor_email: str, vendor_name: str, booking: dict):
    """Send email to vendor when payment is released"""
    from config import SENDGRID_API_KEY, SENDER_EMAIL
    if not SENDGRID_API_KEY:
        return
    
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail
    
    subject = f"Payment Released: {booking['service_name']}"
    html_content = f"""
    <h2>Payment Released!</h2>
    <p>Hi {vendor_name},</p>
    <p>Great news! The customer has confirmed delivery for <strong>{booking['service_name']}</strong>.</p>
    <p><strong>${booking['price']:.2f}</strong> has been added to your pending payout balance.</p>
    """
    
    try:
        message = Mail(from_email=SENDER_EMAIL, to_emails=vendor_email, subject=subject, html_content=html_content)
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        sg.send(message)
    except Exception as e:
        logger.error(f"Failed to send payment released email: {e}")


@router.post("/bookings", response_model=BookingResponse)
async def create_booking(booking: BookingCreate, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    """Create a new service booking"""
    service = await db.services.find_one({"id": booking.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check if slot is available
    existing = await db.bookings.find_one({
        "service_id": booking.service_id,
        "booking_date": booking.booking_date,
        "booking_time": booking.booking_time,
        "status": {"$nin": ["cancelled"]}
    })
    if existing:
        raise HTTPException(status_code=400, detail="This time slot is already booked")
    
    vendor = await db.vendors.find_one({"id": service["vendor_id"]}, {"_id": 0})
    vendor_user = await db.users.find_one({"id": vendor["user_id"]}, {"_id": 0}) if vendor else None
    
    booking_id = str(uuid.uuid4())
    booking_doc = {
        "id": booking_id,
        "service_id": service["id"],
        "service_name": service["name"],
        "service_image": service["images"][0] if service.get("images") else None,
        "customer_id": user["id"],
        "customer_name": f"{user['first_name']} {user['last_name']}",
        "customer_email": user["email"],
        "vendor_id": service["vendor_id"],
        "vendor_name": vendor.get("store_name") if vendor else "Unknown",
        "booking_date": booking.booking_date,
        "booking_time": booking.booking_time,
        "duration_minutes": service.get("duration_minutes", 60),
        "price": service["price"],
        "status": "pending",
        "payment_status": "pending",
        "delivery_confirmed": False,
        "notes": booking.notes,
        "customer_address": booking.customer_address,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bookings.insert_one(booking_doc)
    
    # Send email notification to vendor
    if vendor_user and vendor:
        background_tasks.add_task(
            send_booking_created_email,
            vendor_user["email"],
            vendor.get("store_name", "Vendor"),
            booking_doc
        )
    
    return booking_doc


@router.get("/bookings", response_model=List[BookingResponse])
async def get_my_bookings(user: dict = Depends(get_current_user)):
    """Get bookings for the current user (as customer)"""
    bookings = await db.bookings.find({"customer_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return bookings


@router.get("/bookings/{booking_id}", response_model=BookingResponse)
async def get_booking(booking_id: str, user: dict = Depends(get_current_user)):
    """Get a specific booking"""
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    if user["role"] != "admin" and booking["customer_id"] != user["id"] and booking["vendor_id"] != user.get("vendor_id"):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return booking


@router.get("/vendor/bookings", response_model=List[BookingResponse])
async def get_vendor_bookings(user: dict = Depends(require_vendor)):
    """Get bookings for the vendor's services"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    bookings = await db.bookings.find({"vendor_id": vendor["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return bookings


@router.put("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, status_update: BookingStatusUpdate, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    """Update booking status (vendor can confirm/complete, customer can cancel)"""
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    valid_statuses = ["pending", "confirmed", "in_progress", "completed", "cancelled"]
    if status_update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    # Authorization checks
    is_customer = booking["customer_id"] == user["id"]
    is_vendor = booking["vendor_id"] == user.get("vendor_id")
    is_admin = user["role"] == "admin"
    
    if not (is_customer or is_vendor or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Customers can only cancel
    if is_customer and not is_admin and status_update.status not in ["cancelled"]:
        raise HTTPException(status_code=403, detail="Customers can only cancel bookings")
    
    await db.bookings.update_one({"id": booking_id}, {"$set": {"status": status_update.status}})
    
    # Send email notification to customer
    background_tasks.add_task(
        send_booking_status_email,
        booking["customer_email"],
        booking["customer_name"],
        booking,
        status_update.status
    )
    
    return {"message": "Booking status updated"}


@router.put("/bookings/{booking_id}/confirm-delivery")
async def confirm_service_delivery(booking_id: str, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    """Customer confirms that the service was delivered - releases payment to vendor"""
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Only the customer can confirm delivery
    if booking["customer_id"] != user["id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only the customer can confirm delivery")
    
    if booking["payment_status"] != "paid":
        raise HTTPException(status_code=400, detail="Payment must be completed first")
    
    if booking["delivery_confirmed"]:
        raise HTTPException(status_code=400, detail="Delivery already confirmed")
    
    # Update booking
    await db.bookings.update_one(
        {"id": booking_id}, 
        {"$set": {
            "delivery_confirmed": True, 
            "status": "completed",
            "payment_status": "released"
        }}
    )
    
    # Add to vendor's pending payout
    await db.vendors.update_one(
        {"id": booking["vendor_id"]},
        {"$inc": {"pending_payout": booking["price"], "total_sales": booking["price"]}}
    )
    
    # Send payment released email to vendor
    vendor = await db.vendors.find_one({"id": booking["vendor_id"]}, {"_id": 0})
    if vendor:
        vendor_user = await db.users.find_one({"id": vendor["user_id"]}, {"_id": 0})
        if vendor_user:
            background_tasks.add_task(
                send_payment_released_email,
                vendor_user["email"],
                vendor.get("store_name", "Vendor"),
                booking
            )
    
    return {"message": "Delivery confirmed. Payment released to vendor."}


# ==================== SERVICE CHECKOUT ROUTES ====================

@router.post("/bookings/{booking_id}/checkout")
async def create_service_checkout(booking_id: str, checkout_req: ServiceCheckoutRequest, request: Request, user: dict = Depends(get_current_user)):
    """Create a Stripe checkout session for a service booking"""
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["customer_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if booking["payment_status"] == "paid":
        raise HTTPException(status_code=400, detail="Booking already paid")
    
    # Create Stripe checkout session
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    origin_url = checkout_req.origin_url.rstrip('/')
    success_url = f"{origin_url}/bookings/{booking_id}/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/bookings/{booking_id}"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(booking["price"]),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"booking_id": booking_id, "user_id": user["id"], "type": "service"}
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Store payment transaction
    transaction_doc = {
        "id": str(uuid.uuid4()),
        "booking_id": booking_id,
        "user_id": user["id"],
        "session_id": session.session_id,
        "amount": booking["price"],
        "currency": "usd",
        "payment_method": "stripe",
        "payment_status": "pending",
        "payment_type": "service",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction_doc)
    
    return {"checkout_url": session.url, "session_id": session.session_id}


@router.get("/bookings/{booking_id}/payment-status")
async def get_booking_payment_status(booking_id: str, session_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Check payment status for a service booking"""
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    if status.payment_status == "paid" and booking["payment_status"] != "paid":
        await db.bookings.update_one(
            {"id": booking_id},
            {"$set": {"payment_status": "paid", "status": "confirmed"}}
        )
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "paid"}}
        )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency
    }


# ==================== SERVICE REVIEW ROUTES ====================

@router.get("/services/{service_id}/reviews", response_model=List[ReviewResponse])
async def get_service_reviews(service_id: str):
    """Get reviews for a service"""
    reviews = await db.service_reviews.find({"service_id": service_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return reviews


@router.post("/services/{service_id}/reviews", response_model=ReviewResponse)
async def create_service_review(service_id: str, review: ReviewCreate, user: dict = Depends(get_current_user)):
    """Create a review for a service (only for completed bookings)"""
    service = await db.services.find_one({"id": service_id})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check if user has a completed booking for this service
    completed_booking = await db.bookings.find_one({
        "service_id": service_id,
        "customer_id": user["id"],
        "delivery_confirmed": True
    })
    if not completed_booking:
        raise HTTPException(status_code=400, detail="You can only review services you have used")
    
    existing = await db.service_reviews.find_one({"service_id": service_id, "user_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="You already reviewed this service")
    
    review_id = str(uuid.uuid4())
    review_doc = {
        "id": review_id,
        "service_id": service_id,
        "product_id": service_id,  # For compatibility with ReviewResponse model
        "user_id": user["id"],
        "user_name": f"{user['first_name']} {user['last_name']}",
        "rating": review.rating,
        "title": review.title,
        "comment": review.comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.service_reviews.insert_one(review_doc)
    
    # Update service average rating
    all_reviews = await db.service_reviews.find({"service_id": service_id}, {"rating": 1}).to_list(1000)
    avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
    await db.services.update_one(
        {"id": service_id}, 
        {"$set": {"average_rating": round(avg_rating, 1), "review_count": len(all_reviews)}}
    )
    
    return review_doc
