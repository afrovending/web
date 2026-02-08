# Afrovending.com - Product Requirements Document

## Original Problem Statement
Create a full e-commerce platform for Afrovending.com - an online marketplace for African Vendors to sell their products AND SERVICES to global customers.

## User Choices
- Payment Integration: Stripe + PayPal (both configured) + Stripe Connect for vendor payouts
- Email Notifications: SendGrid (verified sender: info@afrovending.com)
- User Features: Full functionality (accounts, order history, wishlist, reviews)
- Admin Dashboard: Yes
- Design Theme: Red/black color scheme matching user's logo
- Fonts: Montserrat (headings) + Ubuntu (body)
- Service Marketplace: Vendors can list services, customers can book
- Escrow Payment: Vendors only receive payout after customer confirms service delivery
- Platform Fee: 10% commission on all sales

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Payment**: Stripe Checkout API + Stripe Connect + PayPal REST API
- **Email**: SendGrid API
- **File Storage**: AWS S3 (afrovending-uploads bucket, us-east-2)
- **Deployment**: Kubernetes container with Nginx proxy

## What's Been Implemented (Feb 8, 2026)

### Core Features
1. **User Authentication** - Register, Login, JWT tokens
2. **Product Management** - CRUD with advanced filtering
3. **Service Marketplace** - Booking system with calendar
4. **Shopping Cart** - With variant support and coupon discounts
5. **Wishlist** - Save favorite products
6. **Order Management** - With tracking timeline
7. **Reviews & Ratings** - For products and services
8. **Vendor Dashboard** - Manage products, services, orders, bookings, payouts, subscription
9. **Admin Dashboard** - Manage vendors, users, orders, coupons

### Advanced Features
1. **Advanced Search & Filtering** - Multi-category, price range, rating, sort options
2. **Unified Search API** - Search products and services together
3. **Search Suggestions** - Autocomplete functionality
4. **Product Variants** - Size, color options with individual pricing/stock
5. **Stripe Connect** - Vendor payout system
6. **Email Notifications** - SendGrid integration
7. **Image Upload** - Local file storage
8. **Order/Booking Tracking** - Timeline view with status updates
9. **Coupon/Discount System** - Full promo code management
10. **Vendor Subscription System** - Tiered pricing plans for vendors
11. **Vendor Analytics Dashboard** - Advanced analytics for Growth+ subscribers
12. **Verified Seller Badge** (NEW) - Trust indicator for Growth+ vendors

### Vendor Subscription System (NEW - Feb 8, 2026)
- **4 Subscription Tiers:**
  - **Starter** (Free): 5 products, 20% commission, basic features
  - **Growth** ($25/mo or $250/yr): 50 products, 15% commission, analytics, verified badge
  - **Pro Vendor** ($50/mo or $500/yr): Unlimited products, 10% commission, featured placement, advanced analytics
  - **Enterprise** (Custom): Dedicated manager, custom storefront, bulk uploads, B2B visibility
- **Billing Cycles**: Monthly and Yearly (with ~17% discount)
- **Product Limit Enforcement**: Vendors limited to plan's product count
- **Pricing Page**: /pricing with all plans displayed
- **Vendor Dashboard**: Subscription tab showing current plan, usage, upgrade options
- **Stripe Integration**: Checkout sessions for paid plans

### Vendor Analytics Dashboard (NEW - Feb 8, 2026)
- **Access Control**: Only Growth, Pro, and Enterprise subscribers
- **Starter Plan**: Shows "Analytics Locked" screen with upgrade CTA
- **Sales Analytics**:
  - Total revenue, orders, average order value
  - Revenue & orders trend charts (daily data points)
- **Traffic Analytics**:
  - Total views, unique visitors
  - Views trend over time
  - Traffic sources breakdown (direct, search, category, homepage)
- **Conversion Funnel**:
  - View-to-cart rate
  - Cart-to-purchase rate
  - Overall conversion rate
  - Visual funnel with Views → Cart Adds → Purchases
- **Customer Insights**:
  - Total, new, returning customers
  - Top customer locations
