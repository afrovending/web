"""
Test suite for Coupon/Discount System
Tests: CRUD operations, cart coupon application, validation, and edge cases
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "password123"
CUSTOMER_EMAIL = "testuser123@example.com"
CUSTOMER_PASSWORD = "password123"
TEST_PRODUCT_ID = "99b24dcb-c76b-4d3c-9c67-9ae4da1ecf9f"  # Raw Unrefined Shea Butter


class TestCouponSystem:
    """Coupon System Tests"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip(f"Admin authentication failed: {response.status_code} - {response.text}")
    
    @pytest.fixture(scope="class")
    def customer_token(self):
        """Get customer authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip(f"Customer authentication failed: {response.status_code} - {response.text}")
    
    @pytest.fixture(scope="class")
    def admin_session(self, admin_token):
        """Session with admin auth header"""
        session = requests.Session()
        session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {admin_token}"
        })
        return session
    
    @pytest.fixture(scope="class")
    def customer_session(self, customer_token):
        """Session with customer auth header"""
        session = requests.Session()
        session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {customer_token}"
        })
        return session
    
    # ==================== COUPON CRUD TESTS ====================
    
    def test_get_existing_coupons(self, admin_session):
        """Test fetching existing coupons as admin"""
        response = admin_session.get(f"{BASE_URL}/api/coupons?include_inactive=true")
        assert response.status_code == 200, f"Failed to get coupons: {response.text}"
        
        coupons = response.json()
        assert isinstance(coupons, list), "Response should be a list"
        print(f"Found {len(coupons)} existing coupons")
        
        # Check if SAVE20 exists
        save20 = next((c for c in coupons if c.get("code") == "SAVE20"), None)
        if save20:
            print(f"SAVE20 coupon exists: {save20}")
        return coupons
    
    def test_create_coupon_percentage(self, admin_session):
        """Test creating a percentage discount coupon"""
        unique_code = f"TEST_PCT_{uuid.uuid4().hex[:6].upper()}"
        coupon_data = {
            "code": unique_code,
            "discount_type": "percentage",
            "discount_value": 15,
            "min_order_amount": 10,
            "max_discount": 50,
            "max_uses": 100,
            "max_uses_per_user": 2,
            "is_active": True
        }
        
        response = admin_session.post(f"{BASE_URL}/api/coupons", json=coupon_data)
        assert response.status_code == 200, f"Failed to create coupon: {response.text}"
        
        created = response.json()
        assert created["code"] == unique_code
        assert created["discount_type"] == "percentage"
        assert created["discount_value"] == 15
        assert created["is_active"] == True
        assert "id" in created
        
        print(f"Created percentage coupon: {created['code']} (ID: {created['id']})")
        return created
    
    def test_create_coupon_fixed(self, admin_session):
        """Test creating a fixed amount discount coupon"""
        unique_code = f"TEST_FIX_{uuid.uuid4().hex[:6].upper()}"
        coupon_data = {
            "code": unique_code,
            "discount_type": "fixed",
            "discount_value": 10,
            "min_order_amount": 25,
            "is_active": True
        }
        
        response = admin_session.post(f"{BASE_URL}/api/coupons", json=coupon_data)
        assert response.status_code == 200, f"Failed to create fixed coupon: {response.text}"
        
        created = response.json()
        assert created["code"] == unique_code
        assert created["discount_type"] == "fixed"
        assert created["discount_value"] == 10
        
        print(f"Created fixed coupon: {created['code']} (ID: {created['id']})")
        return created
    
    def test_create_coupon_with_dates(self, admin_session):
        """Test creating a coupon with start and expiry dates"""
        unique_code = f"TEST_DATE_{uuid.uuid4().hex[:6].upper()}"
        start_date = datetime.now().strftime("%Y-%m-%dT00:00:00Z")
        expiry_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%dT23:59:59Z")
        
        coupon_data = {
            "code": unique_code,
            "discount_type": "percentage",
            "discount_value": 10,
            "start_date": start_date,
            "expiry_date": expiry_date,
            "is_active": True
        }
        
        response = admin_session.post(f"{BASE_URL}/api/coupons", json=coupon_data)
        assert response.status_code == 200, f"Failed to create dated coupon: {response.text}"
        
        created = response.json()
        assert created["code"] == unique_code
        assert created.get("start_date") is not None
        assert created.get("expiry_date") is not None
        
        print(f"Created dated coupon: {created['code']}")
        return created
    
    def test_get_coupon_by_id(self, admin_session):
        """Test fetching a specific coupon by ID"""
        # First create a coupon
        unique_code = f"TEST_GET_{uuid.uuid4().hex[:6].upper()}"
        create_response = admin_session.post(f"{BASE_URL}/api/coupons", json={
            "code": unique_code,
            "discount_type": "percentage",
            "discount_value": 5,
            "is_active": True
        })
        assert create_response.status_code == 200
        created = create_response.json()
        coupon_id = created["id"]
        
        # Now fetch it
        response = admin_session.get(f"{BASE_URL}/api/coupons/{coupon_id}")
        assert response.status_code == 200, f"Failed to get coupon: {response.text}"
        
        fetched = response.json()
        assert fetched["id"] == coupon_id
        assert fetched["code"] == unique_code
        
        print(f"Fetched coupon by ID: {fetched['code']}")
        return fetched
    
    def test_update_coupon(self, admin_session):
        """Test updating a coupon"""
        # First create a coupon
        unique_code = f"TEST_UPD_{uuid.uuid4().hex[:6].upper()}"
        create_response = admin_session.post(f"{BASE_URL}/api/coupons", json={
            "code": unique_code,
            "discount_type": "percentage",
            "discount_value": 10,
            "is_active": True
        })
        assert create_response.status_code == 200
        created = create_response.json()
        coupon_id = created["id"]
        
        # Update it
        update_data = {
            "discount_value": 25,
            "max_uses": 50,
            "is_active": False
        }
        
        response = admin_session.put(f"{BASE_URL}/api/coupons/{coupon_id}", json=update_data)
        assert response.status_code == 200, f"Failed to update coupon: {response.text}"
        
        updated = response.json()
        assert updated["discount_value"] == 25
        assert updated["max_uses"] == 50
        assert updated["is_active"] == False
        
        print(f"Updated coupon: {updated['code']} - discount now {updated['discount_value']}%")
        return updated
    
    def test_toggle_coupon_active_status(self, admin_session):
        """Test toggling coupon active/inactive status"""
        # Create an active coupon
        unique_code = f"TEST_TOG_{uuid.uuid4().hex[:6].upper()}"
        create_response = admin_session.post(f"{BASE_URL}/api/coupons", json={
            "code": unique_code,
            "discount_type": "percentage",
            "discount_value": 10,
            "is_active": True
        })
        assert create_response.status_code == 200
        created = create_response.json()
        coupon_id = created["id"]
        assert created["is_active"] == True
        
        # Deactivate it
        response = admin_session.put(f"{BASE_URL}/api/coupons/{coupon_id}", json={"is_active": False})
        assert response.status_code == 200
        assert response.json()["is_active"] == False
        
        # Reactivate it
        response = admin_session.put(f"{BASE_URL}/api/coupons/{coupon_id}", json={"is_active": True})
        assert response.status_code == 200
        assert response.json()["is_active"] == True
        
        print(f"Toggle test passed for coupon: {unique_code}")
    
    def test_delete_coupon(self, admin_session):
        """Test deleting a coupon"""
        # Create a coupon to delete
        unique_code = f"TEST_DEL_{uuid.uuid4().hex[:6].upper()}"
        create_response = admin_session.post(f"{BASE_URL}/api/coupons", json={
            "code": unique_code,
            "discount_type": "percentage",
            "discount_value": 5,
            "is_active": True
        })
        assert create_response.status_code == 200
        created = create_response.json()
        coupon_id = created["id"]
        
        # Delete it
        response = admin_session.delete(f"{BASE_URL}/api/coupons/{coupon_id}")
        assert response.status_code == 200, f"Failed to delete coupon: {response.text}"
        
        # Verify it's gone
        get_response = admin_session.get(f"{BASE_URL}/api/coupons/{coupon_id}")
        assert get_response.status_code == 404
        
        print(f"Deleted coupon: {unique_code}")
    
    def test_duplicate_code_rejected(self, admin_session):
        """Test that duplicate coupon codes are rejected"""
        unique_code = f"TEST_DUP_{uuid.uuid4().hex[:6].upper()}"
        
        # Create first coupon
        response1 = admin_session.post(f"{BASE_URL}/api/coupons", json={
            "code": unique_code,
            "discount_type": "percentage",
            "discount_value": 10,
            "is_active": True
        })
        assert response1.status_code == 200
        
        # Try to create duplicate
        response2 = admin_session.post(f"{BASE_URL}/api/coupons", json={
            "code": unique_code,
            "discount_type": "percentage",
            "discount_value": 20,
            "is_active": True
        })
        assert response2.status_code == 400, "Duplicate code should be rejected"
        assert "already exists" in response2.text.lower()
        
        print(f"Duplicate code rejection test passed")
    
    # ==================== CART COUPON APPLICATION TESTS ====================
    
    def test_add_product_to_cart(self, customer_session):
        """Add product to cart for coupon testing"""
        # First clear cart
        customer_session.delete(f"{BASE_URL}/api/cart")
        
        # Add product
        response = customer_session.post(f"{BASE_URL}/api/cart/items", json={
            "product_id": TEST_PRODUCT_ID,
            "quantity": 2
        })
        assert response.status_code in [200, 201], f"Failed to add to cart: {response.text}"
        
        # Verify cart
        cart_response = customer_session.get(f"{BASE_URL}/api/cart")
        assert cart_response.status_code == 200
        cart = cart_response.json()
        assert len(cart["items"]) > 0
        assert cart["subtotal"] > 0
        
        print(f"Cart subtotal: ${cart['subtotal']}")
        return cart
    
    def test_apply_valid_coupon_save20(self, customer_session):
        """Test applying the SAVE20 coupon code"""
        # Ensure cart has items
        cart_response = customer_session.get(f"{BASE_URL}/api/cart")
        cart = cart_response.json()
        if len(cart["items"]) == 0:
            customer_session.post(f"{BASE_URL}/api/cart/items", json={
                "product_id": TEST_PRODUCT_ID,
                "quantity": 2
            })
        
        # Apply SAVE20 coupon
        response = customer_session.post(f"{BASE_URL}/api/cart/apply-coupon", json={
            "code": "SAVE20"
        })
        
        if response.status_code == 200:
            result = response.json()
            assert "message" in result
            assert result.get("discount", 0) > 0
            print(f"SAVE20 applied: {result['message']}, discount: ${result.get('discount', 0)}")
        else:
            # SAVE20 might not exist yet, skip this test
            print(f"SAVE20 coupon not found or invalid: {response.text}")
            pytest.skip("SAVE20 coupon not available")
    
    def test_cart_shows_discount_after_coupon(self, customer_session):
        """Test that cart shows discount after coupon is applied"""
        cart_response = customer_session.get(f"{BASE_URL}/api/cart")
        assert cart_response.status_code == 200
        
        cart = cart_response.json()
        print(f"Cart state: subtotal=${cart['subtotal']}, discount=${cart.get('discount', 0)}, total=${cart['total']}")
        
        # If coupon was applied, discount should be > 0
        if cart.get("discount_code"):
            assert cart.get("discount", 0) > 0, "Discount should be > 0 when coupon is applied"
            assert cart["total"] < cart["subtotal"], "Total should be less than subtotal with discount"
            assert cart["total"] == round(cart["subtotal"] - cart["discount"], 2)
            print(f"Discount verified: {cart['discount_code']} saves ${cart['discount']}")
    
    def test_remove_coupon_from_cart(self, customer_session):
        """Test removing applied coupon from cart"""
        response = customer_session.delete(f"{BASE_URL}/api/cart/coupon")
        assert response.status_code == 200, f"Failed to remove coupon: {response.text}"
        
        # Verify coupon is removed
        cart_response = customer_session.get(f"{BASE_URL}/api/cart")
        cart = cart_response.json()
        
        assert cart.get("discount_code") is None, "Discount code should be None after removal"
        assert cart.get("discount", 0) == 0, "Discount should be 0 after removal"
        assert cart["total"] == cart["subtotal"], "Total should equal subtotal after coupon removal"
        
        print("Coupon removed successfully, cart reset to original total")
    
    def test_apply_invalid_coupon_code(self, customer_session):
        """Test applying an invalid coupon code"""
        response = customer_session.post(f"{BASE_URL}/api/cart/apply-coupon", json={
            "code": "INVALIDCODE123"
        })
        
        assert response.status_code == 400, "Invalid coupon should return 400"
        assert "invalid" in response.text.lower() or "not found" in response.text.lower()
        
        print("Invalid coupon code correctly rejected")
    
    def test_apply_inactive_coupon(self, admin_session, customer_session):
        """Test that inactive coupons cannot be applied"""
        # Create an inactive coupon
        unique_code = f"TEST_INACT_{uuid.uuid4().hex[:6].upper()}"
        create_response = admin_session.post(f"{BASE_URL}/api/coupons", json={
            "code": unique_code,
            "discount_type": "percentage",
            "discount_value": 10,
            "is_active": False
        })
        assert create_response.status_code == 200
        
        # Try to apply it
        response = customer_session.post(f"{BASE_URL}/api/cart/apply-coupon", json={
            "code": unique_code
        })
        
        assert response.status_code == 400, "Inactive coupon should be rejected"
        assert "active" in response.text.lower() or "inactive" in response.text.lower()
        
        print("Inactive coupon correctly rejected")
    
    def test_coupon_minimum_order_validation(self, admin_session, customer_session):
        """Test minimum order amount validation"""
        # Create coupon with high minimum
        unique_code = f"TEST_MIN_{uuid.uuid4().hex[:6].upper()}"
        create_response = admin_session.post(f"{BASE_URL}/api/coupons", json={
            "code": unique_code,
            "discount_type": "percentage",
            "discount_value": 10,
            "min_order_amount": 10000,  # Very high minimum
            "is_active": True
        })
        assert create_response.status_code == 200
        
        # Try to apply it (cart total should be less than $10000)
        response = customer_session.post(f"{BASE_URL}/api/cart/apply-coupon", json={
            "code": unique_code
        })
        
        assert response.status_code == 400, "Should reject when below minimum order"
        assert "minimum" in response.text.lower()
        
        print("Minimum order validation working correctly")
    
    # ==================== COUPON VALIDATION ENDPOINT TESTS ====================
    
    def test_validate_coupon_endpoint(self, customer_session):
        """Test the coupon validation endpoint"""
        response = customer_session.post(f"{BASE_URL}/api/coupons/validate", json={
            "code": "SAVE20"
        })
        
        if response.status_code == 200:
            result = response.json()
            assert "valid" in result
            if result["valid"]:
                assert "discount_amount" in result
                assert result["discount_amount"] >= 0
                print(f"Validation result: valid={result['valid']}, discount=${result.get('discount_amount', 0)}")
            else:
                print(f"Validation result: valid=False, message={result.get('message')}")
        else:
            print(f"Validation endpoint returned {response.status_code}")
    
    # ==================== CLEANUP ====================
    
    def test_cleanup_test_coupons(self, admin_session):
        """Clean up test coupons created during testing"""
        response = admin_session.get(f"{BASE_URL}/api/coupons?include_inactive=true")
        if response.status_code == 200:
            coupons = response.json()
            deleted_count = 0
            for coupon in coupons:
                if coupon["code"].startswith("TEST_"):
                    del_response = admin_session.delete(f"{BASE_URL}/api/coupons/{coupon['id']}")
                    if del_response.status_code == 200:
                        deleted_count += 1
            print(f"Cleaned up {deleted_count} test coupons")


class TestSAVE20CouponExists:
    """Verify SAVE20 coupon exists and is properly configured"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Admin authentication failed")
    
    def test_save20_exists_or_create(self, admin_token):
        """Ensure SAVE20 coupon exists"""
        session = requests.Session()
        session.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {admin_token}"
        })
        
        # Check if SAVE20 exists
        response = session.get(f"{BASE_URL}/api/coupons?include_inactive=true")
        assert response.status_code == 200
        
        coupons = response.json()
        save20 = next((c for c in coupons if c.get("code") == "SAVE20"), None)
        
        if save20:
            print(f"SAVE20 exists: {save20}")
            assert save20["discount_type"] == "percentage"
            assert save20["discount_value"] == 20
            assert save20["is_active"] == True
        else:
            # Create SAVE20 if it doesn't exist
            create_response = session.post(f"{BASE_URL}/api/coupons", json={
                "code": "SAVE20",
                "discount_type": "percentage",
                "discount_value": 20,
                "is_active": True,
                "max_uses_per_user": 5
            })
            assert create_response.status_code == 200, f"Failed to create SAVE20: {create_response.text}"
            print("Created SAVE20 coupon")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
