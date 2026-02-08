from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Query, UploadFile, File, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse, HTMLResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
from jose import JWTError, jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
import aiofiles
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
import stripe
import boto3
from botocore.exceptions import ClientError

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'afrovending-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Stripe Configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
stripe.api_key = STRIPE_API_KEY

# Stripe Connect Configuration
STRIPE_CONNECT_CLIENT_ID = os.environ.get('STRIPE_CONNECT_CLIENT_ID', '')
PLATFORM_FEE_PERCENT = 10  # Platform takes 10% commission

# PayPal Configuration
PAYPAL_CLIENT_ID = os.environ.get('PAYPAL_CLIENT_ID', '')
PAYPAL_SECRET = os.environ.get('PAYPAL_SECRET', '')
PAYPAL_MODE = os.environ.get('PAYPAL_MODE', 'sandbox')  # 'sandbox' or 'live'
PAYPAL_API_BASE = "https://api-m.paypal.com" if PAYPAL_MODE == 'live' else "https://api-m.sandbox.paypal.com"

# SendGrid Configuration
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@afrovending.com')

# Upload Configuration
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# AWS S3 Configuration
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID', '')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY', '')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-2')
S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME', '')
S3_PUBLIC_URL = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com" if S3_BUCKET_NAME else ""

# Initialize S3 client
s3_client = None
if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and S3_BUCKET_NAME:
    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )

# Create the main app
app = FastAPI(title="Afrovending API", description="E-commerce marketplace for African vendors")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Import modular routes
from routes.auth import router as auth_router
from routes.categories import router as categories_router
from routes.products import router as products_router
from routes.vendors import router as vendors_router
from routes.services import router as services_router
from routes.bookings import router as bookings_router
from routes.cart import router as cart_router
from routes.coupons import router as coupons_router
from routes.orders import router as orders_router

# Register modular routers (these will take precedence over inline routes)
api_router.include_router(auth_router)
api_router.include_router(categories_router)
api_router.include_router(products_router)
api_router.include_router(vendors_router)
api_router.include_router(services_router)
api_router.include_router(bookings_router)
api_router.include_router(cart_router)
api_router.include_router(coupons_router)
api_router.include_router(orders_router)

security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: str = "customer"  # customer, vendor, admin

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    created_at: str
    vendor_id: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    model_config = ConfigDict(extra="ignore")
    id: str

# Product Variant Models
class VariantOption(BaseModel):
    name: str  # e.g., "Size", "Color"
    values: List[str]  # e.g., ["S", "M", "L", "XL"] or ["Red", "Blue", "Green"]

class ProductVariant(BaseModel):
    id: str = ""
    sku: Optional[str] = None
    options: Dict[str, str] = {}  # e.g., {"Size": "M", "Color": "Red"}
    price: Optional[float] = None  # Override base price, None = use base price
    compare_price: Optional[float] = None
    stock: int = 0
    image: Optional[str] = None  # Variant-specific image

class ProductBase(BaseModel):
    name: str
    description: str
    price: float
    compare_price: Optional[float] = None
    category_id: str
    images: List[str] = []
    stock: int = 0
    is_active: bool = True
    tags: List[str] = []
    # Variant fields
    has_variants: bool = False
    variant_options: List[VariantOption] = []  # Available options (Size, Color, etc.)
    variants: List[ProductVariant] = []  # Actual variant combinations

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    compare_price: Optional[float] = None
    category_id: Optional[str] = None
    images: Optional[List[str]] = None
    stock: Optional[int] = None
    is_active: Optional[bool] = None
    tags: Optional[List[str]] = None
    has_variants: Optional[bool] = None
    variant_options: Optional[List[VariantOption]] = None
    variants: Optional[List[ProductVariant]] = None

