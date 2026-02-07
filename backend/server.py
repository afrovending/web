from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Query
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
