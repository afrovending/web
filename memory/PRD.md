# Afrovending.com - Product Requirements Document

## Original Problem Statement
Create a full e-commerce platform for Afrovending.com - an online marketplace for African Vendors to sell their products AND SERVICES to global customers.

## User Choices
- Payment Integration: Stripe (live key configured) + PayPal (pending)
- Email Notifications: SendGrid (configured)
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
- **NEW: Image upload endpoint (/api/upload/image)**
- **NEW: Tracking endpoints (/api/tracking, /api/tracking/:type/:id)**
- **NEW: SendGrid email notifications for bookings**

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
- **NEW: ImageUpload component for vendor product/service images**
- Admin dashboard (stats, vendors, users, orders)
- Checkout success pages for products and services
- **NEW: Tracking page (/tracking) with All/Orders/Bookings filter**
- **NEW: Tracking detail page with status timeline**
- **NEW: "Track Orders" link in user dropdown menu**

### Email Notifications (SendGrid)
- New booking notification to vendor
- Booking status update to customer
- Payment released notification to vendor
- Order status update to customer

**Note**: SendGrid requires sender domain verification. Current sender email (noreply@afrovending.com) needs to be verified in SendGrid dashboard, or use a verified sender email.

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
- Backend: 100% (all endpoints working)
- Frontend: All features working
- New features tested: Tracking page, Image upload, Email integration

## Prioritized Backlog

### P0 (Critical - Next)
- Verify SendGrid sender domain for email delivery
- PayPal payment integration
- Order/product checkout flow improvements

### P1 (High Priority)
- Cloud storage for images (AWS S3)
- Vendor payout dashboard
- Advanced search with filters
- Product variants (size, color)

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

### Tracking (NEW)
- GET /api/tracking
- GET /api/tracking/:type/:id

### Upload (NEW)
- POST /api/upload/image
- GET /api/uploads/:filename

### Admin
- GET /api/admin/vendors
- PUT /api/vendors/:id/approve
- GET /api/admin/users
- GET /api/admin/orders

## Next Tasks
1. Verify SendGrid sender domain
2. Implement PayPal checkout flow
3. Add cloud storage for images (S3)
4. Create vendor payout tracking dashboard
5. Add advanced product search and filtering
