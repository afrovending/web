"""
Test suite for Vendor Analytics Dashboard
Tests: Analytics access control, view tracking, analytics data structure
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
VENDOR_STARTER_EMAIL = "vendor.approved@example.com"
VENDOR_STARTER_PASSWORD = "password123"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "password123"


class TestAnalyticsAccessControl:
    """Test analytics access based on subscription tier"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_auth_token(self, email, password):
        """Helper to get auth token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    
    def test_analytics_endpoint_requires_auth(self):
        """Test that analytics endpoint requires authentication"""
        response = self.session.get(f"{BASE_URL}/api/analytics/vendor")
        assert response.status_code == 403 or response.status_code == 401, \
            f"Expected 401/403 for unauthenticated request, got {response.status_code}"
        print("✓ Analytics endpoint requires authentication")
    
    def test_starter_vendor_gets_has_access_false(self):
        """Test that Starter plan vendor gets has_access=false"""
        token = self.get_auth_token(VENDOR_STARTER_EMAIL, VENDOR_STARTER_PASSWORD)
        assert token, "Failed to login as vendor"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        response = self.session.get(f"{BASE_URL}/api/analytics/vendor")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Starter plan should get has_access=false
        assert "has_access" in data, "Response should contain has_access field"
        assert data["has_access"] == False, f"Starter vendor should have has_access=false, got {data['has_access']}"
        print("✓ Starter plan vendor gets has_access=false")
    
    def test_admin_can_access_analytics(self):
        """Test that admin can access analytics (bypasses subscription check)"""
        token = self.get_auth_token(ADMIN_EMAIL, ADMIN_PASSWORD)
        assert token, "Failed to login as admin"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        response = self.session.get(f"{BASE_URL}/api/analytics/vendor")
        
        # Admin should either get full access or 404 if no vendor profile
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            # Admin should have access
            assert data.get("has_access") == True, "Admin should have has_access=true"
            print("✓ Admin can access analytics with has_access=true")
        else:
            print("✓ Admin endpoint returns 404 (no vendor profile) - expected behavior")


class TestAnalyticsDataStructure:
    """Test analytics response data structure"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_auth_token(self, email, password):
        """Helper to get auth token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    
    def test_analytics_response_structure(self):
        """Test that analytics response has correct structure"""
        token = self.get_auth_token(VENDOR_STARTER_EMAIL, VENDOR_STARTER_PASSWORD)
        assert token, "Failed to login as vendor"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        response = self.session.get(f"{BASE_URL}/api/analytics/vendor")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Check required fields exist
        required_fields = ["sales", "top_products", "traffic", "conversions", "customers", "period", "has_access"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        print("✓ Analytics response has all required fields: sales, top_products, traffic, conversions, customers, period, has_access")
    
    def test_sales_analytics_structure(self):
        """Test sales analytics structure"""
        token = self.get_auth_token(VENDOR_STARTER_EMAIL, VENDOR_STARTER_PASSWORD)
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        response = self.session.get(f"{BASE_URL}/api/analytics/vendor")
        
        data = response.json()
        sales = data.get("sales", {})
        
        # Check sales fields
        sales_fields = ["total_revenue", "total_orders", "average_order_value", "revenue_trend", "orders_trend"]
        for field in sales_fields:
            assert field in sales, f"Missing sales field: {field}"
        
        print("✓ Sales analytics has correct structure: total_revenue, total_orders, average_order_value, revenue_trend, orders_trend")
    
    def test_traffic_analytics_structure(self):
        """Test traffic analytics structure"""
        token = self.get_auth_token(VENDOR_STARTER_EMAIL, VENDOR_STARTER_PASSWORD)
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        response = self.session.get(f"{BASE_URL}/api/analytics/vendor")
        
        data = response.json()
        traffic = data.get("traffic", {})
        
        # Check traffic fields
        traffic_fields = ["total_views", "unique_visitors", "views_trend", "top_sources"]
        for field in traffic_fields:
            assert field in traffic, f"Missing traffic field: {field}"
        
        print("✓ Traffic analytics has correct structure: total_views, unique_visitors, views_trend, top_sources")
    
    def test_conversions_analytics_structure(self):
        """Test conversions analytics structure"""
        token = self.get_auth_token(VENDOR_STARTER_EMAIL, VENDOR_STARTER_PASSWORD)
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        response = self.session.get(f"{BASE_URL}/api/analytics/vendor")
        
        data = response.json()
        conversions = data.get("conversions", {})
        
        # Check conversions fields
        conversion_fields = ["view_to_cart_rate", "cart_to_purchase_rate", "overall_conversion_rate", "funnel_data"]
        for field in conversion_fields:
            assert field in conversions, f"Missing conversions field: {field}"
        
        print("✓ Conversions analytics has correct structure: view_to_cart_rate, cart_to_purchase_rate, overall_conversion_rate, funnel_data")
    
    def test_customers_analytics_structure(self):
        """Test customers analytics structure"""
        token = self.get_auth_token(VENDOR_STARTER_EMAIL, VENDOR_STARTER_PASSWORD)
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        response = self.session.get(f"{BASE_URL}/api/analytics/vendor")
        
        data = response.json()
        customers = data.get("customers", {})
        
        # Check customers fields
        customer_fields = ["total_customers", "new_customers", "returning_customers", "top_locations"]
        for field in customer_fields:
            assert field in customers, f"Missing customers field: {field}"
        
        print("✓ Customers analytics has correct structure: total_customers, new_customers, returning_customers, top_locations")


class TestPeriodSelector:
    """Test analytics period selector"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_auth_token(self, email, password):
        """Helper to get auth token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    
    def test_period_7d(self):
        """Test 7 day period"""
        token = self.get_auth_token(VENDOR_STARTER_EMAIL, VENDOR_STARTER_PASSWORD)
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        response = self.session.get(f"{BASE_URL}/api/analytics/vendor?period=7d")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("period") == "7d", f"Expected period=7d, got {data.get('period')}"
        print("✓ Period 7d works correctly")
    
    def test_period_30d(self):
        """Test 30 day period"""
        token = self.get_auth_token(VENDOR_STARTER_EMAIL, VENDOR_STARTER_PASSWORD)
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        response = self.session.get(f"{BASE_URL}/api/analytics/vendor?period=30d")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("period") == "30d", f"Expected period=30d, got {data.get('period')}"
        print("✓ Period 30d works correctly")
    
    def test_period_90d(self):
        """Test 90 day period"""
        token = self.get_auth_token(VENDOR_STARTER_EMAIL, VENDOR_STARTER_PASSWORD)
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        response = self.session.get(f"{BASE_URL}/api/analytics/vendor?period=90d")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("period") == "90d", f"Expected period=90d, got {data.get('period')}"
        print("✓ Period 90d works correctly")
    
    def test_period_1y(self):
        """Test 1 year period"""
        token = self.get_auth_token(VENDOR_STARTER_EMAIL, VENDOR_STARTER_PASSWORD)
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        response = self.session.get(f"{BASE_URL}/api/analytics/vendor?period=1y")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("period") == "1y", f"Expected period=1y, got {data.get('period')}"
        print("✓ Period 1y works correctly")


class TestViewTracking:
    """Test product view tracking"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_auth_token(self, email, password):
        """Helper to get auth token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    
    def get_a_product_id(self):
        """Get a product ID for testing"""
        response = self.session.get(f"{BASE_URL}/api/products?limit=1")
        if response.status_code == 200 and response.json():
            return response.json()[0].get("id")
        return None
    
    def test_track_view_success(self):
        """Test that view tracking works"""
        product_id = self.get_a_product_id()
        if not product_id:
            pytest.skip("No products available for testing")
        
        session_id = str(uuid.uuid4())
        response = self.session.post(
            f"{BASE_URL}/api/analytics/track-view?product_id={product_id}&source=direct&session_id={session_id}"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Expected success=true, got {data}"
        print(f"✓ View tracking works for product {product_id}")
    
    def test_track_view_with_different_sources(self):
        """Test view tracking with different sources"""
        product_id = self.get_a_product_id()
        if not product_id:
            pytest.skip("No products available for testing")
        
        sources = ["direct", "search", "category", "homepage"]
        for source in sources:
            session_id = str(uuid.uuid4())
            response = self.session.post(
                f"{BASE_URL}/api/analytics/track-view?product_id={product_id}&source={source}&session_id={session_id}"
            )
            assert response.status_code == 200, f"Failed for source={source}: {response.text}"
        
        print(f"✓ View tracking works with all sources: {sources}")
    
    def test_track_view_invalid_product(self):
        """Test view tracking with invalid product ID"""
        response = self.session.post(
            f"{BASE_URL}/api/analytics/track-view?product_id=invalid-product-id&source=direct&session_id=test"
        )
        
        assert response.status_code == 404, f"Expected 404 for invalid product, got {response.status_code}"
        print("✓ View tracking returns 404 for invalid product")


class TestCartAddTracking:
    """Test cart add tracking"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_auth_token(self, email, password):
        """Helper to get auth token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    
    def get_a_product_id(self):
        """Get a product ID for testing"""
        response = self.session.get(f"{BASE_URL}/api/products?limit=1")
        if response.status_code == 200 and response.json():
            return response.json()[0].get("id")
        return None
    
    def test_cart_add_tracking_requires_auth(self):
        """Test that cart add tracking requires authentication"""
        product_id = self.get_a_product_id()
        if not product_id:
            pytest.skip("No products available for testing")
        
        response = self.session.post(
            f"{BASE_URL}/api/analytics/track-cart-add?product_id={product_id}"
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Cart add tracking requires authentication")
    
    def test_cart_add_tracking_with_auth(self):
        """Test cart add tracking with authentication"""
        product_id = self.get_a_product_id()
        if not product_id:
            pytest.skip("No products available for testing")
        
        token = self.get_auth_token(VENDOR_STARTER_EMAIL, VENDOR_STARTER_PASSWORD)
        assert token, "Failed to login"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        session_id = str(uuid.uuid4())
        response = self.session.post(
            f"{BASE_URL}/api/analytics/track-cart-add?product_id={product_id}&session_id={session_id}"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"Expected success=true, got {data}"
        print(f"✓ Cart add tracking works with authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
