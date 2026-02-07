# Afrovending.com - Product Requirements Document

## Original Problem Statement
Create a full e-commerce platform for Afrovending.com - an online marketplace for African Vendors to sell their products to global customers.

## User Choices
- Payment Integration: Stripe + PayPal
- User Features: Full functionality (accounts, order history, wishlist, reviews)
- Admin Dashboard: Yes
- Design Theme: Warm African-inspired colors (earth tones, vibrant accents)

## User Personas
1. **Global Customer** - Interested in authentic African products, browses by category, adds to cart/wishlist, completes checkout
2. **African Vendor** - Sells handcrafted products, manages inventory, tracks orders and sales
3. **Platform Admin** - Manages vendors, approves new sellers, monitors orders and revenue

## Core Requirements (Static)
- Multi-vendor marketplace functionality
- User authentication (JWT-based)
- Product catalog with categories
- Shopping cart and wishlist
- Stripe payment integration
- Vendor dashboard for product management
- Admin dashboard for platform management
- Product reviews and ratings
- Search and filter functionality

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Payment**: Stripe Checkout API (via emergentintegrations)
- **Deployment**: Kubernetes container with Nginx proxy

## What's Been Implemented (Feb 7, 2026)

### Backend
- User authentication (register, login, JWT tokens)
- Product CRUD operations
- Vendor management with approval flow
- Shopping cart functionality
- Wishlist functionality
- Order management
- Product reviews system
- Category management (6 pre-seeded categories)
- Stripe checkout integration
- Admin endpoints (stats, user/vendor/order management)

### Frontend
- Homepage with hero, categories, featured products, vendor spotlight
- Products listing with filters and search
- Product detail page with reviews
- User registration and login
- Shopping cart
- Wishlist
- User dashboard (orders, profile)
- Vendor dashboard (products, orders)
- Admin dashboard (stats, vendors, users, orders)
- Vendors listing and individual vendor pages
- Checkout success page with payment status polling

### Design
- African-inspired warm color palette (Terracotta, Savanna Green, Bone White)
- Playfair Display + Manrope typography
- Rounded buttons and cards
- Responsive layout

## Test Accounts Created
- Admin: admin@afrovending.com / admin123
- Vendor: vendor1@afrovending.com / vendor123
- Customer: testuser123@example.com / password123

## Prioritized Backlog

### P0 (Critical - Next)
- PayPal payment integration (backend ready, frontend flow needed)
- Order tracking page
- Email notifications for orders

### P1 (High Priority)
- Product image upload to cloud storage
- Vendor payout system
- Advanced search with filters
- Product variants (size, color)

### P2 (Nice to Have)
- Social login (Google, Facebook)
- Multiple shipping addresses
- Coupon/discount system
- Analytics dashboard for vendors

## Next Tasks
1. Implement PayPal checkout flow
2. Add product image upload functionality
3. Create order tracking/details page
4. Add email notifications
5. Implement vendor payout tracking
