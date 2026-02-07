# Afrovending.com - Product Requirements Document

## Original Problem Statement
Create a full e-commerce platform for Afrovending.com - an online marketplace for African Vendors to sell their products AND SERVICES to global customers.

## User Choices
- Payment Integration: Stripe (live key configured) + Stripe Connect for vendor payouts
- Email Notifications: SendGrid (verified sender: info@afrovending.com)
- User Features: Full functionality (accounts, order history, wishlist, reviews)
- Admin Dashboard: Yes
- Design Theme: Red/black color scheme matching user's logo
- Fonts: Montserrat (headings) + Ubuntu (body)
- Service Marketplace: Vendors can list services, customers can book
- Escrow Payment: Vendors only receive payout after customer confirms service delivery
- Platform Fee: 10% commission on all sales

## User Personas
1. **Global Customer** - Browses products/services, creates bookings, confirms delivery
2. **African Vendor** - Sells products and services, manages bookings, tracks payouts via Stripe Connect
3. **Platform Admin** - Manages vendors, approves new sellers, monitors platform

## Core Requirements (Static)
- Multi-vendor marketplace for products AND services
- User authentication (JWT-based)
- Product catalog with categories
- Service booking system with calendar
- Shopping cart and wishlist
- Stripe payment integration with escrow for services
- Stripe Connect for vendor payouts
- Vendor dashboard for product/service management
- Vendor payout dashboard with earnings tracking
- Admin dashboard for platform management
- Product/Service reviews and ratings

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Payment**: Stripe Checkout API + Stripe Connect
- **Email**: SendGrid API
- **File Storage**: Local uploads (/app/backend/uploads/)
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
- Image upload endpoint (/api/upload/image)
- Tracking endpoints (/api/tracking, /api/tracking/:type/:id)
- SendGrid email notifications for bookings
- **NEW: Vendor Payout Dashboard API**
  - GET /api/vendor/payout/summary
  - GET /api/vendor/payout/transactions
  - POST /api/vendor/stripe/connect
  - GET /api/vendor/stripe/status
  - POST /api/vendor/payout/request
  - GET /api/vendor/stripe/return
  - GET /api/vendor/stripe/refresh

### Frontend
- Homepage with logo, hero, categories, featured sections
- Desktop navigation with Products, Services, Vendors links
- Products listing with filters and search
- Services listing page with category filters
- Service detail page with booking calendar and time slots
- Booking detail page with Pay button and Confirm Delivery
- User dashboard with Bookings tab showing customer bookings
- User registration and login
- Shopping cart and Wishlist
- Vendor dashboard with Products, Services, Orders, Bookings tabs
- **NEW: Vendor Payout Dashboard (Payouts tab)**
  - Stripe Connect onboarding flow
  - Earnings summary (Total Sales, Available, Pending, Paid Out)
  - Platform fee display (10%)
  - Transaction history with earnings, fees, and payouts
  - Request Payout functionality
- ImageUpload component for vendor product/service images
- Admin dashboard (stats, vendors, users, orders)
- Checkout success pages for products and services
- Tracking page (/tracking) with All/Orders/Bookings filter
- Tracking detail page with status timeline
- "Track Orders" link in user dropdown menu

### Email Notifications (SendGrid)
- New booking notification to vendor
- Booking status update to customer
- Payment released notification to vendor
- Order status update to customer

### Design
- Red/black color scheme matching user logo
- Montserrat + Ubuntu typography
- Rounded buttons and cards
- Responsive layout

## Test Accounts
- Admin: admin@example.com / password123
- Vendor (Approved): vendor@afrovending.com / password123
- Customer: testuser123@example.com / password123

## Testing Status (Feb 7, 2026)
- Backend: 100% (29/29 tests passed)
- Frontend: 100% (all features working)
- Vendor Payout Dashboard: Fully tested and functional

## Prioritized Backlog

### P0 (Critical - Next)
- PayPal payment integration
- Cloud storage for images (AWS S3)

### P1 (High Priority)
- Advanced search with filters
- Product variants (size, color)
- Order fulfillment workflow

### P2 (Nice to Have)
- Social login (Google, Facebook)
- Multiple shipping addresses
- Coupon/discount system
- Analytics dashboard for vendors

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login

### Products
- GET/POST /api/products
- GET/PUT/DELETE /api/products/:id

### Services
- GET/POST /api/services
- GET/PUT/DELETE /api/services/:id

### Bookings
- GET/POST /api/bookings
- GET /api/bookings/:id
- PUT /api/bookings/:id/status
- PUT /api/bookings/:id/confirm-delivery

### Vendor Payouts (NEW)
- GET /api/vendor/payout/summary
- GET /api/vendor/payout/transactions
- POST /api/vendor/stripe/connect
- GET /api/vendor/stripe/status
- POST /api/vendor/payout/request

### Tracking
- GET /api/tracking
- GET /api/tracking/:type/:id

### Upload
- POST /api/upload/image
- GET /api/uploads/:filename

### Admin
- GET /api/admin/vendors
- PUT /api/vendors/:id/approve
- GET /api/admin/users
- GET /api/admin/orders

## Stripe Connect Flow
1. Vendor clicks "Connect Stripe Account" in Payouts tab
2. System creates Stripe Express account
3. Vendor redirected to Stripe onboarding
4. After completion, vendor returns to dashboard
5. When customer confirms delivery, payout is available
6. Vendor requests payout → funds transfer to their Stripe account

## Platform Fee Structure
- 10% platform commission on all sales
- Fee deducted from vendor earnings automatically
- Displayed in vendor payout dashboard

## Next Tasks
1. Implement PayPal checkout flow
2. Add cloud storage for images (S3)
3. Create advanced product search
4. Add product variants support
