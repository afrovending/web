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

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Payment**: Stripe Checkout API + Stripe Connect
- **Email**: SendGrid API
- **File Storage**: Local uploads (/app/backend/uploads/)
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
8. **Vendor Dashboard** - Manage products, services, orders, bookings, payouts
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
9. **Coupon/Discount System** (NEW) - Full promo code management

### Coupon/Discount System (NEW - Feb 8, 2026)
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

## Testing Status (Feb 7, 2026)
- Backend: 100% (all tests passed)
- Frontend: 100% (all features working)
- Product Variants: 100% (14/14 backend, 11/11 frontend tests)

## Prioritized Backlog

### P1 (High Priority)
- PayPal payment integration
- Cloud storage for images (AWS S3)

### P2 (Nice to Have)
- Social login (Google, Facebook)
- Multiple shipping addresses
- Coupon/discount system
- Analytics dashboard for vendors

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
1. Implement PayPal checkout flow
2. Add cloud storage for images (S3)
3. Build social login (Google OAuth)
4. Create coupon/discount system
