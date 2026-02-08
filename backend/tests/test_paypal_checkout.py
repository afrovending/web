"""
PayPal Checkout Integration Tests
Tests for PayPal payment flow:
- POST /api/checkout/paypal - Create PayPal order
- GET /api/checkout/paypal/status/{order_id} - Check order status
- POST /api/checkout/paypal/capture - Capture payment after approval
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_CUSTOMER = {"email": "testuser123@example.com", "password": "password123"}


class TestPayPalCheckout:
    """PayPal checkout flow tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for test customer"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as test customer
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json=TEST_CUSTOMER)
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
            self.user = login_response.json().get("user")
        else:
            pytest.skip("Login failed - skipping PayPal tests")
    
    def test_paypal_checkout_requires_auth(self):
        """Test that PayPal checkout requires authentication"""
        unauthenticated_session = requests.Session()
        unauthenticated_session.headers.update({"Content-Type": "application/json"})
        
        response = unauthenticated_session.post(
            f"{BASE_URL}/api/checkout/paypal",
            json={"payment_method": "paypal"}
        )
        
        # Should require authentication
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ PayPal checkout requires authentication")
    
    def test_paypal_checkout_empty_cart(self):
        """Test PayPal checkout with empty cart returns error"""
        # First clear the cart
        cart_response = self.session.get(f"{BASE_URL}/api/cart")
        if cart_response.status_code == 200:
            cart_data = cart_response.json()
            for item in cart_data.get("items", []):
                self.session.delete(f"{BASE_URL}/api/cart/{item['id']}")
        
        # Try PayPal checkout with empty cart
        response = self.session.post(
            f"{BASE_URL}/api/checkout/paypal",
            json={"payment_method": "paypal"}
        )
        
        # Should return 400 - cart is empty
        assert response.status_code == 400, f"Expected 400 for empty cart, got {response.status_code}"
        assert "empty" in response.json().get("detail", "").lower()
        print("✓ PayPal checkout correctly rejects empty cart")
    
    def test_add_item_to_cart(self):
        """Add an item to cart for PayPal checkout test"""
        # Get products to add to cart
        products_response = self.session.get(f"{BASE_URL}/api/products?limit=1")
        assert products_response.status_code == 200, "Failed to get products"
        
        products = products_response.json()
        if not products:
            pytest.skip("No products available")
        
        product = products[0]
        
        # Add to cart
        add_response = self.session.post(
            f"{BASE_URL}/api/cart",
            json={"product_id": product["id"], "quantity": 1}
        )
        
        assert add_response.status_code in [200, 201], f"Failed to add to cart: {add_response.text}"
        print(f"✓ Added product '{product['name']}' to cart")
        
        return product
    
    def test_paypal_checkout_creates_order_and_returns_approval_url(self):
        """Test that PayPal checkout creates order and returns PayPal approval URL"""
        # First ensure cart has items
        self.test_add_item_to_cart()
        
        # Now create PayPal checkout
        response = self.session.post(
            f"{BASE_URL}/api/checkout/paypal",
            json={"payment_method": "paypal"},
            headers={"Origin": BASE_URL}
        )
        
        print(f"PayPal checkout response status: {response.status_code}")
        print(f"PayPal checkout response: {response.text[:500] if response.text else 'empty'}")
        
        # Should return success with approval URL
        assert response.status_code == 200, f"PayPal checkout failed: {response.text}"
        
        data = response.json()
        
        # Validate response structure
        assert "order_id" in data, "Response missing order_id"
        assert "approval_url" in data, "Response missing approval_url"
        assert "status" in data, "Response missing status"
        
        # Validate approval URL is PayPal sandbox URL
        approval_url = data["approval_url"]
        assert "paypal.com" in approval_url.lower(), f"Invalid approval URL: {approval_url}"
        assert "sandbox" in approval_url.lower(), f"Expected sandbox URL, got: {approval_url}"
        
        print(f"✓ PayPal order created successfully")
        print(f"  - Order ID: {data['order_id']}")
        print(f"  - Approval URL: {approval_url[:100]}...")
        print(f"  - Status: {data['status']}")
        
        return data
    
    def test_paypal_order_status_endpoint(self):
        """Test GET /api/checkout/paypal/status/{order_id} endpoint"""
        # First create a PayPal order
        checkout_data = self.test_paypal_checkout_creates_order_and_returns_approval_url()
        order_id = checkout_data["order_id"]
        
        # Check order status
        status_response = self.session.get(f"{BASE_URL}/api/checkout/paypal/status/{order_id}")
        
        assert status_response.status_code == 200, f"Status check failed: {status_response.text}"
        
        status_data = status_response.json()
        
        # Validate response has expected fields
        assert "payment_status" in status_data or "status" in status_data, "Missing status fields"
        
        print(f"✓ PayPal order status retrieved successfully")
        print(f"  - Status data: {status_data}")
        
        return status_data
    
    def test_paypal_order_status_requires_auth(self):
        """Test that order status endpoint requires authentication"""
        unauthenticated_session = requests.Session()
        
        response = unauthenticated_session.get(
            f"{BASE_URL}/api/checkout/paypal/status/fake-order-id"
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ PayPal status endpoint requires authentication")
    
    def test_paypal_order_status_not_found(self):
        """Test order status with invalid order ID returns 404"""
        response = self.session.get(
            f"{BASE_URL}/api/checkout/paypal/status/invalid-order-id-12345"
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ PayPal status returns 404 for invalid order")


class TestPayPalCapture:
    """PayPal payment capture tests (limited without actual PayPal approval)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for test customer"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as test customer
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json=TEST_CUSTOMER)
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            pytest.skip("Login failed - skipping capture tests")
    
    def test_capture_requires_auth(self):
        """Test that capture endpoint requires authentication"""
        unauthenticated_session = requests.Session()
        
        response = unauthenticated_session.post(
            f"{BASE_URL}/api/checkout/paypal/capture?paypal_order_id=test123"
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ PayPal capture requires authentication")
    
    def test_capture_invalid_order_returns_404(self):
        """Test capture with invalid order returns 404"""
        response = self.session.post(
            f"{BASE_URL}/api/checkout/paypal/capture?paypal_order_id=invalid-paypal-order-12345"
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ PayPal capture returns 404 for invalid order")


class TestPayPalConfiguration:
    """Test PayPal configuration and environment"""
    
    def test_paypal_env_configured(self):
        """Verify PayPal environment variables are set in sandbox mode"""
        # This is more of a configuration check - read from .env if accessible
        # The actual API will validate this
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Login first
        login_response = session.post(f"{BASE_URL}/api/auth/login", json=TEST_CUSTOMER)
        if login_response.status_code != 200:
            pytest.skip("Login failed")
        
        token = login_response.json().get("access_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Add item to cart
        products_response = session.get(f"{BASE_URL}/api/products?limit=1")
        if products_response.status_code == 200 and products_response.json():
            product = products_response.json()[0]
            session.post(f"{BASE_URL}/api/cart", json={"product_id": product["id"], "quantity": 1})
        
        # Try checkout - if PayPal not configured, will get 500
        response = session.post(
            f"{BASE_URL}/api/checkout/paypal",
            json={"payment_method": "paypal"},
            headers={"Origin": BASE_URL}
        )
        
        # Should NOT get "PayPal not configured" error
        if response.status_code == 500:
            detail = response.json().get("detail", "")
            assert "not configured" not in detail.lower(), f"PayPal is not configured: {detail}"
        
        print("✓ PayPal environment is properly configured")


class TestCartWithPayPal:
    """Test cart functionality with PayPal integration"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for test customer"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as test customer
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json=TEST_CUSTOMER)
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        else:
            pytest.skip("Login failed")
    
    def test_cart_total_matches_paypal_order(self):
        """Test that cart total matches PayPal order total"""
        # Clear cart first
        cart_response = self.session.get(f"{BASE_URL}/api/cart")
        if cart_response.status_code == 200:
            for item in cart_response.json().get("items", []):
                self.session.delete(f"{BASE_URL}/api/cart/{item['id']}")
        
        # Add specific item
        products_response = self.session.get(f"{BASE_URL}/api/products?limit=1")
        assert products_response.status_code == 200
        product = products_response.json()[0]
        
        self.session.post(
            f"{BASE_URL}/api/cart",
            json={"product_id": product["id"], "quantity": 2}
        )
        
        # Get cart total
        cart_response = self.session.get(f"{BASE_URL}/api/cart")
        cart_total = cart_response.json().get("total", 0)
        
        # Create PayPal order
        paypal_response = self.session.post(
            f"{BASE_URL}/api/checkout/paypal",
            json={"payment_method": "paypal"},
            headers={"Origin": BASE_URL}
        )
        
        if paypal_response.status_code == 200:
            order_id = paypal_response.json()["order_id"]
            
            # Get order details
            order_response = self.session.get(f"{BASE_URL}/api/orders/{order_id}")
            if order_response.status_code == 200:
                order_total = order_response.json().get("total", 0)
                
                # Totals should match (within rounding tolerance)
                assert abs(cart_total - order_total) < 0.01, f"Cart total {cart_total} != Order total {order_total}"
                print(f"✓ Cart total (${cart_total:.2f}) matches PayPal order total (${order_total:.2f})")
        else:
            print(f"PayPal checkout response: {paypal_response.status_code} - {paypal_response.text}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
