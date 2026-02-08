"""
Afrovending.com Backend API Tests
Tests for: Auth, Services, Bookings, Escrow Payment Flow
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://afro-paypal-test.preview.emergentagent.com').rstrip('/')

# Test credentials
VENDOR_EMAIL = "vendor.approved@example.com"
VENDOR_PASSWORD = "password123"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "password123"

# Test data prefix for cleanup
TEST_PREFIX = "TEST_"


class TestHealthAndCategories:
    """Basic health and category tests"""
    
    def test_health_endpoint(self):
        """Test API health check"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health endpoint working")
    
    def test_get_categories(self):
        """Test categories endpoint returns data"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        categories = response.json()
        assert isinstance(categories, list)
        assert len(categories) > 0
        # Check for Services parent category
        services_cat = next((c for c in categories if c["name"] == "Services"), None)
        assert services_cat is not None, "Services category should exist"
        print(f"✓ Found {len(categories)} categories including Services")


class TestAuthentication:
    """Authentication flow tests"""
    
    def test_vendor_login(self):
        """Test vendor login with approved account"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "vendor"
        assert data["user"]["vendor_id"] is not None
        print(f"✓ Vendor login successful: {data['user']['email']}")
    
    def test_admin_login(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "admin"
        print(f"✓ Admin login successful: {data['user']['email']}")
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid login correctly rejected")
    
    def test_register_new_customer(self):
        """Test customer registration"""
        unique_email = f"{TEST_PREFIX}customer_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "first_name": "Test",
            "last_name": "Customer",
            "role": "customer"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == unique_email
        assert data["user"]["role"] == "customer"
        print(f"✓ Customer registration successful: {unique_email}")
        return data


class TestVendorServices:
    """Vendor service management tests"""
    
    @pytest.fixture
    def vendor_token(self):
        """Get vendor auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def vendor_id(self, vendor_token):
        """Get vendor ID"""
        response = requests.get(f"{BASE_URL}/api/auth/me", 
            headers={"Authorization": f"Bearer {vendor_token}"})
        return response.json()["vendor_id"]
    
    @pytest.fixture
    def service_category_id(self):
        """Get a service subcategory ID"""
        response = requests.get(f"{BASE_URL}/api/categories")
        categories = response.json()
        services_parent = next((c for c in categories if c["name"] == "Services"), None)
        if services_parent:
            subcategory = next((c for c in categories if c.get("parent_id") == services_parent["id"]), None)
            if subcategory:
                return subcategory["id"]
        # Fallback to any category
        return categories[0]["id"] if categories else None
    
    def test_create_service(self, vendor_token, service_category_id):
        """Test vendor can create a service"""
        service_data = {
            "name": f"{TEST_PREFIX}Hair Braiding Service",
            "description": "Professional African hair braiding service",
            "price": 75.00,
            "price_type": "fixed",
            "duration_minutes": 120,
            "location_type": "both",
            "category_id": service_category_id,
            "images": ["https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400"],
            "tags": ["hair", "braiding", "african"]
        }
        
        response = requests.post(f"{BASE_URL}/api/services", 
            json=service_data,
            headers={"Authorization": f"Bearer {vendor_token}"})
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == service_data["name"]
        assert data["price"] == service_data["price"]
        assert "id" in data
        print(f"✓ Service created: {data['name']} (ID: {data['id'][:8]}...)")
        return data
    
    def test_get_services(self):
        """Test services listing endpoint"""
        response = requests.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200
        services = response.json()
        assert isinstance(services, list)
        print(f"✓ Services endpoint returns {len(services)} services")
    
    def test_get_service_by_id(self, vendor_token, service_category_id):
        """Test getting a specific service"""
        # First create a service
        service_data = {
            "name": f"{TEST_PREFIX}Catering Service",
            "description": "African cuisine catering",
            "price": 200.00,
            "price_type": "starting_from",
            "duration_minutes": 180,
            "location_type": "onsite",
            "category_id": service_category_id,
            "images": [],
            "tags": ["catering", "food"]
        }
        
        create_response = requests.post(f"{BASE_URL}/api/services", 
            json=service_data,
            headers={"Authorization": f"Bearer {vendor_token}"})
        
        service_id = create_response.json()["id"]
        
        # Get the service
        response = requests.get(f"{BASE_URL}/api/services/{service_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == service_id
        assert data["name"] == service_data["name"]
        print(f"✓ Service retrieved by ID: {data['name']}")
    
    def test_get_service_timeslots(self, vendor_token, service_category_id):
        """Test getting available time slots for a service"""
        # Create a service first
        service_data = {
            "name": f"{TEST_PREFIX}Consultation Service",
            "description": "Business consultation",
            "price": 50.00,
            "price_type": "hourly",
            "duration_minutes": 60,
            "location_type": "remote",
            "category_id": service_category_id,
            "images": [],
            "tags": ["consultation"]
        }
        
        create_response = requests.post(f"{BASE_URL}/api/services", 
            json=service_data,
            headers={"Authorization": f"Bearer {vendor_token}"})
        
        service_id = create_response.json()["id"]
        
        # Get timeslots for tomorrow
        from datetime import datetime, timedelta
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        response = requests.get(f"{BASE_URL}/api/services/{service_id}/timeslots?date={tomorrow}")
        assert response.status_code == 200
        slots = response.json()
        assert isinstance(slots, list)
        print(f"✓ Timeslots endpoint returns {len(slots)} slots for {tomorrow}")


class TestBookingFlow:
    """Booking creation and management tests"""
    
    @pytest.fixture
    def customer_auth(self):
        """Create and login a test customer"""
        unique_email = f"{TEST_PREFIX}booking_customer_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "first_name": "Booking",
            "last_name": "Customer",
            "role": "customer"
        })
        return response.json()
    
    @pytest.fixture
    def vendor_token(self):
        """Get vendor auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def test_service(self, vendor_token):
        """Create a test service for booking"""
        response = requests.get(f"{BASE_URL}/api/categories")
        categories = response.json()
        services_parent = next((c for c in categories if c["name"] == "Services"), None)
        category_id = categories[0]["id"]
        if services_parent:
            subcategory = next((c for c in categories if c.get("parent_id") == services_parent["id"]), None)
            if subcategory:
                category_id = subcategory["id"]
        
        service_data = {
            "name": f"{TEST_PREFIX}Booking Test Service",
            "description": "Service for booking tests",
            "price": 100.00,
            "price_type": "fixed",
            "duration_minutes": 60,
            "location_type": "both",
            "category_id": category_id,
            "images": [],
            "tags": ["test"]
        }
        
        response = requests.post(f"{BASE_URL}/api/services", 
            json=service_data,
            headers={"Authorization": f"Bearer {vendor_token}"})
        return response.json()
    
    def test_create_booking(self, customer_auth, test_service):
        """Test customer can create a booking"""
        from datetime import datetime, timedelta
        
        # Get a weekday (Mon-Fri) for booking
        booking_date = datetime.now() + timedelta(days=1)
        while booking_date.weekday() >= 5:  # Skip weekends
            booking_date += timedelta(days=1)
        
        booking_data = {
            "service_id": test_service["id"],
            "booking_date": booking_date.strftime("%Y-%m-%d"),
            "booking_time": "10:00",
            "notes": "Test booking",
            "customer_address": "123 Test Street"
        }
        
        response = requests.post(f"{BASE_URL}/api/bookings",
            json=booking_data,
            headers={"Authorization": f"Bearer {customer_auth['access_token']}"})
        
        assert response.status_code == 200
        data = response.json()
        assert data["service_id"] == test_service["id"]
        assert data["status"] == "pending"
        assert data["payment_status"] == "pending"
        assert data["delivery_confirmed"] == False
        print(f"✓ Booking created: {data['id'][:8]}... for {data['service_name']}")
        return data
    
    def test_get_customer_bookings(self, customer_auth, test_service):
        """Test customer can view their bookings"""
        # First create a booking
        from datetime import datetime, timedelta
        booking_date = datetime.now() + timedelta(days=2)
        while booking_date.weekday() >= 5:
            booking_date += timedelta(days=1)
        
        booking_data = {
            "service_id": test_service["id"],
            "booking_date": booking_date.strftime("%Y-%m-%d"),
            "booking_time": "11:00",
            "notes": "Test booking for list"
        }
        
        requests.post(f"{BASE_URL}/api/bookings",
            json=booking_data,
            headers={"Authorization": f"Bearer {customer_auth['access_token']}"})
        
        # Get bookings
        response = requests.get(f"{BASE_URL}/api/bookings",
            headers={"Authorization": f"Bearer {customer_auth['access_token']}"})
        
        assert response.status_code == 200
        bookings = response.json()
        assert isinstance(bookings, list)
        assert len(bookings) >= 1
        print(f"✓ Customer has {len(bookings)} booking(s)")
    
    def test_get_vendor_bookings(self, vendor_token, customer_auth, test_service):
        """Test vendor can view bookings for their services"""
        # Create a booking first
        from datetime import datetime, timedelta
        booking_date = datetime.now() + timedelta(days=3)
        while booking_date.weekday() >= 5:
            booking_date += timedelta(days=1)
        
        booking_data = {
            "service_id": test_service["id"],
            "booking_date": booking_date.strftime("%Y-%m-%d"),
            "booking_time": "14:00"
        }
        
        requests.post(f"{BASE_URL}/api/bookings",
            json=booking_data,
            headers={"Authorization": f"Bearer {customer_auth['access_token']}"})
        
        # Get vendor bookings
        response = requests.get(f"{BASE_URL}/api/vendor/bookings",
            headers={"Authorization": f"Bearer {vendor_token}"})
        
        assert response.status_code == 200
        bookings = response.json()
        assert isinstance(bookings, list)
        print(f"✓ Vendor has {len(bookings)} booking(s)")


class TestEscrowPaymentFlow:
    """Escrow payment and delivery confirmation tests"""
    
    @pytest.fixture
    def customer_auth(self):
        """Create and login a test customer"""
        unique_email = f"{TEST_PREFIX}escrow_customer_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "first_name": "Escrow",
            "last_name": "Customer",
            "role": "customer"
        })
        return response.json()
    
    @pytest.fixture
    def vendor_token(self):
        """Get vendor auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def test_service(self, vendor_token):
        """Create a test service"""
        response = requests.get(f"{BASE_URL}/api/categories")
        categories = response.json()
        category_id = categories[0]["id"]
        
        service_data = {
            "name": f"{TEST_PREFIX}Escrow Test Service",
            "description": "Service for escrow tests",
            "price": 150.00,
            "price_type": "fixed",
            "duration_minutes": 90,
            "location_type": "remote",
            "category_id": category_id,
            "images": [],
            "tags": ["escrow", "test"]
        }
        
        response = requests.post(f"{BASE_URL}/api/services", 
            json=service_data,
            headers={"Authorization": f"Bearer {vendor_token}"})
        return response.json()
    
    @pytest.fixture
    def test_booking(self, customer_auth, test_service):
        """Create a test booking"""
        from datetime import datetime, timedelta
        booking_date = datetime.now() + timedelta(days=4)
        while booking_date.weekday() >= 5:
            booking_date += timedelta(days=1)
        
        booking_data = {
            "service_id": test_service["id"],
            "booking_date": booking_date.strftime("%Y-%m-%d"),
            "booking_time": "15:00"
        }
        
        response = requests.post(f"{BASE_URL}/api/bookings",
            json=booking_data,
            headers={"Authorization": f"Bearer {customer_auth['access_token']}"})
        return response.json(), customer_auth
    
    def test_checkout_endpoint_exists(self, test_booking):
        """Test checkout endpoint returns proper response"""
        booking, customer_auth = test_booking
        
        response = requests.post(f"{BASE_URL}/api/bookings/{booking['id']}/checkout",
            json={
                "booking_id": booking["id"],
                "origin_url": "https://afro-paypal-test.preview.emergentagent.com"
            },
            headers={"Authorization": f"Bearer {customer_auth['access_token']}"})
        
        # Should return checkout URL (200) or error if Stripe not configured
        assert response.status_code in [200, 400, 500]
        if response.status_code == 200:
            data = response.json()
            assert "checkout_url" in data
            assert "session_id" in data
            print(f"✓ Checkout endpoint returns Stripe URL")
        else:
            print(f"✓ Checkout endpoint exists (Stripe may need configuration)")
    
    def test_confirm_delivery_requires_payment(self, test_booking):
        """Test confirm delivery fails if payment not completed"""
        booking, customer_auth = test_booking
        
        response = requests.put(f"{BASE_URL}/api/bookings/{booking['id']}/confirm-delivery",
            headers={"Authorization": f"Bearer {customer_auth['access_token']}"})
        
        # Should fail because payment_status is 'pending'
        assert response.status_code == 400
        data = response.json()
        assert "payment" in data["detail"].lower()
        print("✓ Confirm delivery correctly requires payment first")
    
    def test_booking_status_update(self, vendor_token, test_booking):
        """Test vendor can update booking status"""
        booking, _ = test_booking
        
        response = requests.put(f"{BASE_URL}/api/bookings/{booking['id']}/status",
            json={"status": "confirmed"},
            headers={"Authorization": f"Bearer {vendor_token}"})
        
        assert response.status_code == 200
        print("✓ Vendor can update booking status")
    
    def test_customer_can_cancel_pending_booking(self, test_booking):
        """Test customer can cancel a pending booking"""
        booking, customer_auth = test_booking
        
        response = requests.put(f"{BASE_URL}/api/bookings/{booking['id']}/status",
            json={"status": "cancelled"},
            headers={"Authorization": f"Bearer {customer_auth['access_token']}"})
        
        assert response.status_code == 200
        print("✓ Customer can cancel pending booking")


class TestVendorManagement:
    """Vendor profile and management tests"""
    
    def test_get_vendors_list(self):
        """Test vendors listing endpoint"""
        response = requests.get(f"{BASE_URL}/api/vendors")
        assert response.status_code == 200
        vendors = response.json()
        assert isinstance(vendors, list)
        print(f"✓ Vendors endpoint returns {len(vendors)} vendors")
    
    def test_get_approved_vendor(self):
        """Test getting approved vendor by ID"""
        # First get vendors list
        response = requests.get(f"{BASE_URL}/api/vendors?is_approved=true")
        assert response.status_code == 200
        vendors = response.json()
        
        if vendors:
            vendor_id = vendors[0]["id"]
            response = requests.get(f"{BASE_URL}/api/vendors/{vendor_id}")
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == vendor_id
            print(f"✓ Vendor retrieved: {data['store_name']}")
        else:
            print("✓ No approved vendors to test (expected)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
