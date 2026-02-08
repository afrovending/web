"""
Orders and Checkout/Payment routes for Afrovending API
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List
from datetime import datetime, timezone
import uuid
import httpx

from config import db, logger, STRIPE_API_KEY, PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_API_BASE
from utils.auth import get_current_user, require_vendor
from models import OrderResponse, CheckoutRequest, PayPalOrderResponse
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest

router = APIRouter(tags=["Orders & Payments"])


# ==================== ORDER ROUTES ====================

@router.get("/orders", response_model=List[OrderResponse])
async def get_orders(user: dict = Depends(get_current_user)):
    """Get orders for current user (admin sees all)"""
    query = {"user_id": user["id"]} if user["role"] != "admin" else {}
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    """Get a specific order"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if user["role"] != "admin" and order["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return order


@router.get("/vendor/orders", response_model=List[OrderResponse])
async def get_vendor_orders(user: dict = Depends(require_vendor)):
    """Get orders containing products from this vendor"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    orders = await db.orders.find({"items.vendor_id": vendor["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders


@router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, user: dict = Depends(require_vendor)):
    """Update order status"""
    valid_statuses = ["pending", "processing", "shipped", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}


# ==================== STRIPE CHECKOUT ====================

@router.post("/checkout/stripe")
async def create_stripe_checkout(checkout_req: CheckoutRequest, request: Request, user: dict = Depends(get_current_user)):
    """Create a Stripe checkout session"""
    cart = await db.cart_items.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    if not cart:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    total = 0.0
    items_data = []
    
    for item in cart:
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            item_total = product["price"] * item["quantity"]
            total += item_total
            items_data.append({
                "product_id": product["id"],
                "product_name": product["name"],
                "price": product["price"],
                "quantity": item["quantity"],
                "vendor_id": product.get("vendor_id", "")
            })
    
    if total <= 0:
        raise HTTPException(status_code=400, detail="Invalid cart total")
    
    order_id = str(uuid.uuid4())
    order_doc = {
        "id": order_id,
        "user_id": user["id"],
        "items": items_data,
        "shipping_address": {},
        "subtotal": round(total, 2),
        "shipping_cost": 0.0,
        "total": round(total, 2),
        "status": "pending",
        "payment_method": "stripe",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order_doc)
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    origin_url = checkout_req.origin_url.rstrip('/')
    success_url = f"{origin_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/cart"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(total),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"order_id": order_id, "user_id": user["id"]}
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    transaction_doc = {
        "id": str(uuid.uuid4()),
        "order_id": order_id,
        "user_id": user["id"],
        "session_id": session.session_id,
        "amount": round(total, 2),
        "currency": "usd",
        "payment_method": "stripe",
        "payment_status": "pending",
        "metadata": {"order_id": order_id},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction_doc)
    
    return {"checkout_url": session.url, "session_id": session.session_id, "order_id": order_id}


@router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, request: Request, user: dict = Depends(get_current_user)):
    """Get Stripe checkout status"""
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    
    if transaction and transaction.get("payment_status") != "paid":
        new_status = "paid" if status.payment_status == "paid" else status.payment_status
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": new_status}}
        )
        
        if new_status == "paid":
            await db.orders.update_one(
                {"id": transaction.get("order_id")},
                {"$set": {"payment_status": "paid", "status": "processing"}}
            )
            await db.cart_items.delete_many({"user_id": user["id"]})
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency
    }


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook"""
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {"payment_status": "paid"}}
            )
            
            transaction = await db.payment_transactions.find_one({"session_id": webhook_response.session_id}, {"_id": 0})
            if transaction:
                await db.orders.update_one(
                    {"id": transaction.get("order_id")},
                    {"$set": {"payment_status": "paid", "status": "processing"}}
                )
                await db.cart_items.delete_many({"user_id": transaction.get("user_id")})
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}


# ==================== PAYPAL CHECKOUT ====================

