"""
Routes package - aggregates all API routers
"""
from .auth import router as auth_router
from .categories import router as categories_router
from .products import router as products_router
from .vendors import router as vendors_router
from .services import router as services_router
from .bookings import router as bookings_router
from .cart import router as cart_router
from .coupons import router as coupons_router
from .orders import router as orders_router
from .admin import router as admin_router
from .upload import router as upload_router
from .tracking import router as tracking_router
from .payouts import router as payouts_router
from .subscriptions import router as subscriptions_router
from .analytics import router as analytics_router
from .email_reports import router as email_reports_router

__all__ = [
    'auth_router',
    'categories_router', 
    'products_router',
    'vendors_router',
    'services_router',
    'bookings_router',
    'cart_router',
    'coupons_router',
    'orders_router',
    'admin_router',
    'upload_router',
    'tracking_router',
    'payouts_router',
    'subscriptions_router',
    'analytics_router',
    'email_reports_router',
]
