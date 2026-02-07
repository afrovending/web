from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Query, UploadFile, File, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
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

# SendGrid Configuration
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@afrovending.com')

# Upload Configuration
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI(title="Afrovending API", description="E-commerce marketplace for African vendors")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

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

class ProductResponse(ProductBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    vendor_id: str
    vendor_name: Optional[str] = None
    average_rating: float = 0.0
    review_count: int = 0
    created_at: str

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

class CartItemBase(BaseModel):
    product_id: str
    quantity: int = 1

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

class CartResponse(BaseModel):
    items: List[CartItemResponse]
    subtotal: float
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

class PaymentStatusRequest(BaseModel):
    session_id: str

# ==================== SERVICE MODELS ====================

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

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "role": user_data.role,
        "password_hash": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "vendor_id": None
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_access_token({"sub": user_id})
    user_response = UserResponse(
        id=user_id,
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=user_data.role,
        created_at=user_doc["created_at"],
        vendor_id=None
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": user["id"]})
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        first_name=user["first_name"],
        last_name=user["last_name"],
        role=user["role"],
        created_at=user["created_at"],
        vendor_id=user.get("vendor_id")
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(**user)

# ==================== CATEGORY ROUTES ====================

@api_router.get("/categories", response_model=List[CategoryResponse])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

@api_router.post("/categories", response_model=CategoryResponse)
async def create_category(category: CategoryCreate, user: dict = Depends(require_admin)):
    cat_id = str(uuid.uuid4())
    cat_doc = {
        "id": cat_id,
        **category.model_dump()
    }
    await db.categories.insert_one(cat_doc)
    return CategoryResponse(id=cat_id, **category.model_dump())

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, user: dict = Depends(require_admin)):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}

# ==================== PRODUCT ROUTES ====================

class SearchFilters(BaseModel):
    search: Optional[str] = None
    category_id: Optional[str] = None
    category_ids: Optional[List[str]] = None
    vendor_id: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_rating: Optional[float] = None
    tags: Optional[List[str]] = None
    in_stock: Optional[bool] = None
    sort_by: str = "created_at"
    sort_order: str = "desc"
    skip: int = 0
    limit: int = 20

class SearchResult(BaseModel):
    products: List[ProductResponse] = []
    services: List[ServiceResponse] = []
    total_products: int = 0
    total_services: int = 0
    filters_applied: Dict[str, Any] = {}