- **Top Products**:
  - Ranked by revenue
  - Shows views, cart adds, purchases, conversion rate per product
- **Period Selector**: 7d, 30d, 90d, 1y
- **View Tracking**: Automatic tracking on product detail page visits

### Weekly Analytics Email Reports (NEW - Feb 8, 2026)
- **Delivery**: Automated every Friday (via scheduler/cron)
- **Audience**: Growth, Pro, and Enterprise subscribers only
- **Opt-Out**: Toggle in Subscription > Email Preferences
- **Report Contents**:
  - Sales overview (revenue, orders, avg order value) with week-over-week comparison
  - Traffic stats (views, unique visitors) with change indicators
  - Conversion funnel rates (view→cart, cart→purchase, overall)
  - Top 5 products by revenue
  - Customer insights (new vs returning, top locations)
- **Email Preferences UI**:
  - Weekly Analytics Report toggle (Growth+ only)
  - Order Notifications toggle
  - Booking Notifications toggle
  - Marketing & Tips toggle
- **Scheduler Endpoint**: POST /api/analytics/send-all-weekly-reports (requires API key)

### AWS S3 Image Storage (NEW - Feb 8, 2026)
- **Bucket**: afrovending-uploads (us-east-2)
- **Public Access**: Images uploaded with `public-read` ACL
- **URL Format**: `https://afrovending-uploads.s3.us-east-2.amazonaws.com/products/{uuid}.{ext}`
- **Fallback**: Local storage if S3 credentials not configured
- **Validation**: 5MB max size, JPEG/PNG/WebP/GIF only

### PayPal Payment Integration (NEW - Feb 8, 2026)
- **Sandbox Mode**: Currently configured for PayPal sandbox testing
- **Checkout Flow**:
  - Customer clicks "Pay with PayPal" on cart page
  - Creates PayPal order via REST API
  - Redirects to PayPal approval page
  - On success, redirects to /checkout/paypal/success to capture payment
  - On cancel, redirects to /checkout/paypal/cancel
- **API Endpoints**:
  - POST /api/checkout/paypal - Create PayPal order
  - POST /api/checkout/paypal/capture - Capture payment after approval
  - GET /api/checkout/paypal/status/:order_id - Check order status
- **Frontend Pages**:
  - CartPage.jsx - "Pay with PayPal" button alongside Stripe
  - PayPalSuccessPage.jsx - Handles payment capture and success confirmation
  - PayPalCancelPage.jsx - Shows cancellation message
- **Database**: Uses payment_transactions collection with sparse unique index on session_id

### Verified Seller Badge (NEW - Feb 8, 2026)
- **Eligibility**: Growth, Pro, and Enterprise subscription plans
- **Display Locations**:
  - Product cards (blue badge with checkmark, top-left)
  - Product detail page (next to vendor name)
  - Vendors listing (checkmark on avatar + next to name)
  - Vendor profile page (badge in header + avatar checkmark)
- **API Fields**:
  - ProductResponse: is_verified_seller (boolean)
  - VendorResponse: is_verified_seller (boolean), subscription_plan (string)