class ProductResponse(ProductBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    vendor_id: str
    vendor_name: Optional[str] = None
    average_rating: float = 0.0
    review_count: int = 0
    created_at: str
    is_verified_seller: bool = False  # Growth+ subscription badge

class VendorBase(BaseModel):
    store_name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None

class VendorCreate(VendorBase):
    pass

class VendorResponse(VendorBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    is_approved: bool = False
    total_sales: float = 0.0
    product_count: int = 0
    created_at: str
    is_verified_seller: bool = False  # Growth+ subscription badge
    subscription_plan: Optional[str] = None

class CartItemBase(BaseModel):
    product_id: str
    quantity: int = 1
    variant_id: Optional[str] = None  # Selected variant ID
    selected_options: Optional[Dict[str, str]] = None  # e.g., {"Size": "M", "Color": "Red"}

class CartItemResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    product_id: str
    product_name: str
    product_image: str
    price: float
    quantity: int
    vendor_id: str
    vendor_name: str
    variant_id: Optional[str] = None
    selected_options: Optional[Dict[str, str]] = None
    variant_sku: Optional[str] = None

class CartResponse(BaseModel):
    items: List[CartItemResponse]
    subtotal: float
    discount: float = 0.0
    discount_code: Optional[str] = None
    total: float

class WishlistItemResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    product_id: str
    product_name: str
    product_image: str
    price: float
    vendor_name: str

class ReviewBase(BaseModel):
    product_id: str
    rating: int = Field(ge=1, le=5)
    title: Optional[str] = None
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    pass

class ReviewResponse(ReviewBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    user_name: str
    created_at: str

class OrderItemBase(BaseModel):
    product_id: str
    quantity: int
    price: float

class OrderCreate(BaseModel):
    shipping_address: Dict[str, str]
    payment_method: str  # stripe, paypal

class OrderResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    items: List[Dict[str, Any]]
    shipping_address: Dict[str, str]
    subtotal: float
    shipping_cost: float = 0.0
    total: float
    status: str
    payment_method: str
    payment_status: str
    created_at: str

class CheckoutRequest(BaseModel):
    payment_method: str  # stripe, paypal
    origin_url: str
    coupon_code: Optional[str] = None

class PaymentStatusRequest(BaseModel):
    session_id: str

# ==================== COUPON MODELS ====================

class CouponBase(BaseModel):
    code: str
    discount_type: str = "percentage"  # percentage, fixed
    discount_value: float  # percentage (0-100) or fixed amount
    min_order_amount: float = 0.0
    max_discount: Optional[float] = None  # Cap for percentage discounts
    max_uses: Optional[int] = None  # Total usage limit
    max_uses_per_user: int = 1  # Per user limit
    start_date: Optional[str] = None
    expiry_date: Optional[str] = None
    is_active: bool = True
    applies_to: str = "all"  # all, products, services
    vendor_id: Optional[str] = None  # None = platform-wide, vendor_id = vendor-specific

class CouponCreate(CouponBase):
    pass

class CouponUpdate(BaseModel):
    code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    min_order_amount: Optional[float] = None
    max_discount: Optional[float] = None
    max_uses: Optional[int] = None
    max_uses_per_user: Optional[int] = None
    start_date: Optional[str] = None
    expiry_date: Optional[str] = None
    is_active: Optional[bool] = None
    applies_to: Optional[str] = None

class CouponResponse(CouponBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    used_count: int = 0
    created_by: str
    created_at: str

class ApplyCouponRequest(BaseModel):
    code: str

class CouponValidationResponse(BaseModel):
    valid: bool
    coupon: Optional[CouponResponse] = None
    discount_amount: float = 0.0
    message: str = ""

# ==================== SERVICE MODELS ====================

# ==================== SUBSCRIPTION MODELS ====================

class SubscriptionPlan(BaseModel):
    """Subscription plan configuration"""
    id: str
    name: str  # Starter, Growth, Pro Vendor, Enterprise
    price_monthly: float
    price_yearly: float  # With discount
    commission_rate: float  # Percentage taken from sales
    product_limit: int  # -1 for unlimited
    features: List[str]
    stripe_price_id_monthly: Optional[str] = None
    stripe_price_id_yearly: Optional[str] = None
    is_custom: bool = False

class VendorSubscription(BaseModel):
    """Vendor's active subscription"""
    model_config = ConfigDict(extra="ignore")
    id: str
    vendor_id: str
    plan_id: str
    plan_name: str
    status: str  # active, cancelled, past_due, trialing
    billing_cycle: str  # monthly, yearly
    current_period_start: str
    current_period_end: str
    stripe_subscription_id: Optional[str] = None
    stripe_customer_id: Optional[str] = None
    commission_rate: float
    product_limit: int
    created_at: str
    cancelled_at: Optional[str] = None

class SubscriptionCheckoutRequest(BaseModel):
    plan_id: str
    billing_cycle: str = "monthly"  # monthly, yearly
    origin_url: str

class SubscriptionCheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str

class SubscriptionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    subscription: Optional[VendorSubscription] = None
    plan: Optional[SubscriptionPlan] = None
    can_upgrade: bool = True
    product_count: int = 0
    products_remaining: int = -1  # -1 for unlimited

# Subscription Plans Configuration
SUBSCRIPTION_PLANS = {
    "starter": SubscriptionPlan(
        id="starter",
        name="Starter",
        price_monthly=0,
        price_yearly=0,
        commission_rate=20,
        product_limit=5,
        features=[
            "Vendor profile on Afrovending",
            "Up to 5 products",
            "Standard category placement",
            "Search visibility",
            "Email support"
        ],
        is_custom=False
    ),
    "growth": SubscriptionPlan(
        id="growth",
        name="Growth",
        price_monthly=25,
        price_yearly=250,  # ~17% discount
        commission_rate=15,
        product_limit=50,
        features=[
            "Up to 50 products",
            "Boosted category visibility",
            "Basic sales & traffic analytics",
            "Priority email support",
            "Verified Seller badge"
        ],
        is_custom=False
    ),
    "pro": SubscriptionPlan(
        id="pro",
        name="Pro Vendor",
        price_monthly=50,
        price_yearly=500,  # ~17% discount
        commission_rate=10,
        product_limit=-1,  # Unlimited
        features=[
            "Unlimited products",
            "10% commission rates",
            "Featured category placement",
            "Homepage promotion eligibility",
            "Advanced analytics (views, clicks, conversions)",
            "Priority chat support",
            "Early access to promotions"
        ],
        is_custom=False
    ),
    "enterprise": SubscriptionPlan(
        id="enterprise",
        name="Enterprise / Partner",
        price_monthly=0,  # Custom pricing
        price_yearly=0,
        commission_rate=0,  # Custom
        product_limit=-1,  # Unlimited
        features=[
            "Dedicated account manager",
            "Custom storefront page",
            "Bulk uploads / integrations",
            "Wholesale & B2B visibility",
            "Marketing collaborations",
            "Custom commission rates"
        ],
        is_custom=True
    )
}

# ==================== ANALYTICS MODELS ====================

class ProductViewEvent(BaseModel):
    product_id: str
    vendor_id: str
    user_id: Optional[str] = None
    session_id: str
    source: str = "direct"  # direct, search, category, homepage
    timestamp: str

class AnalyticsDateRange(BaseModel):
    start_date: str
    end_date: str

class SalesAnalytics(BaseModel):
    total_revenue: float
    total_orders: int
    average_order_value: float
    revenue_trend: List[Dict[str, Any]]  # Daily/weekly data points
    orders_trend: List[Dict[str, Any]]

class ProductAnalytics(BaseModel):
    product_id: str
    product_name: str
    views: int
    cart_adds: int
    purchases: int
    revenue: float
    conversion_rate: float

class TrafficAnalytics(BaseModel):
    total_views: int
    unique_visitors: int
    views_trend: List[Dict[str, Any]]
    top_sources: List[Dict[str, Any]]

class ConversionAnalytics(BaseModel):
    view_to_cart_rate: float
    cart_to_purchase_rate: float
    overall_conversion_rate: float
    funnel_data: List[Dict[str, Any]]

class CustomerAnalytics(BaseModel):
    total_customers: int
    new_customers: int
    returning_customers: int
    top_locations: List[Dict[str, Any]]

class VendorAnalyticsResponse(BaseModel):
    sales: SalesAnalytics
    top_products: List[ProductAnalytics]
    traffic: TrafficAnalytics
    conversions: ConversionAnalytics
    customers: CustomerAnalytics
    period: str
    has_access: bool = True

# ==================== PAYPAL MODELS ====================

class PayPalOrderCreate(BaseModel):
    payment_method: str = "paypal"

class PayPalOrderResponse(BaseModel):
    order_id: str
    approval_url: str
    status: str

class PayPalCaptureRequest(BaseModel):
    paypal_order_id: str

# ==================== EMAIL REPORT MODELS ====================

class VendorEmailPreferences(BaseModel):
    weekly_analytics_report: bool = True
    order_notifications: bool = True
    booking_notifications: bool = True
    marketing_emails: bool = True

class UpdateEmailPreferencesRequest(BaseModel):
    weekly_analytics_report: Optional[bool] = None
    order_notifications: Optional[bool] = None
    booking_notifications: Optional[bool] = None
    marketing_emails: Optional[bool] = None

class WeeklyReportData(BaseModel):
    vendor_name: str
    period_start: str
    period_end: str
    total_revenue: float
    total_orders: int
    average_order_value: float
    revenue_change: float  # Percentage change vs previous week
    orders_change: float
    total_views: int
    unique_visitors: int
    views_change: float
    view_to_cart_rate: float
    cart_to_purchase_rate: float
    overall_conversion_rate: float
    top_products: List[Dict[str, Any]]
    new_customers: int
    returning_customers: int
    top_locations: List[Dict[str, Any]]

class ServiceBase(BaseModel):
    name: str
    description: str
    category_id: str
    price: float
    price_type: str = "fixed"  # fixed, hourly, starting_from
    duration_minutes: int = 60
    location_type: str = "onsite"  # onsite, remote, both
    location_address: Optional[str] = None
    images: List[str] = []
    is_active: bool = True
    tags: List[str] = []

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    price: Optional[float] = None
    price_type: Optional[str] = None
    duration_minutes: Optional[int] = None
    location_type: Optional[str] = None
    location_address: Optional[str] = None
    images: Optional[List[str]] = None
    is_active: Optional[bool] = None
    tags: Optional[List[str]] = None

class ServiceResponse(ServiceBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    vendor_id: str
    vendor_name: Optional[str] = None
    average_rating: float = 0.0
    review_count: int = 0
    created_at: str

class ServiceAvailabilityBase(BaseModel):
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: str  # "09:00"
    end_time: str  # "17:00"
    is_available: bool = True

class ServiceAvailabilityCreate(ServiceAvailabilityBase):
    service_id: str

class TimeSlotResponse(BaseModel):
    date: str
    time: str
    is_available: bool

class BookingCreate(BaseModel):
    service_id: str
    booking_date: str  # "2024-02-15"
    booking_time: str  # "10:00"
    notes: Optional[str] = None
    customer_address: Optional[str] = None

class BookingResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    service_id: str
    service_name: str
    service_image: Optional[str] = None
    customer_id: str
    customer_name: str
    customer_email: str
    vendor_id: str
    vendor_name: str
    booking_date: str
    booking_time: str
    duration_minutes: int
    price: float
    status: str  # pending, confirmed, in_progress, completed, cancelled
    payment_status: str  # pending, paid, released, refunded
    delivery_confirmed: bool = False
    notes: Optional[str] = None
    customer_address: Optional[str] = None
    created_at: str

class BookingStatusUpdate(BaseModel):
    status: str

class ServiceCheckoutRequest(BaseModel):
    booking_id: str
    origin_url: str

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))):
    if credentials is None:
        return None
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        return user
    except JWTError:
        return None

async def require_vendor(user: dict = Depends(get_current_user)):
    if user.get("role") not in ["vendor", "admin"]:
        raise HTTPException(status_code=403, detail="Vendor access required")
    return user

async def require_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ==================== EMAIL SERVICE ====================

def send_email(to_email: str, subject: str, html_content: str):
    """Send email using SendGrid"""
    if not SENDGRID_API_KEY:
        logger.warning("SendGrid API key not configured, skipping email")
        return False
    
    try:
        message = Mail(
            from_email=Email(SENDER_EMAIL, "Afrovending"),
            to_emails=To(to_email),
            subject=subject,
            html_content=Content("text/html", html_content)
        )
        
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        logger.info(f"Email sent to {to_email}, status: {response.status_code}")
        return response.status_code == 202
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

def send_booking_created_email(vendor_email: str, vendor_name: str, booking: dict):
    """Notify vendor of new booking"""
    subject = f"New Booking: {booking['service_name']}"
    html_content = f"""
    <html>
    <body style="font-family: 'Ubuntu', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #c41e3a 0%, #1a1a1a 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-family: 'Montserrat', sans-serif;">New Booking!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi {vendor_name},</p>
            <p>You have received a new booking for your service.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #c41e3a;">
                <h3 style="margin-top: 0; color: #1a1a1a;">{booking['service_name']}</h3>
                <p><strong>Customer:</strong> {booking['customer_name']}</p>
                <p><strong>Email:</strong> {booking['customer_email']}</p>
                <p><strong>Date:</strong> {booking['booking_date']}</p>
                <p><strong>Time:</strong> {booking['booking_time']}</p>
                <p><strong>Duration:</strong> {booking['duration_minutes']} minutes</p>
                <p><strong>Price:</strong> ${booking['price']:.2f}</p>
                {f"<p><strong>Notes:</strong> {booking['notes']}</p>" if booking.get('notes') else ""}
            </div>
            
            <p>Please log in to your vendor dashboard to manage this booking.</p>
            <p style="color: #666; font-size: 12px;">This is an automated message from Afrovending.</p>
        </div>
    </body>
    </html>
    """
    return send_email(vendor_email, subject, html_content)

def send_booking_status_email(customer_email: str, customer_name: str, booking: dict, new_status: str):
    """Notify customer of booking status change"""
    status_messages = {
        "confirmed": "Your booking has been confirmed by the vendor.",
        "in_progress": "Your service is now in progress.",
        "completed": "Your service has been marked as completed.",
        "cancelled": "Your booking has been cancelled."
    }
    
    subject = f"Booking Update: {booking['service_name']}"
    html_content = f"""
    <html>
    <body style="font-family: 'Ubuntu', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #c41e3a 0%, #1a1a1a 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-family: 'Montserrat', sans-serif;">Booking Update</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi {customer_name},</p>
            <p>{status_messages.get(new_status, f"Your booking status has been updated to: {new_status}")}</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #c41e3a;">
                <h3 style="margin-top: 0; color: #1a1a1a;">{booking['service_name']}</h3>
                <p><strong>Date:</strong> {booking['booking_date']}</p>
                <p><strong>Time:</strong> {booking['booking_time']}</p>
                <p><strong>Status:</strong> <span style="color: #c41e3a; font-weight: bold;">{new_status.upper()}</span></p>
            </div>
            
            {"<p><strong>Next Step:</strong> After your service is completed, please confirm delivery in your dashboard to release the payment to the vendor.</p>" if new_status == "confirmed" else ""}
            
            <p style="color: #666; font-size: 12px;">This is an automated message from Afrovending.</p>
        </div>
    </body>
    </html>
    """
    return send_email(customer_email, subject, html_content)

def send_payment_released_email(vendor_email: str, vendor_name: str, booking: dict):
    """Notify vendor that payment has been released"""
    subject = f"Payment Released: {booking['service_name']}"
    html_content = f"""
    <html>
    <body style="font-family: 'Ubuntu', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #22c55e 0%, #1a1a1a 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-family: 'Montserrat', sans-serif;">Payment Released!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi {vendor_name},</p>
            <p>Great news! The customer has confirmed delivery of your service, and the payment has been released to you.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
                <h3 style="margin-top: 0; color: #1a1a1a;">{booking['service_name']}</h3>
                <p><strong>Customer:</strong> {booking['customer_name']}</p>
                <p><strong>Date:</strong> {booking['booking_date']}</p>
                <p style="font-size: 24px; color: #22c55e; font-weight: bold;">Amount: ${booking['price']:.2f}</p>
            </div>
            
            <p>Thank you for providing excellent service on Afrovending!</p>
            <p style="color: #666; font-size: 12px;">This is an automated message from Afrovending.</p>
        </div>
    </body>
    </html>
    """
    return send_email(vendor_email, subject, html_content)

def send_order_status_email(customer_email: str, customer_name: str, order: dict, new_status: str):
    """Notify customer of order status change"""
    status_messages = {
        "processing": "Your order is being processed.",
        "shipped": "Your order has been shipped!",
        "delivered": "Your order has been delivered.",
        "cancelled": "Your order has been cancelled."
    }
    
    subject = f"Order Update: #{order['id'][:8]}"
    html_content = f"""
    <html>
    <body style="font-family: 'Ubuntu', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #c41e3a 0%, #1a1a1a 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-family: 'Montserrat', sans-serif;">Order Update</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi {customer_name},</p>
            <p>{status_messages.get(new_status, f"Your order status has been updated to: {new_status}")}</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #c41e3a;">
                <h3 style="margin-top: 0; color: #1a1a1a;">Order #{order['id'][:8]}</h3>
                <p><strong>Items:</strong> {len(order.get('items', []))} item(s)</p>
                <p><strong>Total:</strong> ${order['total']:.2f}</p>
                <p><strong>Status:</strong> <span style="color: #c41e3a; font-weight: bold;">{new_status.upper()}</span></p>
            </div>
            
            <p>Log in to your dashboard to view full order details.</p>
            <p style="color: #666; font-size: 12px;">This is an automated message from Afrovending.</p>
        </div>
    </body>
    </html>
    """
    return send_email(customer_email, subject, html_content)

# ==================== AUTH ROUTES (MIGRATED TO routes/auth.py) ====================
# These routes are now handled by the modular router imported above

# ==================== CATEGORY ROUTES (MIGRATED TO routes/categories.py) ====================
# These routes are now handled by the modular router imported above

# ==================== PRODUCT ROUTES (MIGRATED TO routes/products.py) ====================
# These routes are now handled by the modular router imported above

# ==================== VENDOR ROUTES (MIGRATED TO routes/vendors.py) ====================
# These routes are now handled by the modular router imported above

# ==================== SERVICE ROUTES (MIGRATED TO routes/services.py) ====================
# These routes are now handled by the modular router imported above

# ==================== BOOKING ROUTES (MIGRATED TO routes/bookings.py) ====================
# These routes are now handled by the modular router imported above

# ==================== COUPON ROUTES (MIGRATED TO routes/coupons.py) ====================
# These routes are now handled by the modular router imported above

# ==================== CART ROUTES (MIGRATED TO routes/cart.py) ====================
# These routes are now handled by the modular router imported above

# ==================== WISHLIST ROUTES (MIGRATED TO routes/cart.py) ====================
# These routes are now handled by the modular router imported above

# ==================== REVIEW ROUTES (MIGRATED TO routes/cart.py) ====================
# These routes are now handled by the modular router imported above

# ==================== ORDER & CHECKOUT/PAYMENT ROUTES (MIGRATED TO routes/orders.py) ====================
# These routes are now handled by the modular router imported above

# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/stats")
async def get_admin_stats(user: dict = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    total_vendors = await db.vendors.count_documents({})
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    pending_vendors = await db.vendors.count_documents({"is_approved": False})
    
    # Calculate revenue
    paid_orders = await db.orders.find({"payment_status": "paid"}, {"total": 1}).to_list(10000)
    total_revenue = sum(o.get("total", 0) for o in paid_orders)
    
    return {
        "total_users": total_users,
        "total_vendors": total_vendors,
        "total_products": total_products,
        "total_orders": total_orders,
        "pending_vendors": pending_vendors,
        "total_revenue": round(total_revenue, 2)
    }

@api_router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(user: dict = Depends(require_admin), skip: int = 0, limit: int = 50):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    return users

@api_router.put("/admin/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, admin: dict = Depends(require_admin)):
    valid_roles = ["customer", "vendor", "admin"]
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")
    
    result = await db.users.update_one({"id": user_id}, {"$set": {"role": role}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User role updated"}

@api_router.get("/admin/orders", response_model=List[OrderResponse])
async def get_all_orders(user: dict = Depends(require_admin), skip: int = 0, limit: int = 50):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return orders

# ==================== IMAGE UPLOAD ====================

@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Upload an image file for products or services to S3"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.")
    
    # Validate file size (max 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")
    
    # Generate unique filename
    ext = file.filename.split('.')[-1].lower() if '.' in file.filename else 'jpg'
    filename = f"products/{uuid.uuid4()}.{ext}"
    
    # Check if S3 is configured
    if s3_client and S3_BUCKET_NAME:
        try:
            # Upload to S3
            s3_client.put_object(
                Body=contents,
                Bucket=S3_BUCKET_NAME,
                Key=filename,
                ContentType=file.content_type,
                ACL='public-read'
            )
            
            # Return the S3 public URL
            image_url = f"{S3_PUBLIC_URL}/{filename}"
            logger.info(f"Image uploaded to S3: {filename} by user {user['id']}")
            return {"url": image_url, "filename": filename, "storage": "s3"}
            
        except ClientError as e:
            logger.error(f"S3 upload failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to upload image to cloud storage")
    else:
        # Fallback to local storage if S3 is not configured
        local_filename = f"{uuid.uuid4()}.{ext}"
        filepath = UPLOAD_DIR / local_filename
        
        async with aiofiles.open(filepath, 'wb') as f:
            await f.write(contents)
        
        image_url = f"/api/uploads/{local_filename}"
        logger.info(f"Image uploaded locally: {local_filename} by user {user['id']}")
        return {"url": image_url, "filename": local_filename, "storage": "local"}

@api_router.get("/uploads/{filename}")
async def get_uploaded_image(filename: str):
    """Serve uploaded images from local storage (fallback)"""
    from fastapi.responses import FileResponse
    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(filepath)

# ==================== ORDER/BOOKING TRACKING ====================

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

@api_router.get("/tracking", response_model=List[TrackingItem])
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

@api_router.get("/tracking/{item_type}/{item_id}")
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

# ==================== VENDOR PAYOUT DASHBOARD ====================

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
    type: str  # "earning", "payout", "fee"
    amount: float
    description: str
    status: str
    booking_id: Optional[str] = None
    order_id: Optional[str] = None
    created_at: str

class PayoutRequest(BaseModel):
    amount: float

@api_router.get("/vendor/payout/summary", response_model=PayoutSummary)
async def get_vendor_payout_summary(user: dict = Depends(require_vendor)):
    """Get vendor's payout summary"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    # Calculate totals from completed bookings
    completed_bookings = await db.bookings.find({
        "vendor_id": vendor["id"],
        "delivery_confirmed": True
    }, {"_id": 0}).to_list(1000)
    
    total_sales = sum(b.get("price", 0) for b in completed_bookings)
    platform_fees = total_sales * (PLATFORM_FEE_PERCENT / 100)
    
    # Get payouts made
    payouts = await db.vendor_payouts.find({
        "vendor_id": vendor["id"],
        "status": "completed"
    }, {"_id": 0}).to_list(1000)
    
    total_paid_out = sum(p.get("amount", 0) for p in payouts)
    
    # Calculate available balance (after platform fee)
    available_balance = (total_sales - platform_fees) - total_paid_out
    
    # Pending payouts (confirmed but not yet released)
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

@api_router.get("/vendor/payout/transactions", response_model=List[PayoutTransaction])
async def get_vendor_payout_transactions(user: dict = Depends(require_vendor), limit: int = 50):
    """Get vendor's transaction history"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    transactions = []
    
    # Get completed bookings as earnings
    bookings = await db.bookings.find({
        "vendor_id": vendor["id"],
        "delivery_confirmed": True
    }, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    for booking in bookings:
        # Add earning
        transactions.append(PayoutTransaction(
            id=f"earn_{booking['id']}",
            type="earning",
            amount=booking["price"],
            description=f"Service: {booking['service_name']}",
            status="completed",
            booking_id=booking["id"],
            created_at=booking.get("created_at", datetime.now(timezone.utc).isoformat())
        ))
        
        # Add platform fee
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
    
    # Get payouts
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
    
    # Sort all transactions by date
    transactions.sort(key=lambda x: x.created_at, reverse=True)
    return transactions[:limit]

@api_router.post("/vendor/stripe/connect")
async def create_stripe_connect_link(request: Request, user: dict = Depends(require_vendor)):
    """Create a Stripe Connect onboarding link for the vendor"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    try:
        # Check if vendor already has a Stripe account
        if vendor.get("stripe_account_id"):
            # Create a login link for existing account
            login_link = stripe.Account.create_login_link(vendor["stripe_account_id"])
            return {"url": login_link.url, "type": "login"}
        
        # Create a new Stripe Express account
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
        
        # Save the Stripe account ID to vendor
        await db.vendors.update_one(
            {"id": vendor["id"]},
            {"$set": {"stripe_account_id": account.id}}
        )
        
        # Create onboarding link
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

@api_router.get("/vendor/stripe/return")
async def stripe_connect_return(account_id: str, request: Request):
    """Handle return from Stripe Connect onboarding"""
    try:
        # Verify the account
        account = stripe.Account.retrieve(account_id)
        
        # Update vendor with Stripe account status
        if account.charges_enabled:
            await db.vendors.update_one(
                {"stripe_account_id": account_id},
                {"$set": {"stripe_payouts_enabled": True}}
            )
        
        # Redirect to vendor dashboard
        frontend_url = os.environ.get('FRONTEND_URL', 'https://afro-paypal-test.preview.emergentagent.com')
        return RedirectResponse(url=f"{frontend_url}/vendor/dashboard?stripe=connected")
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe return error: {str(e)}")
        frontend_url = os.environ.get('FRONTEND_URL', 'https://afro-paypal-test.preview.emergentagent.com')
        return RedirectResponse(url=f"{frontend_url}/vendor/dashboard?stripe=error")

@api_router.get("/vendor/stripe/refresh")
async def stripe_connect_refresh(request: Request):
    """Handle refresh from Stripe Connect (user needs to restart onboarding)"""
    frontend_url = os.environ.get('FRONTEND_URL', 'https://afro-paypal-test.preview.emergentagent.com')
    return RedirectResponse(url=f"{frontend_url}/vendor/dashboard?stripe=refresh")

@api_router.get("/vendor/stripe/status")
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
        return {
            "connected": False,
            "error": str(e)
        }

@api_router.post("/vendor/payout/request")
async def request_payout(payout_req: PayoutRequest, user: dict = Depends(require_vendor)):
    """Request a payout to vendor's connected Stripe account"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    if not vendor.get("stripe_account_id"):
        raise HTTPException(status_code=400, detail="Please connect your Stripe account first")
    
    # Calculate available balance
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
        # Create a transfer to the connected account
        transfer = stripe.Transfer.create(
            amount=int(payout_req.amount * 100),  # Convert to cents
            currency="usd",
            destination=vendor["stripe_account_id"],
            metadata={
                "vendor_id": vendor["id"],
                "user_id": user["id"]
            }
        )
        
        # Record the payout
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
        
        logger.info(f"Payout created for vendor {vendor['id']}: ${payout_req.amount}")
        
        return {
            "message": "Payout successful",
            "payout_id": payout_id,
            "amount": payout_req.amount,
            "transfer_id": transfer.id
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Payout error: {str(e)}")
        
        # Record failed payout attempt
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

# ==================== SUBSCRIPTION ENDPOINTS ====================

@api_router.get("/subscriptions/plans")
async def get_subscription_plans():
    """Get all available subscription plans"""
    plans = []
    for plan_id, plan in SUBSCRIPTION_PLANS.items():
        plan_dict = plan.model_dump()
        plans.append(plan_dict)
    return plans

@api_router.get("/subscriptions/current", response_model=SubscriptionResponse)
async def get_current_subscription(user: dict = Depends(get_current_user)):
    """Get current vendor's subscription details"""
    if user["role"] not in ["vendor", "admin"]:
        raise HTTPException(status_code=403, detail="Only vendors can view subscriptions")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    # Get subscription
    subscription = await db.vendor_subscriptions.find_one(
        {"vendor_id": vendor["id"], "status": {"$in": ["active", "trialing"]}},
        {"_id": 0}
    )
    
    # Count products
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
        # Default to Starter plan
        plan = SUBSCRIPTION_PLANS["starter"]
        return SubscriptionResponse(
            subscription=None,
            plan=plan,
            can_upgrade=True,
            product_count=product_count,
            products_remaining=max(0, plan.product_limit - product_count)
        )

@api_router.post("/subscriptions/checkout", response_model=SubscriptionCheckoutResponse)
async def create_subscription_checkout(
    request: SubscriptionCheckoutRequest,
    user: dict = Depends(get_current_user)
):
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
    
    # Get or create Stripe customer
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
    
    # Determine price based on billing cycle
    if request.billing_cycle == "yearly":
        amount = int(plan.price_yearly * 100)  # Stripe uses cents
        interval = "year"
    else:
        amount = int(plan.price_monthly * 100)
        interval = "month"
    
    # Create a price for this subscription
    price = stripe.Price.create(
        unit_amount=amount,
        currency="usd",
        recurring={"interval": interval},
        product_data={
            "name": f"Afrovending {plan.name} Plan ({request.billing_cycle.title()})",
            "metadata": {"plan_id": request.plan_id}
        }
    )
    
    # Create checkout session
    success_url = f"{request.origin_url}/vendor/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{request.origin_url}/vendor/subscription/cancel"
    
    session = stripe.checkout.Session.create(
        customer=stripe_customer_id,
        payment_method_types=["card"],
        line_items=[{
            "price": price.id,
            "quantity": 1
        }],
        mode="subscription",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "vendor_id": vendor["id"],
            "plan_id": request.plan_id,
            "billing_cycle": request.billing_cycle
        }
    )
    
    return SubscriptionCheckoutResponse(
        checkout_url=session.url,
        session_id=session.id
    )

@api_router.get("/subscriptions/success")
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
        
        # Get subscription details from Stripe
        stripe_subscription = stripe.Subscription.retrieve(session.subscription)
        
        # Deactivate any existing subscription
        await db.vendor_subscriptions.update_many(
            {"vendor_id": vendor_id, "status": "active"},
            {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Create new subscription record
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
        
        # Update vendor's commission rate
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

@api_router.post("/subscriptions/cancel")
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
        # Cancel in Stripe (at period end)
        if subscription.get("stripe_subscription_id"):
            stripe.Subscription.modify(
                subscription["stripe_subscription_id"],
                cancel_at_period_end=True
            )
        
        # Update local record
        await db.vendor_subscriptions.update_one(
            {"id": subscription["id"]},
            {"$set": {
                "status": "cancelled",
                "cancelled_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {"message": "Subscription will be cancelled at the end of the billing period"}
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/subscriptions/reactivate")
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

@api_router.post("/subscriptions/webhook")
async def subscription_webhook(request: Request):
    """Handle Stripe subscription webhooks"""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
    
    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        else:
            event = stripe.Event.construct_from(
                json.loads(payload), stripe.api_key
            )
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
            {"$set": {
                "status": status,
                "current_period_start": datetime.fromtimestamp(data["current_period_start"], tz=timezone.utc).isoformat(),
                "current_period_end": datetime.fromtimestamp(data["current_period_end"], tz=timezone.utc).isoformat()
            }}
        )
        
    elif event_type == "customer.subscription.deleted":
        subscription_id = data["id"]
        
        # Find subscription and downgrade vendor to starter
        sub = await db.vendor_subscriptions.find_one({"stripe_subscription_id": subscription_id}, {"_id": 0})
        if sub:
            await db.vendor_subscriptions.update_one(
                {"id": sub["id"]},
                {"$set": {"status": "cancelled"}}
            )
            
            # Downgrade vendor to starter plan
            starter = SUBSCRIPTION_PLANS["starter"]
            await db.vendors.update_one(
                {"id": sub["vendor_id"]},
                {"$set": {
                    "subscription_plan": "starter",
                    "commission_rate": starter.commission_rate,
                    "product_limit": starter.product_limit
                }}
            )
    
    elif event_type == "invoice.payment_failed":
        subscription_id = data.get("subscription")
        if subscription_id:
            await db.vendor_subscriptions.update_one(
                {"stripe_subscription_id": subscription_id},
                {"$set": {"status": "past_due"}}
            )
    
    return {"received": True}

@api_router.get("/subscriptions/portal")
async def get_customer_portal(origin_url: str, user: dict = Depends(get_current_user)):
    """Get Stripe customer portal link for managing subscription"""
    if user["role"] not in ["vendor", "admin"]:
        raise HTTPException(status_code=403, detail="Only vendors can access billing portal")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    if not vendor.get("stripe_customer_id"):
        raise HTTPException(status_code=400, detail="No billing account found. Subscribe to a plan first.")
    
    try:
        portal_session = stripe.billing_portal.Session.create(
            customer=vendor["stripe_customer_id"],
            return_url=f"{origin_url}/vendor/dashboard"
        )
        return {"portal_url": portal_session.url}
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== ANALYTICS ENDPOINTS ====================

async def check_analytics_access(vendor_id: str) -> bool:
    """Check if vendor has Growth+ subscription for analytics access"""
    subscription = await db.vendor_subscriptions.find_one(
        {"vendor_id": vendor_id, "status": {"$in": ["active", "trialing"]}},
        {"_id": 0}
    )
    if subscription and subscription.get("plan_id") in ["growth", "pro", "enterprise"]:
        return True
    return False

@api_router.post("/analytics/track-view")
async def track_product_view(
    product_id: str,
    source: str = "direct",
    session_id: Optional[str] = None,
    user: Optional[dict] = None
):
    """Track a product view event"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0, "vendor_id": 1})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    view_event = {
        "id": str(uuid.uuid4()),
        "product_id": product_id,
        "vendor_id": product["vendor_id"],
        "user_id": user["id"] if user else None,
        "session_id": session_id or str(uuid.uuid4()),
        "source": source,
        "event_type": "view",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.analytics_events.insert_one(view_event)
    
    # Increment view count on product
    await db.products.update_one(
        {"id": product_id},
        {"$inc": {"view_count": 1}}
    )
    
    return {"success": True}

@api_router.post("/analytics/track-cart-add")
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

@api_router.get("/analytics/vendor", response_model=VendorAnalyticsResponse)
async def get_vendor_analytics(
    period: str = "30d",  # 7d, 30d, 90d, 1y
    user: dict = Depends(get_current_user)
):
    """Get comprehensive analytics for vendor (Growth+ only)"""
    if user["role"] not in ["vendor", "admin"]:
        raise HTTPException(status_code=403, detail="Only vendors can access analytics")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    # Check subscription access
    has_access = await check_analytics_access(vendor["id"])
    if not has_access and user["role"] != "admin":
        # Return limited response for non-Growth+ vendors
        return VendorAnalyticsResponse(
            sales=SalesAnalytics(
                total_revenue=0, total_orders=0, average_order_value=0,
                revenue_trend=[], orders_trend=[]
            ),
            top_products=[],
            traffic=TrafficAnalytics(
                total_views=0, unique_visitors=0, views_trend=[], top_sources=[]
            ),
            conversions=ConversionAnalytics(
                view_to_cart_rate=0, cart_to_purchase_rate=0,
                overall_conversion_rate=0, funnel_data=[]
            ),
            customers=CustomerAnalytics(
                total_customers=0, new_customers=0, returning_customers=0, top_locations=[]
            ),
            period=period,
            has_access=False
        )
    
    # Calculate date range
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
    
    # ===== SALES ANALYTICS =====
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
            vendor_orders.append({
                "date": order.get("created_at", "")[:10],
                "revenue": order_revenue,
                "items": len(vendor_items)
            })
    
    total_orders = len(vendor_orders)
    avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
    
    # Group by date for trends
    from collections import defaultdict
    revenue_by_date = defaultdict(float)
    orders_by_date = defaultdict(int)
    for order in vendor_orders:
        date = order["date"]
        revenue_by_date[date] += order["revenue"]
        orders_by_date[date] += 1
    
    # Generate all dates in range
    date_range = []
    current = start_date
    while current <= now:
        date_range.append(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)
    
    revenue_trend = [{"date": d, "value": round(revenue_by_date.get(d, 0), 2)} for d in date_range]
    orders_trend = [{"date": d, "value": orders_by_date.get(d, 0)} for d in date_range]
    
    sales_analytics = SalesAnalytics(
        total_revenue=round(total_revenue, 2),
        total_orders=total_orders,
        average_order_value=round(avg_order_value, 2),
        revenue_trend=revenue_trend[-30:],  # Last 30 data points
        orders_trend=orders_trend[-30:]
    )
    
    # ===== TOP PRODUCTS =====
    products = await db.products.find({"vendor_id": vendor["id"]}, {"_id": 0}).to_list(100)
    product_analytics = []
    
    for product in products:
        # Get views
        views = await db.analytics_events.count_documents({
            "product_id": product["id"],
            "event_type": "view",
            "timestamp": {"$gte": start_iso}
        })
        
        # Get cart adds
        cart_adds = await db.analytics_events.count_documents({
            "product_id": product["id"],
            "event_type": "cart_add",
            "timestamp": {"$gte": start_iso}
        })
        
        # Get purchases from orders
        purchases = 0
        product_revenue = 0.0
        for order in orders:
            for item in order.get("items", []):
                if item.get("product_id") == product["id"]:
                    purchases += item.get("quantity", 1)
                    product_revenue += item.get("price", 0) * item.get("quantity", 1)
        
        conversion_rate = (purchases / views * 100) if views > 0 else 0
        
        product_analytics.append(ProductAnalytics(
            product_id=product["id"],
            product_name=product["name"],
            views=views or product.get("view_count", 0),
            cart_adds=cart_adds,
            purchases=purchases,
            revenue=round(product_revenue, 2),
            conversion_rate=round(conversion_rate, 2)
        ))
    
    # Sort by revenue
    top_products = sorted(product_analytics, key=lambda x: x.revenue, reverse=True)[:10]
    
    # ===== TRAFFIC ANALYTICS =====
    total_views = await db.analytics_events.count_documents({
        "vendor_id": vendor["id"],
        "event_type": "view",
        "timestamp": {"$gte": start_iso}
    })
    
    # Unique visitors (by session_id)
    unique_sessions = await db.analytics_events.distinct(
        "session_id",
        {"vendor_id": vendor["id"], "event_type": "view", "timestamp": {"$gte": start_iso}}
    )
    unique_visitors = len(unique_sessions)
    
    # Views by date
    views_by_date = defaultdict(int)
    view_events = await db.analytics_events.find({
        "vendor_id": vendor["id"],
        "event_type": "view",
        "timestamp": {"$gte": start_iso}
    }, {"_id": 0, "timestamp": 1}).to_list(10000)
    
    for event in view_events:
        date = event.get("timestamp", "")[:10]
        views_by_date[date] += 1
    
    views_trend = [{"date": d, "value": views_by_date.get(d, 0)} for d in date_range]
    
    # Traffic sources
    source_counts = defaultdict(int)
    source_events = await db.analytics_events.find({
        "vendor_id": vendor["id"],
        "event_type": "view",
        "timestamp": {"$gte": start_iso}
    }, {"_id": 0, "source": 1}).to_list(10000)
    
    for event in source_events:
        source_counts[event.get("source", "direct")] += 1
    
    top_sources = [{"source": k, "count": v} for k, v in sorted(source_counts.items(), key=lambda x: x[1], reverse=True)]
    
    traffic_analytics = TrafficAnalytics(
        total_views=total_views or sum(p.get("view_count", 0) for p in products),
        unique_visitors=unique_visitors,
        views_trend=views_trend[-30:],
        top_sources=top_sources[:5]
    )
    
    # ===== CONVERSION ANALYTICS =====
    total_cart_adds = await db.analytics_events.count_documents({
        "vendor_id": vendor["id"],
        "event_type": "cart_add",
        "timestamp": {"$gte": start_iso}
    })
    
    total_purchases = sum(p.purchases for p in product_analytics)
    
    view_to_cart = (total_cart_adds / traffic_analytics.total_views * 100) if traffic_analytics.total_views > 0 else 0
    cart_to_purchase = (total_purchases / total_cart_adds * 100) if total_cart_adds > 0 else 0
    overall_conversion = (total_purchases / traffic_analytics.total_views * 100) if traffic_analytics.total_views > 0 else 0
    
    funnel_data = [
        {"stage": "Views", "count": traffic_analytics.total_views},
        {"stage": "Cart Adds", "count": total_cart_adds},
        {"stage": "Purchases", "count": total_purchases}
    ]
    
    conversion_analytics = ConversionAnalytics(
        view_to_cart_rate=round(view_to_cart, 2),
        cart_to_purchase_rate=round(cart_to_purchase, 2),
        overall_conversion_rate=round(overall_conversion, 2),
        funnel_data=funnel_data
    )
    
    # ===== CUSTOMER ANALYTICS =====
    customer_ids = set()
    customer_first_order = {}
    
    for order in orders:
        customer_id = order.get("user_id")
        if customer_id:
            customer_ids.add(customer_id)
            order_date = order.get("created_at", "")
            if customer_id not in customer_first_order or order_date < customer_first_order[customer_id]:
                customer_first_order[customer_id] = order_date
    
    new_customers = sum(1 for cid, first_date in customer_first_order.items() if first_date >= start_iso)
    returning_customers = len(customer_ids) - new_customers
    
    # Top locations (from user data)
    location_counts = defaultdict(int)
    for customer_id in customer_ids:
        user_doc = await db.users.find_one({"id": customer_id}, {"_id": 0, "country": 1, "city": 1})
        if user_doc:
            location = user_doc.get("country") or user_doc.get("city") or "Unknown"
            location_counts[location] += 1
    
    top_locations = [{"location": k, "count": v} for k, v in sorted(location_counts.items(), key=lambda x: x[1], reverse=True)]
    
    customer_analytics = CustomerAnalytics(
        total_customers=len(customer_ids),
        new_customers=new_customers,
        returning_customers=max(0, returning_customers),
        top_locations=top_locations[:5]
    )
    
    return VendorAnalyticsResponse(
        sales=sales_analytics,
        top_products=top_products,
        traffic=traffic_analytics,
        conversions=conversion_analytics,
        customers=customer_analytics,
        period=period,
        has_access=True
    )

@api_router.get("/analytics/product/{product_id}")
async def get_product_analytics(
    product_id: str,
    period: str = "30d",
    user: dict = Depends(get_current_user)
):
    """Get detailed analytics for a specific product"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor or (vendor["id"] != product["vendor_id"] and user["role"] != "admin"):
        raise HTTPException(status_code=403, detail="Not authorized to view this product's analytics")
    
    has_access = await check_analytics_access(vendor["id"])
    if not has_access and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Upgrade to Growth or higher to access analytics")
    
    # Calculate date range
    now = datetime.now(timezone.utc)
    days = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}.get(period, 30)
    start_date = now - timedelta(days=days)
    start_iso = start_date.isoformat()
    
    # Get view events by date
    from collections import defaultdict
    views_by_date = defaultdict(int)
    cart_by_date = defaultdict(int)
    
    events = await db.analytics_events.find({
        "product_id": product_id,
        "timestamp": {"$gte": start_iso}
    }, {"_id": 0}).to_list(10000)
    
    for event in events:
        date = event.get("timestamp", "")[:10]
        if event.get("event_type") == "view":
            views_by_date[date] += 1
        elif event.get("event_type") == "cart_add":
            cart_by_date[date] += 1
    
    # Generate date range
    date_range = []
    current = start_date
    while current <= now:
        date_range.append(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)
    
    views_trend = [{"date": d, "value": views_by_date.get(d, 0)} for d in date_range]
    cart_trend = [{"date": d, "value": cart_by_date.get(d, 0)} for d in date_range]
    
    # Get purchase data from orders
    orders = await db.orders.find({
        "created_at": {"$gte": start_iso},
        "items.product_id": product_id,
        "payment_status": "paid"
    }, {"_id": 0}).to_list(1000)
    
    purchases_by_date = defaultdict(int)
    total_revenue = 0.0
    total_purchases = 0
    
    for order in orders:
        date = order.get("created_at", "")[:10]
        for item in order.get("items", []):
            if item.get("product_id") == product_id:
                qty = item.get("quantity", 1)
                purchases_by_date[date] += qty
                total_purchases += qty
                total_revenue += item.get("price", 0) * qty
    
    purchases_trend = [{"date": d, "value": purchases_by_date.get(d, 0)} for d in date_range]
    
    return {
        "product_id": product_id,
        "product_name": product["name"],
        "period": period,
        "total_views": sum(views_by_date.values()) or product.get("view_count", 0),
        "total_cart_adds": sum(cart_by_date.values()),
        "total_purchases": total_purchases,
        "total_revenue": round(total_revenue, 2),
        "conversion_rate": round((total_purchases / max(1, sum(views_by_date.values()))) * 100, 2),
        "views_trend": views_trend[-30:],
        "cart_trend": cart_trend[-30:],
        "purchases_trend": purchases_trend[-30:]
    }

# ==================== EMAIL REPORTS ENDPOINTS ====================

@api_router.get("/vendor/email-preferences", response_model=VendorEmailPreferences)
async def get_email_preferences(user: dict = Depends(get_current_user)):
    """Get vendor's email notification preferences"""
    if user["role"] not in ["vendor", "admin"]:
        raise HTTPException(status_code=403, detail="Only vendors can access email preferences")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    # Return preferences or defaults
    preferences = vendor.get("email_preferences", {})
    return VendorEmailPreferences(
        weekly_analytics_report=preferences.get("weekly_analytics_report", True),
        order_notifications=preferences.get("order_notifications", True),
        booking_notifications=preferences.get("booking_notifications", True),
        marketing_emails=preferences.get("marketing_emails", True)
    )

@api_router.put("/vendor/email-preferences", response_model=VendorEmailPreferences)
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
    
    # Get current preferences
    current = vendor.get("email_preferences", {
        "weekly_analytics_report": True,
        "order_notifications": True,
        "booking_notifications": True,
        "marketing_emails": True
    })
    
    # Update only provided fields
    update_data = request.model_dump(exclude_none=True)
    current.update(update_data)
    
    await db.vendors.update_one(
        {"id": vendor["id"]},
        {"$set": {"email_preferences": current}}
    )
    
    return VendorEmailPreferences(**current)

async def generate_weekly_report_html(report: WeeklyReportData) -> str:
    """Generate HTML email for weekly analytics report"""
    
    # Format top products
    top_products_html = ""
    for i, product in enumerate(report.top_products[:5], 1):
        top_products_html += f"""
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">{i}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">{product['product_name'][:30]}...</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">{product['views']}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">{product['purchases']}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; color: #16a34a;">${product['revenue']:.2f}</td>
        </tr>
        """
    
    # Format top locations
    locations_html = ""
    for loc in report.top_locations[:3]:
        locations_html += f"<li>{loc['location']}: {loc['count']} customers</li>"
    
    # Revenue change indicator
    rev_change_color = "#16a34a" if report.revenue_change >= 0 else "#dc2626"
    rev_change_icon = "↑" if report.revenue_change >= 0 else "↓"
    
    orders_change_color = "#16a34a" if report.orders_change >= 0 else "#dc2626"
    orders_change_icon = "↑" if report.orders_change >= 0 else "↓"
    
    views_change_color = "#16a34a" if report.views_change >= 0 else "#dc2626"
    views_change_icon = "↑" if report.views_change >= 0 else "↓"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📊 Weekly Analytics Report</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">
                    {report.period_start} - {report.period_end}
                </p>
            </div>
            
            <!-- Greeting -->
            <div style="padding: 30px 30px 20px;">
                <h2 style="color: #1f2937; margin: 0 0 10px 0;">Hi {report.vendor_name}! 👋</h2>
                <p style="color: #6b7280; margin: 0;">Here's your weekly performance summary on Afrovending.</p>
            </div>
            
            <!-- Key Metrics -->
            <div style="padding: 0 30px 30px;">
                <h3 style="color: #1f2937; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">💰 Sales Overview</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 15px;">
                    <div style="flex: 1; min-width: 150px; background: #f9fafb; padding: 20px; border-radius: 10px; text-align: center;">
                        <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 14px;">Total Revenue</p>
                        <p style="color: #1f2937; margin: 0; font-size: 28px; font-weight: bold;">${report.total_revenue:.2f}</p>
                        <p style="color: {rev_change_color}; margin: 5px 0 0 0; font-size: 14px;">
                            {rev_change_icon} {abs(report.revenue_change):.1f}% vs last week
                        </p>
                    </div>
                    <div style="flex: 1; min-width: 150px; background: #f9fafb; padding: 20px; border-radius: 10px; text-align: center;">
                        <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 14px;">Total Orders</p>
                        <p style="color: #1f2937; margin: 0; font-size: 28px; font-weight: bold;">{report.total_orders}</p>
                        <p style="color: {orders_change_color}; margin: 5px 0 0 0; font-size: 14px;">
                            {orders_change_icon} {abs(report.orders_change):.1f}% vs last week
                        </p>
                    </div>
                    <div style="flex: 1; min-width: 150px; background: #f9fafb; padding: 20px; border-radius: 10px; text-align: center;">
                        <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 14px;">Avg. Order Value</p>
                        <p style="color: #1f2937; margin: 0; font-size: 28px; font-weight: bold;">${report.average_order_value:.2f}</p>
                    </div>
                </div>
            </div>
            
            <!-- Traffic Stats -->
            <div style="padding: 0 30px 30px;">
                <h3 style="color: #1f2937; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">👁️ Traffic & Engagement</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 15px;">
                    <div style="flex: 1; min-width: 120px; background: #eff6ff; padding: 15px; border-radius: 10px; text-align: center;">
                        <p style="color: #3b82f6; margin: 0 0 5px 0; font-size: 13px;">Total Views</p>
                        <p style="color: #1f2937; margin: 0; font-size: 22px; font-weight: bold;">{report.total_views}</p>
                        <p style="color: {views_change_color}; margin: 5px 0 0 0; font-size: 12px;">
                            {views_change_icon} {abs(report.views_change):.1f}%
                        </p>
                    </div>
                    <div style="flex: 1; min-width: 120px; background: #f0fdf4; padding: 15px; border-radius: 10px; text-align: center;">
                        <p style="color: #16a34a; margin: 0 0 5px 0; font-size: 13px;">Unique Visitors</p>
                        <p style="color: #1f2937; margin: 0; font-size: 22px; font-weight: bold;">{report.unique_visitors}</p>
                    </div>
                </div>
            </div>
            
            <!-- Conversion Funnel -->
            <div style="padding: 0 30px 30px;">
                <h3 style="color: #1f2937; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">📈 Conversion Rates</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px; background: #fef2f2; border-radius: 8px 0 0 8px;">
                            <p style="margin: 0; font-size: 13px; color: #6b7280;">View → Cart</p>
                            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #dc2626;">{report.view_to_cart_rate}%</p>
                        </td>
                        <td style="padding: 10px; background: #fef9c3;">
                            <p style="margin: 0; font-size: 13px; color: #6b7280;">Cart → Purchase</p>
                            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #ca8a04;">{report.cart_to_purchase_rate}%</p>
                        </td>
                        <td style="padding: 10px; background: #dcfce7; border-radius: 0 8px 8px 0;">
                            <p style="margin: 0; font-size: 13px; color: #6b7280;">Overall</p>
                            <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #16a34a;">{report.overall_conversion_rate}%</p>
                        </td>
                    </tr>
                </table>
            </div>
            
            <!-- Top Products -->
            <div style="padding: 0 30px 30px;">
                <h3 style="color: #1f2937; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">🏆 Top Products</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <thead>
                        <tr style="background: #f9fafb;">
                            <th style="padding: 12px; text-align: left;">#</th>
                            <th style="padding: 12px; text-align: left;">Product</th>
                            <th style="padding: 12px; text-align: right;">Views</th>
                            <th style="padding: 12px; text-align: right;">Sales</th>
                            <th style="padding: 12px; text-align: right;">Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        {top_products_html if top_products_html else '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #6b7280;">No product data this week</td></tr>'}
                    </tbody>
                </table>
            </div>
            
            <!-- Customer Insights -->
            <div style="padding: 0 30px 30px;">
                <h3 style="color: #1f2937; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">👥 Customer Insights</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 15px;">
                    <div style="flex: 1; min-width: 130px; background: #f0fdf4; padding: 15px; border-radius: 10px; text-align: center;">
                        <p style="color: #16a34a; margin: 0; font-size: 13px;">New Customers</p>
                        <p style="color: #1f2937; margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">{report.new_customers}</p>
                    </div>
                    <div style="flex: 1; min-width: 130px; background: #eff6ff; padding: 15px; border-radius: 10px; text-align: center;">
                        <p style="color: #3b82f6; margin: 0; font-size: 13px;">Returning</p>
                        <p style="color: #1f2937; margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">{report.returning_customers}</p>
                    </div>
                </div>
                {f'<div style="margin-top: 15px;"><p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">Top Locations:</p><ul style="margin: 0; padding-left: 20px; color: #1f2937;">{locations_html}</ul></div>' if locations_html else ''}
            </div>
            
            <!-- CTA -->
            <div style="padding: 0 30px 30px; text-align: center;">
                <a href="https://afrovending.com/vendor/dashboard" style="display: inline-block; background: #dc2626; color: #ffffff; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                    View Full Dashboard →
                </a>
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 13px;">
                    You're receiving this because you're a Growth+ subscriber on Afrovending.
                </p>
                <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                    <a href="https://afrovending.com/vendor/dashboard" style="color: #6b7280;">Manage email preferences</a> | 
                    <a href="https://afrovending.com" style="color: #6b7280;">Afrovending.com</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html

async def get_vendor_weekly_analytics(vendor_id: str) -> Optional[WeeklyReportData]:
    """Generate weekly analytics data for a vendor"""
    vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not vendor:
        return None
    
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)
    prev_week_start = now - timedelta(days=14)
    
    week_start_iso = week_start.isoformat()
    prev_week_start_iso = prev_week_start.isoformat()
    
    # Current week orders
    current_orders = await db.orders.find({
        "created_at": {"$gte": week_start_iso},
        "items.vendor_id": vendor_id,
        "payment_status": "paid"
    }, {"_id": 0}).to_list(1000)
    
    # Previous week orders
    prev_orders = await db.orders.find({
        "created_at": {"$gte": prev_week_start_iso, "$lt": week_start_iso},
        "items.vendor_id": vendor_id,
        "payment_status": "paid"
    }, {"_id": 0}).to_list(1000)
    
    # Calculate current week revenue
    current_revenue = 0.0
    current_order_count = 0
    for order in current_orders:
        vendor_items = [item for item in order.get("items", []) if item.get("vendor_id") == vendor_id]
        if vendor_items:
            current_revenue += sum(item.get("price", 0) * item.get("quantity", 1) for item in vendor_items)
            current_order_count += 1
    
    # Calculate previous week revenue
    prev_revenue = 0.0
    prev_order_count = 0
    for order in prev_orders:
        vendor_items = [item for item in order.get("items", []) if item.get("vendor_id") == vendor_id]
        if vendor_items:
            prev_revenue += sum(item.get("price", 0) * item.get("quantity", 1) for item in vendor_items)
            prev_order_count += 1
    
    # Calculate changes
    revenue_change = ((current_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
    orders_change = ((current_order_count - prev_order_count) / prev_order_count * 100) if prev_order_count > 0 else 0
    
    avg_order_value = current_revenue / current_order_count if current_order_count > 0 else 0
    
    # Traffic data
    current_views = await db.analytics_events.count_documents({
        "vendor_id": vendor_id,
        "event_type": "view",
        "timestamp": {"$gte": week_start_iso}
    })
    
    prev_views = await db.analytics_events.count_documents({
        "vendor_id": vendor_id,
        "event_type": "view",
        "timestamp": {"$gte": prev_week_start_iso, "$lt": week_start_iso}
    })
    
    views_change = ((current_views - prev_views) / prev_views * 100) if prev_views > 0 else 0
    
    unique_sessions = await db.analytics_events.distinct(
        "session_id",
        {"vendor_id": vendor_id, "event_type": "view", "timestamp": {"$gte": week_start_iso}}
    )
    
    # Conversion data
    cart_adds = await db.analytics_events.count_documents({
        "vendor_id": vendor_id,
        "event_type": "cart_add",
        "timestamp": {"$gte": week_start_iso}
    })
    
    total_purchases = sum(
        sum(item.get("quantity", 1) for item in order.get("items", []) if item.get("vendor_id") == vendor_id)
        for order in current_orders
    )
    
    view_to_cart = (cart_adds / current_views * 100) if current_views > 0 else 0
    cart_to_purchase = (total_purchases / cart_adds * 100) if cart_adds > 0 else 0
    overall_conversion = (total_purchases / current_views * 100) if current_views > 0 else 0
    
    # Top products
    products = await db.products.find({"vendor_id": vendor_id}, {"_id": 0}).to_list(100)
    product_analytics = []
    
    for product in products:
        views = await db.analytics_events.count_documents({
            "product_id": product["id"],
            "event_type": "view",
            "timestamp": {"$gte": week_start_iso}
        })
        
        purchases = 0
        product_revenue = 0.0
        for order in current_orders:
            for item in order.get("items", []):
                if item.get("product_id") == product["id"]:
                    purchases += item.get("quantity", 1)
                    product_revenue += item.get("price", 0) * item.get("quantity", 1)
        
        if views > 0 or purchases > 0:
            product_analytics.append({
                "product_id": product["id"],
                "product_name": product["name"],
                "views": views,
                "purchases": purchases,
                "revenue": round(product_revenue, 2)
            })
    
    top_products = sorted(product_analytics, key=lambda x: x["revenue"], reverse=True)[:5]
    
    # Customer data
    customer_ids = set()
    for order in current_orders:
        customer_id = order.get("user_id")
        if customer_id:
            customer_ids.add(customer_id)
    
    # Check which are new (first order this week)
    new_customers = 0
    for customer_id in customer_ids:
        first_order = await db.orders.find_one({
            "user_id": customer_id,
            "items.vendor_id": vendor_id,
            "payment_status": "paid"
        }, {"_id": 0}, sort=[("created_at", 1)])
        
        if first_order and first_order.get("created_at", "") >= week_start_iso:
            new_customers += 1
    
    returning_customers = len(customer_ids) - new_customers
    
    # Top locations
    from collections import defaultdict
    location_counts = defaultdict(int)
    for customer_id in customer_ids:
        user_doc = await db.users.find_one({"id": customer_id}, {"_id": 0, "country": 1, "city": 1})
        if user_doc:
            location = user_doc.get("country") or user_doc.get("city") or "Unknown"
            location_counts[location] += 1
    
    top_locations = [{"location": k, "count": v} for k, v in sorted(location_counts.items(), key=lambda x: x[1], reverse=True)[:5]]
    
    return WeeklyReportData(
        vendor_name=vendor.get("store_name", "Vendor"),
        period_start=week_start.strftime("%b %d"),
        period_end=now.strftime("%b %d, %Y"),
        total_revenue=round(current_revenue, 2),
        total_orders=current_order_count,
        average_order_value=round(avg_order_value, 2),
        revenue_change=round(revenue_change, 1),
        orders_change=round(orders_change, 1),
        total_views=current_views,
        unique_visitors=len(unique_sessions),
        views_change=round(views_change, 1),
        view_to_cart_rate=round(view_to_cart, 2),
        cart_to_purchase_rate=round(cart_to_purchase, 2),
        overall_conversion_rate=round(overall_conversion, 2),
        top_products=top_products,
        new_customers=new_customers,
        returning_customers=max(0, returning_customers),
        top_locations=top_locations
    )

@api_router.post("/analytics/send-weekly-report/{vendor_id}")
async def send_weekly_report_to_vendor(
    vendor_id: str,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    """Send weekly analytics report to a specific vendor (admin only or self)"""
    vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Check authorization
    if user["role"] != "admin" and vendor.get("user_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if vendor has Growth+ subscription
    has_access = await check_analytics_access(vendor_id)
    if not has_access:
        raise HTTPException(status_code=403, detail="Weekly reports are only available for Growth+ subscribers")
    
    # Check if opted out
    preferences = vendor.get("email_preferences", {})
    if not preferences.get("weekly_analytics_report", True):
        raise HTTPException(status_code=400, detail="Vendor has opted out of weekly reports")
    
    # Get vendor's email
    vendor_user = await db.users.find_one({"id": vendor["user_id"]}, {"_id": 0, "email": 1, "first_name": 1})
    if not vendor_user:
        raise HTTPException(status_code=404, detail="Vendor user not found")
    
    # Generate report data
    report_data = await get_vendor_weekly_analytics(vendor_id)
    if not report_data:
        raise HTTPException(status_code=500, detail="Failed to generate report")
    
    # Generate HTML
    html_content = await generate_weekly_report_html(report_data)
    
    # Send email
    if SENDGRID_API_KEY:
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail, Email, To, Content
            
            message = Mail(
                from_email=Email(SENDER_EMAIL, "Afrovending"),
                to_emails=To(vendor_user["email"]),
                subject=f"📊 Your Weekly Analytics Report - {report_data.period_start} to {report_data.period_end}",
                html_content=Content("text/html", html_content)
            )
            
            sg = SendGridAPIClient(SENDGRID_API_KEY)
            response = sg.send(message)
            
            # Log the send
            await db.email_logs.insert_one({
                "id": str(uuid.uuid4()),
                "type": "weekly_analytics_report",
                "vendor_id": vendor_id,
                "recipient": vendor_user["email"],
                "status": "sent",
                "sent_at": datetime.now(timezone.utc).isoformat()
            })
            
            return {"message": "Weekly report sent successfully", "recipient": vendor_user["email"]}
            
        except Exception as e:
            logger.error(f"Failed to send weekly report: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")
    else:
        raise HTTPException(status_code=500, detail="Email service not configured")

@api_router.post("/analytics/send-all-weekly-reports")
async def send_all_weekly_reports(
    background_tasks: BackgroundTasks,
    api_key: str = Query(..., description="Admin API key for scheduled tasks")
):
    """Send weekly reports to all eligible vendors (called by scheduler/cron)"""
    # Simple API key check for scheduled tasks
    expected_key = os.environ.get("SCHEDULER_API_KEY", "afrovending-scheduler-key")
    if api_key != expected_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # Find all vendors with Growth+ subscription who haven't opted out
    vendors_sent = []
    vendors_skipped = []
    vendors_failed = []
    
    # Get all active subscriptions for Growth+
    subscriptions = await db.vendor_subscriptions.find({
        "status": {"$in": ["active", "trialing"]},
        "plan_id": {"$in": ["growth", "pro", "enterprise"]}
    }, {"_id": 0}).to_list(1000)
    
    for sub in subscriptions:
        vendor_id = sub["vendor_id"]
        vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
        
        if not vendor:
            continue
        
        # Check opt-out
        preferences = vendor.get("email_preferences", {})
        if not preferences.get("weekly_analytics_report", True):
            vendors_skipped.append(vendor_id)
            continue
        
        # Get vendor email
        vendor_user = await db.users.find_one({"id": vendor["user_id"]}, {"_id": 0, "email": 1})
        if not vendor_user:
            continue
        
        try:
            # Generate and send report
            report_data = await get_vendor_weekly_analytics(vendor_id)
            if not report_data:
                vendors_failed.append(vendor_id)
                continue
            
            html_content = await generate_weekly_report_html(report_data)
            
            if SENDGRID_API_KEY:
                from sendgrid import SendGridAPIClient
                from sendgrid.helpers.mail import Mail, Email, To, Content
                
                message = Mail(
                    from_email=Email(SENDER_EMAIL, "Afrovending"),
                    to_emails=To(vendor_user["email"]),
                    subject=f"📊 Your Weekly Analytics Report - {report_data.period_start} to {report_data.period_end}",
                    html_content=Content("text/html", html_content)
                )
                
                sg = SendGridAPIClient(SENDGRID_API_KEY)
                sg.send(message)
                
                # Log
                await db.email_logs.insert_one({
                    "id": str(uuid.uuid4()),
                    "type": "weekly_analytics_report",
                    "vendor_id": vendor_id,
                    "recipient": vendor_user["email"],
                    "status": "sent",
                    "sent_at": datetime.now(timezone.utc).isoformat()
                })
                
                vendors_sent.append(vendor_id)
        
        except Exception as e:
            logger.error(f"Failed to send report to {vendor_id}: {e}")
            vendors_failed.append(vendor_id)
    
    return {
        "message": "Weekly reports batch completed",
        "sent": len(vendors_sent),
        "skipped": len(vendors_skipped),
        "failed": len(vendors_failed),
        "details": {
            "sent_to": vendors_sent,
            "skipped_opted_out": vendors_skipped,
            "failed": vendors_failed
        }
    }

@api_router.get("/analytics/preview-weekly-report")
async def preview_weekly_report(user: dict = Depends(get_current_user)):
    """Preview weekly report HTML (for testing)"""
    if user["role"] not in ["vendor", "admin"]:
        raise HTTPException(status_code=403, detail="Only vendors can preview reports")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    has_access = await check_analytics_access(vendor["id"])
    if not has_access and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Weekly reports are only available for Growth+ subscribers")
    
    report_data = await get_vendor_weekly_analytics(vendor["id"])
    if not report_data:
        raise HTTPException(status_code=500, detail="Failed to generate report")
    
    html_content = await generate_weekly_report_html(report_data)
    
    return HTMLResponse(content=html_content)

# ==================== HEALTH CHECK ====================

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.products.create_index("id", unique=True)
    await db.products.create_index("vendor_id")
    await db.products.create_index("category_id")
    await db.vendors.create_index("id", unique=True)
    await db.vendors.create_index("user_id", unique=True)
    await db.categories.create_index("id", unique=True)
    await db.orders.create_index("id", unique=True)
    await db.orders.create_index("user_id")
    await db.cart_items.create_index("user_id")
    await db.wishlists.create_index([("user_id", 1), ("product_id", 1)], unique=True)
    await db.reviews.create_index([("product_id", 1), ("user_id", 1)], unique=True)
    await db.payment_transactions.create_index("session_id", unique=True, sparse=True)
    await db.vendor_payouts.create_index("id", unique=True)
    await db.vendor_payouts.create_index("vendor_id")
    
    # Coupon indexes
    await db.coupons.create_index("id", unique=True)
    await db.coupons.create_index("code", unique=True)
    await db.cart_coupons.create_index("user_id", unique=True)
    await db.coupon_usage.create_index([("coupon_id", 1), ("user_id", 1)])
    
    # Service indexes
    await db.services.create_index("id", unique=True)
    await db.services.create_index("vendor_id")
    await db.services.create_index("category_id")
    await db.service_availability.create_index("service_id")
    await db.bookings.create_index("id", unique=True)
    await db.bookings.create_index("customer_id")
    await db.bookings.create_index("vendor_id")
    await db.bookings.create_index([("service_id", 1), ("booking_date", 1), ("booking_time", 1)])
    await db.service_reviews.create_index([("service_id", 1), ("user_id", 1)], unique=True)
    
    # Subscription indexes
    await db.vendor_subscriptions.create_index("id", unique=True)
    await db.vendor_subscriptions.create_index("vendor_id")
    await db.vendor_subscriptions.create_index("stripe_subscription_id")
    
    # Analytics indexes
    await db.analytics_events.create_index("id", unique=True)
    await db.analytics_events.create_index("vendor_id")
    await db.analytics_events.create_index("product_id")
    await db.analytics_events.create_index([("vendor_id", 1), ("event_type", 1), ("timestamp", -1)])
    await db.analytics_events.create_index([("product_id", 1), ("event_type", 1), ("timestamp", -1)])
    
    # Seed categories if empty
    cat_count = await db.categories.count_documents({})
    if cat_count == 0:
        default_categories = [
            {"id": str(uuid.uuid4()), "name": "Fashion", "description": "African fashion and clothing", "image_url": "https://images.unsplash.com/photo-1633000098942-17449327bfc3?w=400"},
            {"id": str(uuid.uuid4()), "name": "Art & Crafts", "description": "Handmade African art and crafts", "image_url": "https://images.unsplash.com/photo-1567696154083-9547fd0c8e1d?w=400"},
            {"id": str(uuid.uuid4()), "name": "Food & Groceries", "description": "African food products and spices", "image_url": "https://images.unsplash.com/photo-1734255026082-82fdc81991f0?w=400"},
            {"id": str(uuid.uuid4()), "name": "Jewelry", "description": "African jewelry and accessories", "image_url": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400"},
            {"id": str(uuid.uuid4()), "name": "Home Decor", "description": "African home decoration items", "image_url": "https://images.unsplash.com/photo-1760727467662-5f0943d196a8?w=400"},
            {"id": str(uuid.uuid4()), "name": "Beauty", "description": "African beauty and skincare products", "image_url": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400"}
        ]
        await db.categories.insert_many(default_categories)
        logger.info("Default categories seeded")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
