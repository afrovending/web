"""
Subscription routes for Afrovending API
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone
import uuid
import os
import json
import stripe

from config import db, logger, STRIPE_API_KEY
from utils.auth import get_current_user
from models import (
    SUBSCRIPTION_PLANS, SubscriptionResponse, VendorSubscription,
    SubscriptionCheckoutRequest, SubscriptionCheckoutResponse
)

stripe.api_key = STRIPE_API_KEY

router = APIRouter(tags=["Subscriptions"])


@router.get("/subscriptions/plans")
async def get_subscription_plans():
    """Get all available subscription plans"""
    plans = []
    for plan_id, plan in SUBSCRIPTION_PLANS.items():
        plan_dict = plan.model_dump()
        plans.append(plan_dict)
    return plans


@router.get("/subscriptions/current", response_model=SubscriptionResponse)
async def get_current_subscription(user: dict = Depends(get_current_user)):
    """Get current vendor's subscription details"""
    if user["role"] not in ["vendor", "admin"]:
        raise HTTPException(status_code=403, detail="Only vendors can view subscriptions")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    subscription = await db.vendor_subscriptions.find_one(
        {"vendor_id": vendor["id"], "status": {"$in": ["active", "trialing"]}},
        {"_id": 0}
    )
    
    product_count = await db.products.count_documents({"vendor_id": vendor["id"]})
    
    if subscription:
        plan = SUBSCRIPTION_PLANS.get(subscription["plan_id"])
        products_remaining = -1 if plan.product_limit == -1 else max(0, plan.product_limit - product_count)
        return SubscriptionResponse(
            subscription=VendorSubscription(**subscription),
            plan=plan,
            can_upgrade=subscription["plan_id"] != "enterprise",
            product_count=product_count,
            products_remaining=products_remaining
        )
    else:
        plan = SUBSCRIPTION_PLANS["starter"]
        return SubscriptionResponse(
            subscription=None,
            plan=plan,
            can_upgrade=True,
            product_count=product_count,
            products_remaining=max(0, plan.product_limit - product_count)
        )


@router.post("/subscriptions/checkout", response_model=SubscriptionCheckoutResponse)
async def create_subscription_checkout(request: SubscriptionCheckoutRequest, user: dict = Depends(get_current_user)):
    """Create a Stripe checkout session for subscription"""
    if user["role"] not in ["vendor", "admin"]:
        raise HTTPException(status_code=403, detail="Only vendors can subscribe")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    plan = SUBSCRIPTION_PLANS.get(request.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan ID")
    
    if plan.is_custom:
        raise HTTPException(status_code=400, detail="Enterprise plans require custom setup. Contact support.")
    
    if plan.price_monthly == 0 and request.plan_id == "starter":
        raise HTTPException(status_code=400, detail="Starter plan is free. No checkout needed.")
    
    user_doc = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    stripe_customer_id = vendor.get("stripe_customer_id")
    
    if not stripe_customer_id:
        customer = stripe.Customer.create(
            email=user_doc["email"],
            name=f"{user_doc['first_name']} {user_doc['last_name']}",
            metadata={"vendor_id": vendor["id"], "user_id": user["id"]}
        )
        stripe_customer_id = customer.id
        await db.vendors.update_one(
            {"id": vendor["id"]},
            {"$set": {"stripe_customer_id": stripe_customer_id}}
        )
    
    if request.billing_cycle == "yearly":
        amount = int(plan.price_yearly * 100)
        interval = "year"
    else:
        amount = int(plan.price_monthly * 100)
        interval = "month"
    
    price = stripe.Price.create(
        unit_amount=amount,
        currency="usd",
        recurring={"interval": interval},
        product_data={
            "name": f"Afrovending {plan.name} Plan ({request.billing_cycle.title()})",
            "metadata": {"plan_id": request.plan_id}
        }
    )
    
    success_url = f"{request.origin_url}/vendor/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{request.origin_url}/vendor/subscription/cancel"
    
    session = stripe.checkout.Session.create(
        customer=stripe_customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price.id, "quantity": 1}],
        mode="subscription",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "vendor_id": vendor["id"],
            "plan_id": request.plan_id,
            "billing_cycle": request.billing_cycle
        }
    )
    
    return SubscriptionCheckoutResponse(checkout_url=session.url, session_id=session.id)