async def get_paypal_access_token() -> str:
    """Get PayPal OAuth access token"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{PAYPAL_API_BASE}/v1/oauth2/token",
            auth=(PAYPAL_CLIENT_ID, PAYPAL_SECRET),
            data={"grant_type": "client_credentials"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        response.raise_for_status()
        return response.json()["access_token"]


@router.post("/checkout/paypal", response_model=PayPalOrderResponse)
async def create_paypal_checkout(request: Request, user: dict = Depends(get_current_user)):
    """Create a PayPal order for checkout"""
    if not PAYPAL_CLIENT_ID or not PAYPAL_SECRET:
        raise HTTPException(status_code=500, detail="PayPal not configured")
    
    cart_items = await db.cart_items.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    subtotal = 0.0
    items_data = []
    order_items = []
    
    for item in cart_items:
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if not product:
            continue
        
        price = product["price"]
        if item.get("selected_options") and product.get("variants"):
            for variant in product.get("variants", []):
                if variant.get("options") == item.get("selected_options"):
                    price = variant.get("price", price)
                    break
        
        quantity = item.get("quantity", 1)
        item_total = price * quantity
        subtotal += item_total
        
        items_data.append({
            "name": product["name"][:127],
            "unit_amount": {"currency_code": "USD", "value": f"{price:.2f}"},
            "quantity": str(quantity)
        })
        
        order_items.append({
            "product_id": product["id"],
            "product_name": product["name"],
            "product_image": product.get("images", [None])[0],
            "price": price,
            "quantity": quantity,
            "selected_options": item.get("selected_options"),
            "vendor_id": product.get("vendor_id")
        })
    
    # Apply coupon if exists
    discount = 0.0
    discount_code = None
    applied_coupon = await db.cart_coupons.find_one({"user_id": user["id"]}, {"_id": 0})
    if applied_coupon:
        coupon = await db.coupons.find_one({"code": applied_coupon.get("coupon_code")}, {"_id": 0})
        if coupon and coupon.get("is_active"):
            if coupon["discount_type"] == "percentage":
                discount = subtotal * (coupon["discount_value"] / 100)
                if coupon.get("max_discount"):
                    discount = min(discount, coupon["max_discount"])
            else:
                discount = coupon["discount_value"]
            discount_code = coupon["code"]
    
    total = max(0, subtotal - discount)
    origin_url = request.headers.get("origin", str(request.base_url).rstrip('/'))
    
    order_id = str(uuid.uuid4())
    order_doc = {
        "id": order_id,
        "user_id": user["id"],
        "items": order_items,
        "subtotal": round(subtotal, 2),
        "discount": round(discount, 2),
        "discount_code": discount_code,
        "total": round(total, 2),
        "status": "pending",
        "payment_status": "pending",
        "payment_method": "paypal",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order_doc)
    
    try:
        access_token = await get_paypal_access_token()
        
        paypal_order_data = {
            "intent": "CAPTURE",
            "purchase_units": [{
                "reference_id": order_id,
                "amount": {
                    "currency_code": "USD",
                    "value": f"{total:.2f}",
                    "breakdown": {
                        "item_total": {"currency_code": "USD", "value": f"{subtotal:.2f}"},
                        "discount": {"currency_code": "USD", "value": f"{discount:.2f}"}
                    }
                },
                "items": items_data
            }],
            "application_context": {
                "brand_name": "Afrovending",
                "landing_page": "LOGIN",
                "user_action": "PAY_NOW",
                "return_url": f"{origin_url}/checkout/paypal/success?order_id={order_id}",
                "cancel_url": f"{origin_url}/checkout/paypal/cancel?order_id={order_id}"
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{PAYPAL_API_BASE}/v2/checkout/orders",
                json=paypal_order_data,
                headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
            )
            response.raise_for_status()
            paypal_order = response.json()
        
        approval_url = None
        for link in paypal_order.get("links", []):
            if link["rel"] == "approve":
                approval_url = link["href"]
                break
        
        if not approval_url:
            raise HTTPException(status_code=500, detail="PayPal approval URL not found")
        
        await db.orders.update_one({"id": order_id}, {"$set": {"paypal_order_id": paypal_order["id"]}})
        
        transaction_doc = {
            "id": str(uuid.uuid4()),
            "order_id": order_id,
            "user_id": user["id"],
            "paypal_order_id": paypal_order["id"],
            "amount": round(total, 2),
            "currency": "USD",
            "payment_method": "paypal",
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(transaction_doc)
        
        return PayPalOrderResponse(order_id=order_id, approval_url=approval_url, status=paypal_order["status"])
        
    except httpx.HTTPStatusError as e:
        logger.error(f"PayPal API error: {e.response.text}")
        await db.orders.delete_one({"id": order_id})
        raise HTTPException(status_code=500, detail="Failed to create PayPal order")
    except Exception as e:
        logger.error(f"PayPal error: {e}")
        await db.orders.delete_one({"id": order_id})
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/checkout/paypal/capture")
async def capture_paypal_payment(paypal_order_id: str, user: dict = Depends(get_current_user)):
    """Capture PayPal payment after approval"""
    if not PAYPAL_CLIENT_ID or not PAYPAL_SECRET:
        raise HTTPException(status_code=500, detail="PayPal not configured")
    
    order = await db.orders.find_one({"paypal_order_id": paypal_order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        access_token = await get_paypal_access_token()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{PAYPAL_API_BASE}/v2/checkout/orders/{paypal_order_id}/capture",
                headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
            )
            response.raise_for_status()
            capture_result = response.json()
        
        if capture_result["status"] == "COMPLETED":
            await db.orders.update_one(
                {"id": order["id"]},
                {"$set": {
                    "payment_status": "paid",
                    "status": "processing",
                    "paypal_capture_id": capture_result.get("purchase_units", [{}])[0].get("payments", {}).get("captures", [{}])[0].get("id")
                }}
            )
            
            await db.payment_transactions.update_one(
                {"paypal_order_id": paypal_order_id},
                {"$set": {"payment_status": "paid"}}
            )
            
            await db.cart_items.delete_many({"user_id": user["id"]})
            await db.cart_coupons.delete_many({"user_id": user["id"]})
            
            if order.get("discount_code"):
                await db.coupons.update_one({"code": order["discount_code"]}, {"$inc": {"used_count": 1}})
            
            tracking_event = {
                "id": str(uuid.uuid4()),
                "entity_id": order["id"],
                "entity_type": "order",
                "status": "confirmed",
                "message": "Payment confirmed via PayPal",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            await db.tracking_events.insert_one(tracking_event)
            
            return {"status": "success", "message": "Payment captured successfully", "order_id": order["id"]}
        else:
            return {"status": "pending", "message": f"Payment status: {capture_result['status']}", "order_id": order["id"]}
            
    except httpx.HTTPStatusError as e:
        logger.error(f"PayPal capture error: {e.response.text}")
        raise HTTPException(status_code=500, detail="Failed to capture payment")
    except Exception as e:
        logger.error(f"PayPal capture error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/checkout/paypal/status/{order_id}")
async def get_paypal_order_status(order_id: str, user: dict = Depends(get_current_user)):
    """Get PayPal order status"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return {
        "order_id": order["id"],
        "payment_status": order.get("payment_status", "pending"),
        "status": order.get("status", "pending"),
        "total": order.get("total", 0),
        "payment_method": order.get("payment_method", "unknown")
    }
