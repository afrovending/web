# Server.py Refactoring Roadmap

## Current State
- `server.py`: 4957 lines (monolithic)
- All models, routes, and utilities in single file

## Target Architecture
```
/app/backend/
├── server.py              # Main app entry point (~100 lines)
├── config.py              # Configuration & DB connections ✅ CREATED
├── models/
│   └── __init__.py        # All Pydantic models ✅ CREATED
├── routes/
│   ├── __init__.py        # Router aggregation
│   ├── auth.py            # Authentication routes (lines 862-918)
│   ├── categories.py      # Category routes (lines 920-942)
│   ├── products.py        # Product routes (lines 944-1318)
│   ├── vendors.py         # Vendor routes (lines 1318-1420)
│   ├── services.py        # Service routes (lines 1420-1664)
│   ├── bookings.py        # Booking routes (lines 1664-1962)
│   ├── cart.py            # Cart & wishlist routes (lines 2140-2410)
│   ├── orders.py          # Order routes (lines 2451-2640)
│   ├── payments.py        # Stripe & PayPal checkout (lines 2492-2947)
│   ├── admin.py           # Admin routes (lines 2947-2992)
│   ├── tracking.py        # Order/booking tracking (lines 3052-3192)
│   ├── payouts.py         # Vendor payout routes (lines 3192-3514)
│   ├── subscriptions.py   # Subscription routes (lines 3514-3872)
│   ├── analytics.py       # Analytics routes (lines 3872-4290)
│   ├── email_reports.py   # Email report routes (lines 4290-4875)
│   └── upload.py          # Image upload routes (lines 2992-3052)
└── utils/
    ├── __init__.py
    ├── auth.py            # Auth helpers ✅ CREATED
    └── email.py           # Email service helpers
```

## Migration Order (Priority)
1. ✅ config.py - Configuration centralization
2. ✅ models/__init__.py - Pydantic models
3. ✅ utils/auth.py - Authentication utilities
4. 🔲 routes/auth.py - Auth endpoints
5. 🔲 routes/products.py - Product CRUD
6. 🔲 routes/payments.py - Stripe/PayPal
7. 🔲 routes/vendors.py - Vendor management
8. 🔲 routes/admin.py - Admin dashboard
9. 🔲 Remaining routes...

## Migration Steps (Per Route File)
1. Create new route file with APIRouter
2. Copy relevant endpoints from server.py
3. Update imports to use config.py and models/
4. Register router in server.py
5. Test endpoints work correctly
6. Remove old code from server.py (optional, can keep for backup)

## Testing Strategy
- Test each migrated route module before proceeding
- Use existing test credentials:
  - Admin: admin@example.com / password123
  - Customer: testuser123@example.com / password123
  - Vendor: vendor.approved@example.com / password123

## Notes
- Keep server.py as fallback until all routes migrated
- Incremental approach prevents breaking production
- Each migration should be independently testable
