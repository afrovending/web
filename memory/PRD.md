# Afrovending.com - Product Requirements Document

## Original Problem Statement
Create a full e-commerce platform for Afrovending.com - an online marketplace for African Vendors to sell their products AND SERVICES to global customers.

## User Choices
- Payment Integration: Stripe (live key configured) + PayPal (pending)
- User Features: Full functionality (accounts, order history, wishlist, reviews)
- Admin Dashboard: Yes
- Design Theme: Red/black color scheme matching user's logo
- Fonts: Montserrat (headings) + Ubuntu (body)
- Service Marketplace: Vendors can list services, customers can book
- Escrow Payment: Vendors only receive payout after customer confirms service delivery

## User Personas
1. **Global Customer** - Browses products/services, creates bookings, confirms delivery
2. **African Vendor** - Sells products and services, manages bookings, tracks payouts
3. **Platform Admin** - Manages vendors, approves new sellers, monitors platform

## Core Requirements (Static)
- Multi-vendor marketplace for products AND services
- User authentication (JWT-based)
- Product catalog with categories
- Service booking system with calendar
- Shopping cart and wishlist
- Stripe payment integration with escrow for services
- Vendor dashboard for product/service management
- Admin dashboard for platform management
- Product/Service reviews and ratings

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
- Service CRUD operations with availability management
- Booking system with time slots
- Escrow payment flow with confirm-delivery endpoint
- Vendor management with approval flow
- Shopping cart functionality
- Wishlist functionality
- Order management
- Product/Service reviews system
- Category management (including 9 service subcategories)
- Stripe checkout integration for products and services

### Frontend
- Homepage with logo, hero, categories, featured sections
- Desktop navigation with Products, Services, Vendors links
- Products listing with filters and search
- **Services listing page with category filters**
- **Service detail page with booking calendar and time slots**
- **Booking detail page with Pay button and Confirm Delivery**
- **User dashboard with Bookings tab showing customer bookings**
- User registration and login
- Shopping cart and Wishlist
- Vendor dashboard with Products, Services, Orders, Bookings tabs
- Admin dashboard (stats, vendors, users, orders)
- Checkout success pages for products and services

### Design
- Red/black color scheme matching user logo
- Montserrat + Ubuntu typography
- Rounded buttons and cards
- Responsive layout

## Test Accounts
- Admin: admin@example.com / password123
- Vendor (Approved): vendor.approved@example.com / password123
- Customer: testuser123@example.com / password123

## Testing Status (Feb 7, 2026)
- Backend: 100% (19/19 tests passed)
- Frontend: 95% (all major features working)
- Test data: 10+ services, 7+ bookings created

## Prioritized Backlog

### P0 (Critical - Next)
- PayPal payment integration
- Order tracking page
- Email notifications for orders/bookings

### P1 (High Priority)
- Product/Service image upload to cloud storage
- Vendor payout dashboard
- Advanced search with filters
- Product variants (size, color)

### P2 (Nice to Have)
- Social login (Google, Facebook)
- Multiple shipping addresses
- Coupon/discount system
- Analytics dashboard for vendors

## Next Tasks
1. Implement PayPal checkout flow
2. Add image upload functionality
3. Create order/booking tracking page
4. Add email notifications
5. Implement vendor payout tracking dashboard