@router.get("/subscriptions/success")
async def subscription_success(session_id: str, user: dict = Depends(get_current_user)):
    """Handle successful subscription checkout"""
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.payment_status != "paid":
            raise HTTPException(status_code=400, detail="Payment not completed")
        
        vendor_id = session.metadata.get("vendor_id")
        plan_id = session.metadata.get("plan_id")
        billing_cycle = session.metadata.get("billing_cycle", "monthly")
        
        plan = SUBSCRIPTION_PLANS.get(plan_id)
        if not plan:
            raise HTTPException(status_code=400, detail="Invalid plan")
        
        stripe_subscription = stripe.Subscription.retrieve(session.subscription)
        
        await db.vendor_subscriptions.update_many(
            {"vendor_id": vendor_id, "status": "active"},
            {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        subscription_doc = {
            "id": str(uuid.uuid4()),
            "vendor_id": vendor_id,
            "plan_id": plan_id,
            "plan_name": plan.name,
            "status": "active",
            "billing_cycle": billing_cycle,
            "current_period_start": datetime.fromtimestamp(stripe_subscription.current_period_start, tz=timezone.utc).isoformat(),
            "current_period_end": datetime.fromtimestamp(stripe_subscription.current_period_end, tz=timezone.utc).isoformat(),
            "stripe_subscription_id": stripe_subscription.id,
            "stripe_customer_id": session.customer,
            "commission_rate": plan.commission_rate,
            "product_limit": plan.product_limit,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.vendor_subscriptions.insert_one(subscription_doc)
        
        await db.vendors.update_one(
            {"id": vendor_id},
            {"$set": {
                "subscription_plan": plan_id,
                "commission_rate": plan.commission_rate,
                "product_limit": plan.product_limit
            }}
        )
        
        return {"message": "Subscription activated successfully", "plan": plan.name}
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/subscriptions/cancel")
async def cancel_subscription(user: dict = Depends(get_current_user)):
    """Cancel current subscription"""
    if user["role"] not in ["vendor", "admin"]:
        raise HTTPException(status_code=403, detail="Only vendors can cancel subscriptions")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    subscription = await db.vendor_subscriptions.find_one(
        {"vendor_id": vendor["id"], "status": "active"},
        {"_id": 0}
    )
    
    if not subscription:
        raise HTTPException(status_code=400, detail="No active subscription found")
    
    try:
        if subscription.get("stripe_subscription_id"):
            stripe.Subscription.modify(
                subscription["stripe_subscription_id"],
                cancel_at_period_end=True
            )
        
        await db.vendor_subscriptions.update_one(
            {"id": subscription["id"]},
            {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {"message": "Subscription will be cancelled at the end of the billing period"}
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/subscriptions/reactivate")
async def reactivate_subscription(user: dict = Depends(get_current_user)):
    """Reactivate a cancelled subscription before period ends"""
    if user["role"] not in ["vendor", "admin"]:
        raise HTTPException(status_code=403, detail="Only vendors can reactivate subscriptions")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    subscription = await db.vendor_subscriptions.find_one(
        {"vendor_id": vendor["id"], "status": "cancelled"},
        {"_id": 0}
    )
    
    if not subscription:
        raise HTTPException(status_code=400, detail="No cancelled subscription found")
    
    try:
        if subscription.get("stripe_subscription_id"):
            stripe.Subscription.modify(
                subscription["stripe_subscription_id"],
                cancel_at_period_end=False
            )
        
        await db.vendor_subscriptions.update_one(
            {"id": subscription["id"]},
            {"$set": {"status": "active", "cancelled_at": None}}
        )
        
        return {"message": "Subscription reactivated successfully"}
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/subscriptions/webhook")
async def subscription_webhook(request: Request):
    """Handle Stripe subscription webhooks"""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
    
    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        else:
            event = stripe.Event.construct_from(json.loads(payload), stripe.api_key)
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail="Invalid webhook")
    
    event_type = event["type"]
    data = event["data"]["object"]
    
    if event_type == "customer.subscription.updated":
        subscription_id = data["id"]
        status = data["status"]
        
        await db.vendor_subscriptions.update_one(
            {"stripe_subscription_id": subscription_id},
            {"$set": {"status": status}}
        )
    
    elif event_type == "customer.subscription.deleted":
        subscription_id = data["id"]
        
        sub = await db.vendor_subscriptions.find_one(
            {"stripe_subscription_id": subscription_id},
            {"_id": 0}
        )
        
        if sub:
            await db.vendor_subscriptions.update_one(
                {"id": sub["id"]},
                {"$set": {"status": "expired"}}
            )
            await db.vendors.update_one(
                {"id": sub["vendor_id"]},
                {"$set": {
                    "subscription_plan": "starter",
                    "commission_rate": 20,
                    "product_limit": 5
                }}
            )
    
    return {"status": "success"}
