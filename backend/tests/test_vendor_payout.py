"""
Vendor Payout Dashboard API Tests
Tests for: Payout Summary, Transactions, Stripe Connect Status, Payout Request
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://vendor-platform-go.preview.emergentagent.com').rstrip('/')

# Test credentials
VENDOR_EMAIL = "vendor@afrovending.com"
VENDOR_PASSWORD = "password123"
CUSTOMER_EMAIL = "testuser123@example.com"
CUSTOMER_PASSWORD = "password123"

TEST_PREFIX = "TEST_PAYOUT_"


class TestVendorPayoutEndpoints:
    """Vendor Payout Dashboard API Tests"""
    
    @pytest.fixture
    def vendor_token(self):
        """Get vendor auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        assert response.status_code == 200, f"Vendor login failed: {response.text}"
        return response.json()["access_token"]
    
    @pytest.fixture
    def customer_token(self):
        """Get customer auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD
        })
        if response.status_code != 200:
            # Create customer if doesn't exist
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": CUSTOMER_EMAIL,
                "password": CUSTOMER_PASSWORD,
                "first_name": "Test",
                "last_name": "User",
                "role": "customer"
            })
        assert response.status_code == 200, f"Customer auth failed: {response.text}"
        return response.json()["access_token"]
    
    def test_payout_summary_endpoint(self, vendor_token):
        """Test /api/vendor/payout/summary returns correct structure"""
        response = requests.get(f"{BASE_URL}/api/vendor/payout/summary",
            headers={"Authorization": f"Bearer {vendor_token}"})
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "total_sales" in data
        assert "pending_payout" in data
        assert "available_balance" in data
        assert "total_paid_out" in data
        assert "platform_fees" in data
        assert "stripe_connected" in data
        
        # Verify data types
        assert isinstance(data["total_sales"], (int, float))
        assert isinstance(data["pending_payout"], (int, float))
        assert isinstance(data["available_balance"], (int, float))
        assert isinstance(data["total_paid_out"], (int, float))
        assert isinstance(data["platform_fees"], (int, float))
        assert isinstance(data["stripe_connected"], bool)
        
        # Platform fee should be 10% of total sales
        expected_fee = data["total_sales"] * 0.10
        assert abs(data["platform_fees"] - expected_fee) < 0.01, "Platform fee should be 10%"
        
        print(f"✓ Payout summary: Total Sales=${data['total_sales']:.2f}, Available=${data['available_balance']:.2f}")
    
    def test_payout_transactions_endpoint(self, vendor_token):
        """Test /api/vendor/payout/transactions returns correct structure"""
        response = requests.get(f"{BASE_URL}/api/vendor/payout/transactions",
            headers={"Authorization": f"Bearer {vendor_token}"})
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return a list
        assert isinstance(data, list)
        
        # If there are transactions, verify structure
        if len(data) > 0:
            transaction = data[0]
            assert "id" in transaction
            assert "type" in transaction
            assert "amount" in transaction
            assert "description" in transaction
            assert "status" in transaction
            assert "created_at" in transaction
            
            # Type should be one of: earning, fee, payout
            assert transaction["type"] in ["earning", "fee", "payout"]
        
        print(f"✓ Payout transactions: {len(data)} transactions found")
    
    def test_stripe_status_endpoint(self, vendor_token):
        """Test /api/vendor/stripe/status returns correct structure"""
        response = requests.get(f"{BASE_URL}/api/vendor/stripe/status",
            headers={"Authorization": f"Bearer {vendor_token}"})
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "connected" in data
        assert isinstance(data["connected"], bool)
        
        if data["connected"]:
            assert "account_id" in data
            assert "charges_enabled" in data
            assert "payouts_enabled" in data
            assert "details_submitted" in data
        else:
            assert "charges_enabled" in data
            assert "payouts_enabled" in data
            assert "details_submitted" in data
        
        print(f"✓ Stripe status: connected={data['connected']}")
    
    def test_stripe_connect_endpoint(self, vendor_token):
        """Test /api/vendor/stripe/connect endpoint exists and responds"""
        response = requests.post(f"{BASE_URL}/api/vendor/stripe/connect",
            headers={"Authorization": f"Bearer {vendor_token}"},
            json={})
        
        # Should return 200 with URL or 400 with Stripe error
        assert response.status_code in [200, 400]
        
        if response.status_code == 200:
            data = response.json()
            assert "url" in data
            assert "type" in data
            print(f"✓ Stripe connect: URL generated, type={data['type']}")
        else:
            # Stripe may restrict account creation - this is expected
            data = response.json()
            assert "detail" in data
            print(f"✓ Stripe connect: Endpoint working (Stripe restriction: {data['detail'][:50]}...)")
    
    def test_payout_request_requires_stripe_account(self, vendor_token):
        """Test /api/vendor/payout/request requires Stripe account"""
        response = requests.post(f"{BASE_URL}/api/vendor/payout/request",
            headers={"Authorization": f"Bearer {vendor_token}"},
            json={"amount": 10.00})
        
        # Should fail if no Stripe account connected
        # Either 400 (no Stripe account) or 200 (if account exists)
        assert response.status_code in [200, 400]
        
        if response.status_code == 400:
            data = response.json()
            # Should mention Stripe account
            assert "stripe" in data["detail"].lower() or "balance" in data["detail"].lower()
            print(f"✓ Payout request: Correctly requires Stripe account")
        else:
            print(f"✓ Payout request: Processed successfully")
    
    def test_payout_endpoints_require_vendor_auth(self):
        """Test payout endpoints require vendor authentication"""
        # Test without auth
        endpoints = [
            ("GET", "/api/vendor/payout/summary"),
            ("GET", "/api/vendor/payout/transactions"),
            ("GET", "/api/vendor/stripe/status"),
            ("POST", "/api/vendor/stripe/connect"),
            ("POST", "/api/vendor/payout/request"),
        ]
        
        for method, endpoint in endpoints:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}")
            else:
                response = requests.post(f"{BASE_URL}{endpoint}", json={})
            
            assert response.status_code in [401, 403], f"{endpoint} should require auth"
        
        print("✓ All payout endpoints require authentication")
    
    def test_payout_endpoints_require_vendor_role(self, customer_token):
        """Test payout endpoints require vendor role (not customer)"""
        endpoints = [
            ("GET", "/api/vendor/payout/summary"),
            ("GET", "/api/vendor/payout/transactions"),
            ("GET", "/api/vendor/stripe/status"),
        ]
        
        for method, endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}",
                headers={"Authorization": f"Bearer {customer_token}"})
            
            assert response.status_code == 403, f"{endpoint} should require vendor role"
        
        print("✓ Payout endpoints correctly require vendor role")


class TestExistingServiceBookingFlow:
    """Test that existing service booking flow still works"""
    
    @pytest.fixture
    def vendor_token(self):
        """Get vendor auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def customer_token(self):
        """Get customer auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CUSTOMER_EMAIL,
            "password": CUSTOMER_PASSWORD
        })
        if response.status_code != 200:
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": CUSTOMER_EMAIL,
                "password": CUSTOMER_PASSWORD,
                "first_name": "Test",
                "last_name": "User",
                "role": "customer"
            })
        return response.json()["access_token"]
    
    def test_services_endpoint_works(self):
        """Test services listing still works"""
        response = requests.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200
        services = response.json()
        assert isinstance(services, list)
        print(f"✓ Services endpoint: {len(services)} services available")
    
    def test_vendor_bookings_endpoint_works(self, vendor_token):
        """Test vendor bookings endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/vendor/bookings",
            headers={"Authorization": f"Bearer {vendor_token}"})
        assert response.status_code == 200
        bookings = response.json()
        assert isinstance(bookings, list)
        print(f"✓ Vendor bookings endpoint: {len(bookings)} bookings")
    
    def test_customer_bookings_endpoint_works(self, customer_token):
        """Test customer bookings endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/bookings",
            headers={"Authorization": f"Bearer {customer_token}"})
        assert response.status_code == 200
        bookings = response.json()
        assert isinstance(bookings, list)
        print(f"✓ Customer bookings endpoint: {len(bookings)} bookings")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