@api_router.get("/search")
async def unified_search(
    q: Optional[str] = None,
    type: Optional[str] = None,  # "products", "services", or None for both
    category_id: Optional[str] = None,
    category_ids: Optional[str] = None,  # comma-separated
    vendor_id: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    tags: Optional[str] = None,  # comma-separated
    location_type: Optional[str] = None,
    in_stock: Optional[bool] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    skip: int = 0,
    limit: int = 20
):
    """Unified search endpoint for products and services"""
    
    # Parse comma-separated values
    category_list = category_ids.split(",") if category_ids else []
    if category_id:
        category_list.append(category_id)
    tag_list = [t.strip() for t in tags.split(",")] if tags else []
    
    filters_applied = {}
    if q:
        filters_applied["search"] = q
    if category_list:
        filters_applied["categories"] = category_list
    if min_price is not None:
        filters_applied["min_price"] = min_price
    if max_price is not None:
        filters_applied["max_price"] = max_price
    if min_rating is not None:
        filters_applied["min_rating"] = min_rating
    
    results = {"products": [], "services": [], "total_products": 0, "total_services": 0, "filters_applied": filters_applied}
    
    sort_dir = -1 if sort_order == "desc" else 1
    
    # Search products
    if type != "services":
        product_query = {"is_active": True}
        
        if q:
            product_query["$or"] = [
                {"name": {"$regex": q, "$options": "i"}},
                {"description": {"$regex": q, "$options": "i"}},
                {"tags": {"$elemMatch": {"$regex": q, "$options": "i"}}}
            ]
        if category_list:
            product_query["category_id"] = {"$in": category_list}
        if vendor_id:
            product_query["vendor_id"] = vendor_id
        if min_price is not None:
            product_query["price"] = {"$gte": min_price}
        if max_price is not None:
            product_query.setdefault("price", {})["$lte"] = max_price
        if tag_list:
            product_query["tags"] = {"$in": tag_list}
        if in_stock:
            product_query["stock"] = {"$gt": 0}
        if min_rating is not None:
            product_query["average_rating"] = {"$gte": min_rating}
        
        results["total_products"] = await db.products.count_documents(product_query)
        products = await db.products.find(product_query, {"_id": 0}).sort(sort_by, sort_dir).skip(skip).limit(limit).to_list(limit)
        
        # Enrich with vendor names
        for product in products:
            vendor = await db.vendors.find_one({"id": product.get("vendor_id")}, {"_id": 0, "store_name": 1})
            product["vendor_name"] = vendor.get("store_name") if vendor else "Unknown"
        
        results["products"] = products
    
    # Search services
    if type != "products":
        service_query = {"is_active": True}
        
        if q:
            service_query["$or"] = [
                {"name": {"$regex": q, "$options": "i"}},
                {"description": {"$regex": q, "$options": "i"}},
                {"tags": {"$elemMatch": {"$regex": q, "$options": "i"}}}
            ]
        if category_list:
            service_query["category_id"] = {"$in": category_list}
        if vendor_id:
            service_query["vendor_id"] = vendor_id
        if min_price is not None:
            service_query["price"] = {"$gte": min_price}
        if max_price is not None:
            service_query.setdefault("price", {})["$lte"] = max_price
        if tag_list:
            service_query["tags"] = {"$in": tag_list}
        if location_type:
            service_query["location_type"] = location_type
        if min_rating is not None:
            service_query["average_rating"] = {"$gte": min_rating}
        
        results["total_services"] = await db.services.count_documents(service_query)
        services = await db.services.find(service_query, {"_id": 0}).sort(sort_by, sort_dir).skip(skip).limit(limit).to_list(limit)
        
        # Enrich with vendor names
        for service in services:
            vendor = await db.vendors.find_one({"id": service.get("vendor_id")}, {"_id": 0, "store_name": 1})
            service["vendor_name"] = vendor.get("store_name") if vendor else "Unknown"
        
        results["services"] = services
    
    return results

@api_router.get("/search/suggestions")
async def search_suggestions(q: str, limit: int = 10):
    """Get search suggestions based on query"""
    if len(q) < 2:
        return {"suggestions": []}
    
    suggestions = set()
    
    # Search product names
    products = await db.products.find(
        {"name": {"$regex": q, "$options": "i"}, "is_active": True},
        {"_id": 0, "name": 1}
    ).limit(limit).to_list(limit)
    
    for p in products:
        suggestions.add(p["name"])
    
    # Search service names
    services = await db.services.find(
        {"name": {"$regex": q, "$options": "i"}, "is_active": True},
        {"_id": 0, "name": 1}
    ).limit(limit).to_list(limit)
    
    for s in services:
        suggestions.add(s["name"])
    
    # Search categories
    categories = await db.categories.find(
        {"name": {"$regex": q, "$options": "i"}},
        {"_id": 0, "name": 1}
    ).limit(5).to_list(5)
    
    for c in categories:
        suggestions.add(c["name"])
    
    return {"suggestions": list(suggestions)[:limit]}

@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(
    category_id: Optional[str] = None,
    vendor_id: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    skip: int = 0,
    limit: int = 20
):
    query = {"is_active": True}
    
    if category_id:
        query["category_id"] = category_id
    if vendor_id:
        query["vendor_id"] = vendor_id
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price
    
    sort_dir = -1 if sort_order == "desc" else 1
    
    products = await db.products.find(query, {"_id": 0}).sort(sort_by, sort_dir).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with vendor names
    for product in products:
        vendor = await db.vendors.find_one({"id": product.get("vendor_id")}, {"_id": 0, "store_name": 1})
        product["vendor_name"] = vendor.get("store_name") if vendor else "Unknown Vendor"
    
    return products

