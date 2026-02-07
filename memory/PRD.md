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

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Payment**: Stripe Checkout API + Stripe Connect
- **Email**: SendGrid API
- **File Storage**: Local uploads (/app/backend/uploads/)
- **Deployment**: Kubernetes container with Nginx proxy

## What's Been Implemented (Feb 7, 2026)

### Backend API Endpoints

#### Authentication
- POST /api/auth/register
- POST /api/auth/login

#### Products
- GET/POST /api/products (with advanced filtering)
- GET/PUT/DELETE /api/products/:id
- GET /api/products/featured

#### Services
- GET/POST /api/services (with advanced filtering)
- GET/PUT/DELETE /api/services/:id
- GET /api/services/featured

#### Search (NEW)
- GET /api/search - Unified search for products and services
- GET /api/search/suggestions - Autocomplete suggestions

#### Bookings
- GET/POST /api/bookings
- GET /api/bookings/:id
- PUT /api/bookings/:id/status
- PUT /api/bookings/:id/confirm-delivery

#### Vendor Payouts
- GET /api/vendor/payout/summary
- GET /api/vendor/payout/transactions
- POST /api/vendor/stripe/connect
- GET /api/vendor/stripe/status
- POST /api/vendor/payout/request

#### Tracking
- GET /api/tracking
- GET /api/tracking/:type/:id

#### Upload
- POST /api/upload/image
- GET /api/uploads/:filename

#### Admin
- GET /api/admin/vendors
- PUT /api/vendors/:id/approve
- GET /api/admin/users
- GET /api/admin/orders

### Frontend Features

#### Pages
- Homepage with logo, hero, categories, featured sections
- **Products page with advanced filtering** (NEW)
  - Search input
  - Sort by (Newest, Price Low/High, Rating, Name)
  - Category multi-select filter
  - Price range slider
  - Rating filter
  - In Stock filter
  - Grid/List view toggle
  - Clear all filters button
  - URL persistence for shareable links
- **Services page with advanced filtering** (NEW)
  - All product filters plus Location Type filter (In Person, Remote, Both)
- Service detail page with booking calendar
- Booking detail page with Pay button and Confirm Delivery
- User dashboard with Bookings tab
- Vendor dashboard with Products, Services, Orders, Bookings, Payouts tabs
- Vendor Payout Dashboard (Stripe Connect integration)
- Admin dashboard
- Tracking page with timeline
- Cart, Wishlist, Checkout pages

#### Components
- SearchFilters - Reusable filter sidebar component
- ImageUpload - Image upload with preview
- PayoutDashboard - Vendor earnings and payout management
- ProductCard, ServiceCard

### Email Notifications (SendGrid)
- New booking notification to vendor
- Booking status update to customer
- Payment released notification to vendor
- Order status update to customer

## Test Accounts
- Admin: admin@example.com / password123
- Vendor (Approved): vendor@afrovending.com / password123
- Customer: testuser123@example.com / password123

## Testing Status (Feb 7, 2026)
- Backend: 100% (31/31 tests passed)
- Frontend: 100% (all features working)
- Advanced Search: Fully tested and functional

## Prioritized Backlog

### P1 (High Priority)
- PayPal payment integration
- Cloud storage for images (AWS S3)
- Product variants (size, color)

### P2 (Nice to Have)
- Social login (Google, Facebook)
- Multiple shipping addresses
- Coupon/discount system
- Analytics dashboard for vendors

## Search Filter Parameters

### Products (/api/products)
- search: Full-text search on name, description, tags
- category_ids: Comma-separated category IDs
- vendor_id: Filter by vendor
- min_price, max_price: Price range
- min_rating: Minimum rating (1-5)
- in_stock: Boolean, filter to in-stock items
- tags: Comma-separated tags
- sort_by: created_at, price, average_rating, name
- sort_order: asc, desc

### Services (/api/services)
- All product filters plus:
- location_type: in_person, remote, both
- min_duration, max_duration: Duration range

### Unified Search (/api/search)
- q: Search query
- type: products, services, or both
- All other product/service filters

## Next Tasks
1. Implement PayPal checkout flow
2. Add cloud storage for images (S3)
3. Create product variants support (size, color)
4. Build analytics dashboard for vendors
