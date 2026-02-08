"""
All Pydantic models for Afrovending API
"""
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any

# ==================== USER MODELS ====================

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: str = "customer"

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

# ==================== CATEGORY MODELS ====================

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

# ==================== PRODUCT MODELS ====================

class VariantOption(BaseModel):
    name: str
    values: List[str]

class ProductVariant(BaseModel):
    id: str = ""
    sku: Optional[str] = None
    options: Dict[str, str] = {}
    price: Optional[float] = None
    compare_price: Optional[float] = None
    stock: int = 0
    image: Optional[str] = None

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
    has_variants: bool = False
    variant_options: List[VariantOption] = []
    variants: List[ProductVariant] = []

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
    is_verified_seller: bool = False

# ==================== VENDOR MODELS ====================

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
    is_verified_seller: bool = False
    subscription_plan: Optional[str] = None

# ==================== CART MODELS ====================

class CartItemBase(BaseModel):
    product_id: str
    quantity: int = 1
    variant_id: Optional[str] = None
    selected_options: Optional[Dict[str, str]] = None

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

# ==================== WISHLIST MODELS ====================

class WishlistItemResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    product_id: str
    product_name: str
    product_image: str
    price: float
    vendor_name: str

# ==================== REVIEW MODELS ====================

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

# ==================== ORDER MODELS ====================

class OrderItemBase(BaseModel):
    product_id: str
    quantity: int
    price: float

class OrderCreate(BaseModel):
    shipping_address: Dict[str, str]
    payment_method: str

class OrderResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    items: List[Dict[str, Any]]
    shipping_address: Optional[Dict[str, str]] = None
    subtotal: float
    shipping_cost: float = 0.0
    total: float
    status: str
    payment_method: str
    payment_status: str
    created_at: str

class CheckoutRequest(BaseModel):
    payment_method: str
    origin_url: str
    coupon_code: Optional[str] = None

class PaymentStatusRequest(BaseModel):
    session_id: str

# ==================== COUPON MODELS ====================

class CouponBase(BaseModel):
    code: str
    discount_type: str = "percentage"
    discount_value: float
    min_order_amount: float = 0.0
    max_discount: Optional[float] = None
    max_uses: Optional[int] = None
    max_uses_per_user: int = 1
    start_date: Optional[str] = None
    expiry_date: Optional[str] = None
    is_active: bool = True
    applies_to: str = "all"
    vendor_id: Optional[str] = None

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

class ServiceBase(BaseModel):
    name: str
    description: str
    category_id: str
    price: float
    price_type: str = "fixed"
    duration_minutes: int = 60
    location_type: str = "onsite"
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
    day_of_week: int
    start_time: str
    end_time: str
    is_available: bool = True

class ServiceAvailabilityCreate(ServiceAvailabilityBase):
    service_id: str

class TimeSlotResponse(BaseModel):
    date: str
    time: str
    is_available: bool

# ==================== BOOKING MODELS ====================

class BookingCreate(BaseModel):
    service_id: str
    booking_date: str
    booking_time: str
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
    status: str
    payment_status: str
    delivery_confirmed: bool = False
    notes: Optional[str] = None
    customer_address: Optional[str] = None
    created_at: str

class BookingStatusUpdate(BaseModel):
    status: str

class ServiceCheckoutRequest(BaseModel):
    booking_id: str
    origin_url: str

# ==================== SUBSCRIPTION MODELS ====================

class SubscriptionPlan(BaseModel):
    id: str
    name: str
    price_monthly: float
    price_yearly: float
    commission_rate: float
    product_limit: int
    features: List[str]
    stripe_price_id_monthly: Optional[str] = None
    stripe_price_id_yearly: Optional[str] = None
    is_custom: bool = False

class VendorSubscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    vendor_id: str
    plan_id: str
    plan_name: str
    status: str
    billing_cycle: str
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
    billing_cycle: str = "monthly"
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
    products_remaining: int = -1

# ==================== ANALYTICS MODELS ====================

class ProductViewEvent(BaseModel):
    product_id: str
    vendor_id: str
    user_id: Optional[str] = None
    session_id: str
    source: str = "direct"
    timestamp: str

class AnalyticsDateRange(BaseModel):
    start_date: str
    end_date: str

class SalesAnalytics(BaseModel):
    total_revenue: float
    total_orders: int
    average_order_value: float
    revenue_trend: List[Dict[str, Any]]
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
    revenue_change: float
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

# ==================== TRACKING MODELS ====================

class TrackingItem(BaseModel):
    id: str
    type: str
    status: str
    payment_status: str
    total: float
    created_at: str
    vendor_name: Optional[str] = None
    items_count: int = 0

class TrackingEvent(BaseModel):
    id: str
    status: str
    message: str
    timestamp: str

class TrackingDetailResponse(BaseModel):
    item: Dict[str, Any]
    events: List[TrackingEvent]

# ==================== PAYOUT MODELS ====================

class PayoutSummary(BaseModel):
    available_balance: float
    pending_balance: float
    total_earned: float
    total_withdrawn: float
    commission_rate: float
    stripe_connected: bool
    stripe_account_id: Optional[str] = None

class PayoutTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    vendor_id: str
    amount: float
    fee: float
    net_amount: float
    type: str
    status: str
    reference_id: Optional[str] = None
    reference_type: Optional[str] = None
    created_at: str
    processed_at: Optional[str] = None

class PayoutRequest(BaseModel):
    amount: float

# ==================== SUBSCRIPTION PLANS CONFIG ====================

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
        price_yearly=250,
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
        price_yearly=500,
        commission_rate=10,
        product_limit=-1,
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
        price_monthly=0,
        price_yearly=0,
        commission_rate=0,
        product_limit=-1,
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