@api_router.get("/products/featured", response_model=List[ProductResponse])
async def get_featured_products(limit: int = 8):
    products = await db.products.find({"is_active": True}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    for product in products:
        vendor = await db.vendors.find_one({"id": product.get("vendor_id")}, {"_id": 0, "store_name": 1})
        product["vendor_name"] = vendor.get("store_name") if vendor else "Unknown Vendor"
    
    return products

@api_router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    vendor = await db.vendors.find_one({"id": product.get("vendor_id")}, {"_id": 0, "store_name": 1})
    product["vendor_name"] = vendor.get("store_name") if vendor else "Unknown Vendor"
    
    return product

@api_router.post("/products", response_model=ProductResponse)
async def create_product(product: ProductCreate, user: dict = Depends(require_vendor)):
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor and user["role"] != "admin":
        raise HTTPException(status_code=400, detail="You must be a vendor to create products")
    
    product_id = str(uuid.uuid4())
    vendor_id = vendor["id"] if vendor else user["id"]
    
    product_doc = {
        "id": product_id,
        "vendor_id": vendor_id,
        **product.model_dump(),
        "average_rating": 0.0,
        "review_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.products.insert_one(product_doc)
    
    # Update vendor product count
    await db.vendors.update_one({"id": vendor_id}, {"$inc": {"product_count": 1}})
    
    product_doc["vendor_name"] = vendor.get("store_name") if vendor else "Admin"
    return product_doc

@api_router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, product_update: ProductUpdate, user: dict = Depends(require_vendor)):
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if user["role"] != "admin" and (not vendor or vendor["id"] != existing["vendor_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to update this product")
    
    update_data = {k: v for k, v in product_update.model_dump().items() if v is not None}
    if update_data:
        await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    vendor_doc = await db.vendors.find_one({"id": updated.get("vendor_id")}, {"_id": 0, "store_name": 1})
    updated["vendor_name"] = vendor_doc.get("store_name") if vendor_doc else "Unknown"
    
    return updated

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(require_vendor)):
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if user["role"] != "admin" and (not vendor or vendor["id"] != existing["vendor_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to delete this product")
    
    await db.products.delete_one({"id": product_id})
    await db.vendors.update_one({"id": existing["vendor_id"]}, {"$inc": {"product_count": -1}})
    
    return {"message": "Product deleted"}

# ==================== VENDOR ROUTES ====================

@api_router.get("/vendors", response_model=List[VendorResponse])
async def get_vendors(
    is_approved: Optional[bool] = None,
    skip: int = 0,
    limit: int = 20
):
    query = {}
    if is_approved is not None:
        query["is_approved"] = is_approved
    
    vendors = await db.vendors.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return vendors

@api_router.get("/vendors/featured", response_model=List[VendorResponse])
async def get_featured_vendors(limit: int = 4):
    vendors = await db.vendors.find({"is_approved": True}, {"_id": 0}).sort("total_sales", -1).limit(limit).to_list(limit)
    return vendors

@api_router.get("/vendors/{vendor_id}", response_model=VendorResponse)
async def get_vendor(vendor_id: str):
    vendor = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor

@api_router.post("/vendors", response_model=VendorResponse)
async def create_vendor(vendor: VendorCreate, user: dict = Depends(get_current_user)):
    existing = await db.vendors.find_one({"user_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="You already have a vendor profile")
    
    vendor_id = str(uuid.uuid4())
    vendor_doc = {
        "id": vendor_id,
        "user_id": user["id"],
        **vendor.model_dump(),
        "is_approved": False,
        "total_sales": 0.0,
        "product_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.vendors.insert_one(vendor_doc)
    
    # Update user role to vendor and link vendor_id
    await db.users.update_one({"id": user["id"]}, {"$set": {"role": "vendor", "vendor_id": vendor_id}})
    
    return VendorResponse(**vendor_doc)

@api_router.put("/vendors/{vendor_id}", response_model=VendorResponse)
async def update_vendor(vendor_id: str, vendor_update: VendorCreate, user: dict = Depends(get_current_user)):
    existing = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    if user["role"] != "admin" and existing["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.vendors.update_one({"id": vendor_id}, {"$set": vendor_update.model_dump()})
    
    updated = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    return updated

@api_router.put("/vendors/{vendor_id}/approve")
async def approve_vendor(vendor_id: str, user: dict = Depends(require_admin)):
    result = await db.vendors.update_one({"id": vendor_id}, {"$set": {"is_approved": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return {"message": "Vendor approved"}

# ==================== SERVICE ROUTES ====================

@api_router.get("/services", response_model=List[ServiceResponse])
async def get_services(
    category_id: Optional[str] = None,
    vendor_id: Optional[str] = None,
    search: Optional[str] = None,
    location_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
):
    query = {"is_active": True}
    
    if category_id:
        query["category_id"] = category_id
    if vendor_id:
        query["vendor_id"] = vendor_id
    if location_type:
        query["location_type"] = {"$in": [location_type, "both"]}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    services = await db.services.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for service in services:
        vendor = await db.vendors.find_one({"id": service.get("vendor_id")}, {"_id": 0, "store_name": 1})
        service["vendor_name"] = vendor.get("store_name") if vendor else "Unknown Vendor"
    
    return services

@api_router.get("/services/featured", response_model=List[ServiceResponse])
async def get_featured_services(limit: int = 8):
    services = await db.services.find({"is_active": True}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    for service in services:
        vendor = await db.vendors.find_one({"id": service.get("vendor_id")}, {"_id": 0, "store_name": 1})
        service["vendor_name"] = vendor.get("store_name") if vendor else "Unknown Vendor"
    
    return services

@api_router.get("/services/{service_id}", response_model=ServiceResponse)
async def get_service(service_id: str):
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    vendor = await db.vendors.find_one({"id": service.get("vendor_id")}, {"_id": 0, "store_name": 1})
    service["vendor_name"] = vendor.get("store_name") if vendor else "Unknown Vendor"
    
    return service

@api_router.post("/services", response_model=ServiceResponse)
async def create_service(service: ServiceCreate, user: dict = Depends(require_vendor)):
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
    for day in range(5):  # Monday to Friday
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

@api_router.put("/services/{service_id}", response_model=ServiceResponse)
async def update_service(service_id: str, service_update: ServiceUpdate, user: dict = Depends(require_vendor)):
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

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, user: dict = Depends(require_vendor)):
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

@api_router.get("/services/{service_id}/availability")
async def get_service_availability(service_id: str):
    availability = await db.service_availability.find({"service_id": service_id}, {"_id": 0}).to_list(20)
    return availability

@api_router.put("/services/{service_id}/availability")
async def update_service_availability(
    service_id: str, 
    availability: List[ServiceAvailabilityBase], 
    user: dict = Depends(require_vendor)
):
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if user["role"] != "admin" and (not vendor or vendor["id"] != service["vendor_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Delete existing availability
    await db.service_availability.delete_many({"service_id": service_id})
    
    # Create new availability
    for avail in availability:
        avail_doc = {
            "id": str(uuid.uuid4()),
            "service_id": service_id,
            "vendor_id": service["vendor_id"],
            **avail.model_dump()
        }
        await db.service_availability.insert_one(avail_doc)
    
    return {"message": "Availability updated"}

@api_router.get("/services/{service_id}/timeslots")
async def get_available_timeslots(service_id: str, date: str):
    """Get available time slots for a specific date"""
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Parse date and get day of week
    try:
        booking_date = datetime.strptime(date, "%Y-%m-%d")
        day_of_week = booking_date.weekday()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Get availability for that day
    availability = await db.service_availability.find_one({
        "service_id": service_id,
        "day_of_week": day_of_week,
        "is_available": True
    }, {"_id": 0})
    
    if not availability:
        return []
    
    # Generate time slots based on service duration
    duration = service.get("duration_minutes", 60)
    start_hour, start_min = map(int, availability["start_time"].split(":"))
    end_hour, end_min = map(int, availability["end_time"].split(":"))
    
    slots = []
    current_time = datetime(booking_date.year, booking_date.month, booking_date.day, start_hour, start_min)
    end_time = datetime(booking_date.year, booking_date.month, booking_date.day, end_hour, end_min)
    
    # Get existing bookings for that date
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

# ==================== BOOKING ROUTES ====================

@api_router.post("/bookings", response_model=BookingResponse)
async def create_booking(booking: BookingCreate, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
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

@api_router.get("/bookings", response_model=List[BookingResponse])
async def get_my_bookings(user: dict = Depends(get_current_user)):
    """Get bookings for the current user (as customer)"""
    bookings = await db.bookings.find({"customer_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return bookings

@api_router.get("/bookings/{booking_id}", response_model=BookingResponse)
async def get_booking(booking_id: str, user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    if user["role"] != "admin" and booking["customer_id"] != user["id"] and booking["vendor_id"] != user.get("vendor_id"):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return booking

@api_router.get("/vendor/bookings", response_model=List[BookingResponse])
async def get_vendor_bookings(user: dict = Depends(require_vendor)):
    """Get bookings for the vendor's services"""
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    bookings = await db.bookings.find({"vendor_id": vendor["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return bookings

@api_router.put("/bookings/{booking_id}/status")
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

@api_router.put("/bookings/{booking_id}/confirm-delivery")
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
    
    # Add to vendor's pending payout (in real system, this would trigger actual payout)
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

@api_router.post("/bookings/{booking_id}/checkout")
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

@api_router.get("/bookings/{booking_id}/payment-status")
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

@api_router.get("/services/{service_id}/reviews", response_model=List[ReviewResponse])
async def get_service_reviews(service_id: str):
    reviews = await db.service_reviews.find({"service_id": service_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return reviews

@api_router.post("/services/{service_id}/reviews", response_model=ReviewResponse)
async def create_service_review(service_id: str, review: ReviewCreate, user: dict = Depends(get_current_user)):
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

# ==================== CART ROUTES ====================

@api_router.get("/cart", response_model=CartResponse)
async def get_cart(user: dict = Depends(get_current_user)):
    cart_items = await db.cart_items.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    
    items = []
    subtotal = 0.0
    
    for item in cart_items:
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            vendor = await db.vendors.find_one({"id": product.get("vendor_id")}, {"_id": 0, "store_name": 1})
            item_response = CartItemResponse(
                id=item["id"],
                product_id=product["id"],
                product_name=product["name"],
                product_image=product["images"][0] if product.get("images") else "",
                price=product["price"],
                quantity=item["quantity"],
                vendor_id=product.get("vendor_id", ""),
                vendor_name=vendor.get("store_name") if vendor else "Unknown"
            )
            items.append(item_response)
            subtotal += product["price"] * item["quantity"]
    
    return CartResponse(items=items, subtotal=round(subtotal, 2), total=round(subtotal, 2))

@api_router.post("/cart/items")
async def add_to_cart(item: CartItemBase, user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    existing = await db.cart_items.find_one({"user_id": user["id"], "product_id": item.product_id})
    
    if existing:
        new_qty = existing["quantity"] + item.quantity
        await db.cart_items.update_one({"id": existing["id"]}, {"$set": {"quantity": new_qty}})
    else:
        cart_item = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "product_id": item.product_id,
            "quantity": item.quantity
        }
        await db.cart_items.insert_one(cart_item)
    
    return {"message": "Item added to cart"}

@api_router.put("/cart/items/{item_id}")
async def update_cart_item(item_id: str, quantity: int, user: dict = Depends(get_current_user)):
    if quantity <= 0:
        await db.cart_items.delete_one({"id": item_id, "user_id": user["id"]})
    else:
        await db.cart_items.update_one({"id": item_id, "user_id": user["id"]}, {"$set": {"quantity": quantity}})
    return {"message": "Cart updated"}

@api_router.delete("/cart/items/{item_id}")
async def remove_from_cart(item_id: str, user: dict = Depends(get_current_user)):
    await db.cart_items.delete_one({"id": item_id, "user_id": user["id"]})
    return {"message": "Item removed from cart"}

@api_router.delete("/cart")
async def clear_cart(user: dict = Depends(get_current_user)):
    await db.cart_items.delete_many({"user_id": user["id"]})
    return {"message": "Cart cleared"}

# ==================== WISHLIST ROUTES ====================

@api_router.get("/wishlist", response_model=List[WishlistItemResponse])
async def get_wishlist(user: dict = Depends(get_current_user)):
    wishlist_items = await db.wishlists.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    
    items = []
    for item in wishlist_items:
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            vendor = await db.vendors.find_one({"id": product.get("vendor_id")}, {"_id": 0, "store_name": 1})
            items.append(WishlistItemResponse(
                id=item["id"],
                product_id=product["id"],
                product_name=product["name"],
                product_image=product["images"][0] if product.get("images") else "",
                price=product["price"],
                vendor_name=vendor.get("store_name") if vendor else "Unknown"
            ))
    
    return items

@api_router.post("/wishlist/{product_id}")
async def add_to_wishlist(product_id: str, user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    existing = await db.wishlists.find_one({"user_id": user["id"], "product_id": product_id})
    if existing:
        return {"message": "Already in wishlist"}
    
    wishlist_item = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "product_id": product_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.wishlists.insert_one(wishlist_item)
    return {"message": "Added to wishlist"}

@api_router.delete("/wishlist/{product_id}")
async def remove_from_wishlist(product_id: str, user: dict = Depends(get_current_user)):
    await db.wishlists.delete_one({"user_id": user["id"], "product_id": product_id})
    return {"message": "Removed from wishlist"}

# ==================== REVIEW ROUTES ====================

@api_router.get("/products/{product_id}/reviews", response_model=List[ReviewResponse])
async def get_product_reviews(product_id: str):
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return reviews

@api_router.post("/products/{product_id}/reviews", response_model=ReviewResponse)
async def create_review(product_id: str, review: ReviewCreate, user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    existing = await db.reviews.find_one({"product_id": product_id, "user_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="You already reviewed this product")
    
    review_id = str(uuid.uuid4())
    review_doc = {
        "id": review_id,
        "product_id": product_id,
        "user_id": user["id"],
        "user_name": f"{user['first_name']} {user['last_name']}",
        "rating": review.rating,
        "title": review.title,
        "comment": review.comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reviews.insert_one(review_doc)
    
    # Update product average rating
    all_reviews = await db.reviews.find({"product_id": product_id}, {"rating": 1}).to_list(1000)
    avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
    await db.products.update_one(
        {"id": product_id}, 
        {"$set": {"average_rating": round(avg_rating, 1), "review_count": len(all_reviews)}}
    )
    
    return review_doc

# ==================== ORDER ROUTES ====================

@api_router.get("/orders", response_model=List[OrderResponse])
async def get_orders(user: dict = Depends(get_current_user)):
    query = {"user_id": user["id"]} if user["role"] != "admin" else {}
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if user["role"] != "admin" and order["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return order

@api_router.get("/vendor/orders", response_model=List[OrderResponse])
async def get_vendor_orders(user: dict = Depends(require_vendor)):
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Find orders containing products from this vendor
    orders = await db.orders.find({"items.vendor_id": vendor["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, user: dict = Depends(require_vendor)):
    valid_statuses = ["pending", "processing", "shipped", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}

# ==================== CHECKOUT & PAYMENT ROUTES ====================

@api_router.post("/checkout/stripe")
async def create_stripe_checkout(checkout_req: CheckoutRequest, request: Request, user: dict = Depends(get_current_user)):
    cart = await db.cart_items.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    if not cart:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Calculate total from cart
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
    
    # Create order first
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
    
    # Create Stripe checkout session
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
    
    # Create payment transaction record
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

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, request: Request, user: dict = Depends(get_current_user)):
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update payment transaction
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    
    if transaction and transaction.get("payment_status") != "paid":
        new_status = "paid" if status.payment_status == "paid" else status.payment_status
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": new_status}}
        )
        
        # If paid, update order and clear cart
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

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            # Update transaction and order
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
    """Upload an image file for products or services"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.")
    
    # Validate file size (max 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")
    
    # Generate unique filename
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOAD_DIR / filename
    
    # Save file
    async with aiofiles.open(filepath, 'wb') as f:
        await f.write(contents)
    
    # Return the URL
    image_url = f"/api/uploads/{filename}"
    
    logger.info(f"Image uploaded: {filename} by user {user['id']}")
    return {"url": image_url, "filename": filename}

@api_router.get("/uploads/{filename}")
async def get_uploaded_image(filename: str):
    """Serve uploaded images"""
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
        frontend_url = os.environ.get('FRONTEND_URL', 'https://african-market-3.preview.emergentagent.com')
        return RedirectResponse(url=f"{frontend_url}/vendor/dashboard?stripe=connected")
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe return error: {str(e)}")
        frontend_url = os.environ.get('FRONTEND_URL', 'https://african-market-3.preview.emergentagent.com')
        return RedirectResponse(url=f"{frontend_url}/vendor/dashboard?stripe=error")

@api_router.get("/vendor/stripe/refresh")
async def stripe_connect_refresh(request: Request):
    """Handle refresh from Stripe Connect (user needs to restart onboarding)"""
    frontend_url = os.environ.get('FRONTEND_URL', 'https://african-market-3.preview.emergentagent.com')
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
    await db.payment_transactions.create_index("session_id", unique=True)
    await db.vendor_payouts.create_index("id", unique=True)
    await db.vendor_payouts.create_index("vendor_id")
    
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
