"""
Routes package - aggregates all API routers
"""
from .auth import router as auth_router
from .categories import router as categories_router
from .products import router as products_router
from .vendors import router as vendors_router

__all__ = [
    'auth_router',
    'categories_router', 
    'products_router',
    'vendors_router',
]