- **Visual Design**: Blue color (#3b82f6) with BadgeCheck icon

### Multiple Shipping Addresses (NEW - Feb 8, 2026)
- **Max Addresses**: 10 per user
- **Default Address**: Auto-set for first address, can be changed
- **Address Fields**: Label, recipient name, street, apartment, city, state, postal code, country, phone
- **API Endpoints**:
  - GET /api/user/addresses - List all addresses
  - POST /api/user/addresses - Add new address
  - GET /api/user/addresses/:id - Get specific address
  - PUT /api/user/addresses/:id - Update address
  - DELETE /api/user/addresses/:id - Delete address
  - PUT /api/user/addresses/:id/default - Set as default
- **Frontend**: Address Book tab in User Dashboard with add/edit/delete functionality

### Email Templates Refactoring (NEW - Feb 8, 2026)
- **Template Engine**: Jinja2 with HTML autoescape
- **Templates Directory**: /backend/templates/
- **Templates Created**:
  - booking_created.html - Vendor notification for new bookings
  - booking_status.html - Customer notification for booking updates
  - payment_released.html - Vendor notification for released payments
  - order_status.html - Customer notification for order updates
  - weekly_report.html - Weekly analytics email for Growth+ vendors
- **Utility File**: /backend/utils/email_templates.py

### Enhanced Review/Rating UI (NEW - Feb 8, 2026)
- **Location**: ServiceDetailPage.jsx
- **Features**:
  - Overall rating display with large score
  - Rating breakdown with progress bars (5 to 1 stars)
  - Review cards with improved styling
  - Helpful voting button with count
  - Verified purchase badge
  - Review images gallery support
  - Empty state for no reviews

### Product Image Gallery (NEW - Feb 8, 2026)
- **Component**: `/frontend/src/components/ui/image-gallery.jsx`
- **Features**:
  - Main image display with thumbnails
  - Click to zoom indicator
  - Lightbox modal with zoom controls (1x to 3x)
  - Navigation arrows for multiple images
  - Keyboard navigation (arrow keys, +/-, Escape)
  - Thumbnail strip only shows for 2+ images

### Product Comparison (NEW - Feb 8, 2026)
- **Context**: `/frontend/src/contexts/CompareContext.js`
- **Components**:
  - CompareTray - Sticky bottom bar showing selected items
  - ComparePage - Side-by-side comparison table at `/compare`
- **Features**:
  - Max 4 items for comparison
  - Compare toggle button on ProductCard
  - Persists to localStorage
  - Comparison fields: Price, Rating, Vendor, Category, Stock, Variants, Description
  - Add to Cart and View Details actions from compare page

### Vendor Messaging/Chat (NEW - Feb 8, 2026)
- **Backend**: `/backend/routes/messaging.py`
- **Frontend**: `/frontend/src/pages/MessagesPage.jsx`
- **WebSocket**: Real-time messaging via WebSocket
  - Endpoint: `/api/ws/messages/{user_id}`
  - Features: instant delivery, typing indicators, online status, read receipts
  - Auto-reconnect on disconnect (3 sec delay)
  - Ping/pong keepalive (30 sec interval)
- **Features**:
  - Customer-vendor conversations
  - Product-specific inquiries
  - Real-time message delivery via WebSocket
  - Typing indicator (auto-stops after 2 sec)
  - Online status indicator (green dot)
  - Read receipts (✓ sent, ✓✓ read)
  - Connection status (Live/Connecting)
  - Unread message count in navbar
  - Message Vendor button on product detail pages
  - Conversation search and management
- **API Endpoints**:
  - GET /api/messages/conversations
  - POST /api/messages/send
  - GET /api/messages/unread-count
  - GET /api/messages/online-status
  - GET /api/messages/vendor/:vendorId/start
  - WS /api/ws/messages/:userId

### Coupon/Discount System (Feb 8, 2026)
- **Coupon Types**: Percentage or fixed amount discounts
- **Validation Rules**: Min order amount, max discount cap, usage limits
- **Date Constraints**: Start and expiry dates
- **Per-User Limits**: Configurable usage per customer
- **Cart Integration**: Apply/remove coupons, see discount in order summary
- **Admin Management**: Full CRUD in Admin Dashboard Coupons tab

### Product Variants Feature
- **Variant Options**: Products can have Size, Color, or custom options
- **Individual Pricing**: Each variant can have its own price
- **Stock Management**: Each variant has its own stock count
- **SKU Support**: Each variant can have a unique SKU
- **Visual Selectors**: Size buttons, color swatches
- **Out of Stock Handling**: Disabled variants with visual indicators
- **Cart Integration**: Cart displays selected variant options

### API Endpoints

#### Authentication
- POST /api/auth/register
- POST /api/auth/login

#### Products (with Variants)
- GET/POST /api/products
- GET/PUT/DELETE /api/products/:id

#### Search
- GET /api/search - Unified search
- GET /api/search/suggestions - Autocomplete

#### Services
- GET/POST /api/services
- GET/PUT/DELETE /api/services/:id

#### Bookings
- GET/POST /api/bookings
- PUT /api/bookings/:id/status
- PUT /api/bookings/:id/confirm-delivery

#### Cart & Coupons
- GET /api/cart
- POST /api/cart/items (supports variant_id, selected_options)
- PUT/DELETE /api/cart/items/:id
- POST /api/cart/apply-coupon
- DELETE /api/cart/coupon

#### Coupons (Admin)
- GET/POST /api/coupons
- GET/PUT/DELETE /api/coupons/:id
- POST /api/coupons/validate

#### Vendor Payouts
- GET /api/vendor/payout/summary
- GET /api/vendor/payout/transactions
- POST /api/vendor/stripe/connect
- POST /api/vendor/payout/request

#### Vendor Subscriptions
- GET /api/subscriptions/plans - Get all subscription plans
- GET /api/subscriptions/current - Get vendor's current subscription
- POST /api/subscriptions/checkout - Create Stripe checkout for subscription
- GET /api/subscriptions/success - Handle successful subscription
- POST /api/subscriptions/cancel - Cancel subscription
- POST /api/subscriptions/reactivate - Reactivate cancelled subscription
- GET /api/subscriptions/portal - Get Stripe customer portal URL

#### Vendor Analytics (Growth+ Only)
- GET /api/analytics/vendor - Get comprehensive vendor analytics
- GET /api/analytics/product/:id - Get detailed product analytics
- POST /api/analytics/track-view - Track product view event
- POST /api/analytics/track-cart-add - Track cart add event

#### Email Preferences & Weekly Reports
- GET /api/vendor/email-preferences - Get vendor's email preferences
- PUT /api/vendor/email-preferences - Update email preferences
- GET /api/analytics/preview-weekly-report - Preview weekly report HTML
- POST /api/analytics/send-weekly-report/{vendor_id} - Send report to specific vendor
- POST /api/analytics/send-all-weekly-reports - Batch send to all eligible vendors (scheduler)

#### Tracking
- GET /api/tracking
- GET /api/tracking/:type/:id

#### Upload
- POST /api/upload/image

## Test Accounts
- Admin: admin@example.com / password123
- Vendor: vendor@afrovending.com / password123
- Customer: testuser123@example.com / password123

## Test Data
- **Product with Variants**: "African Ankara Dress" (ID: 41db2e79-2497-4cc4-a182-bd9c56e79451)
  - Sizes: S, M, L, XL
  - Colors: Red, Blue, Green, Yellow
  - Different prices per size tier
- **Product without Variants**: "Raw Unrefined Shea Butter" (ID: 99b24dcb-c76b-4d3c-9c67-9ae4da1ecf9f)
- **Test Coupon**: SAVE20 (20% discount, active)

## Testing Status (Feb 8, 2026)
- Backend: 100% (all tests passed)
- Frontend: 100% (all features working)
- Product Variants: 100% (14/14 backend, 11/11 frontend tests)
- Coupon System: 100% (19/19 backend, 16/16 frontend tests)
- Vendor Analytics: 100% (17/17 backend, all frontend features working)
- Weekly Email Reports: 100% (15/15 backend, all frontend features working)
- Verified Seller Badge: 100% (15/15 backend, all frontend displays working)
- PayPal Integration: 100% (backend endpoints working, frontend UI integrated)
- AWS S3 Image Storage: 100% (uploads working, images publicly accessible)
- Google Social Login: 100% (12/12 backend tests, all frontend flows working)
- Email Templates Refactoring: 100% (Jinja2 templates, 5 template files, full testing)
- Multiple Shipping Addresses: 100% (28/28 backend tests, full CRUD + UI)
- Enhanced Review/Rating UI: 100% (Rating breakdown, helpful votes, verified badges)
- Product Image Gallery: 100% (lightbox, zoom, keyboard nav all working)
- Product Comparison: 100% (compare tray, page, max 4 limit, localStorage persistence)
- Vendor Messaging: 100% (20/20 backend tests, full chat UI working)
- WebSocket Real-time: 100% (12/12 tests, instant delivery, typing, online status)

## Prioritized Backlog

### P0 (Critical) - COMPLETED ✅
- Refactor server.py into modular APIRouters
  - Original: 4957 lines → Final: 2941 lines (40.7% reduction)
  - Created 16 modular route files (3792 lines total)
  - All routes migrated and tested

### P1 (High Priority) - COMPLETED ✅
- Admin Analytics Dashboard
  - Backend: 7 new analytics endpoints
  - Frontend: Interactive dashboard with charts (recharts)
  - Features: Revenue trends, user growth, top vendors/products, category breakdown

### P1 (High Priority) - COMPLETED ✅
- Google Social Login integration (Feb 8, 2026)
  - Emergent-managed Google OAuth
  - Login button with Google branding on /login page
  - OAuth callback handler at /auth/callback
  - Backend session management with cookies + JWT
  - User auto-registration from Google profile

### P2 (Nice to Have) - COMPLETED ✅ (Feb 8, 2026)
- Multiple shipping addresses
  - Full CRUD API: /api/user/addresses/*
  - Max 10 addresses per user
  - Default address management
  - Address Book tab in User Dashboard
- Enhanced review/rating UI for services
  - Rating breakdown with progress bars
  - Helpful voting buttons
  - Verified purchase badges
  - Review images support
- Email templates refactoring
  - Jinja2 templates in /backend/templates/
  - 5 template files extracted from inline HTML
  - Centralized rendering via email_templates.py

## Technical Debt
- **Email reports HTML**: ✅ RESOLVED - Extracted to Jinja2 templates
- **Image persistence**: ✅ RESOLVED - Now uses AWS S3 for cloud storage
- **Utils folder**: Created /app/backend/utils/ with database.py, auth.py, email.py, email_templates.py

## Next Tasks
1. Add product quick view modal
2. Implement order tracking map view
3. Add vendor storefront customization
4. Implement product recommendations engine

## Subscription Plans Data Structure

```json
{
  "id": "growth",
  "name": "Growth",
  "price_monthly": 25,
  "price_yearly": 250,
  "commission_rate": 15,
  "product_limit": 50,
  "features": [
    "Up to 50 products",
    "Boosted category visibility",
    "Basic sales & traffic analytics",
    "Priority email support",
    "Verified Seller badge"
  ],
  "stripe_price_id_monthly": null,
  "stripe_price_id_yearly": null,
  "is_custom": false
}
```

## Variant Data Structure

```json
{
  "has_variants": true,
  "variant_options": [
    {"name": "Size", "values": ["S", "M", "L", "XL"]},
    {"name": "Color", "values": ["Red", "Blue", "Green"]}
  ],
  "variants": [
    {
      "id": "uuid",
      "sku": "ANK-M-RED",
      "options": {"Size": "M", "Color": "Red"},
      "price": 89.99,
      "stock": 8,
      "image": "optional-variant-image-url"
    }
  ]
}
```

## Next Tasks
1. Extract inline HTML from email_reports.py into template files
2. Add multiple shipping addresses feature
3. Enhanced review/rating UI for services

### Google Social Login (COMPLETED - Feb 8, 2026)
- **Auth Flow**: Click "Sign in with Google" → Emergent Auth → /auth/callback → Session created
- **Backend Endpoints**:
  - POST /api/auth/google/session - Exchange session_id for user data
  - POST /api/auth/google/logout - Clear Google session
  - GET /api/auth/me - Supports both JWT and session cookie
- **Frontend Components**:
  - AuthPages.jsx - Google Sign-in button
  - AuthCallback.jsx - OAuth callback handler
  - AuthContext.js - loginWithGoogle(), processGoogleCallback()
- **Database Collections**: google_sessions (stores session tokens)

## Coupon Data Structure

```json
{
  "id": "uuid",
  "code": "SAVE20",
  "discount_type": "percentage",  // or "fixed"
  "discount_value": 20,
  "min_order_amount": 0,
  "max_discount": null,
  "max_uses": null,
  "max_uses_per_user": 1,
  "used_count": 0,
  "start_date": "2026-02-08T00:00:00Z",
  "expiry_date": "2026-12-31T23:59:59Z",
  "is_active": true,
  "vendor_id": null,  // null = platform-wide
  "created_at": "2026-02-08T00:00:00Z"
}
```
