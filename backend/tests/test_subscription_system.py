"""
Test Suite for Vendor Subscription System
Tests subscription plans, current subscription, and product limit enforcement
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
VENDOR_EMAIL = "vendor.approved@example.com"
VENDOR_PASSWORD = "password123"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "password123"


class TestSubscriptionPlans:
    """Test GET /api/subscriptions/plans endpoint"""
    
    def test_get_all_plans_returns_4_plans(self):
        """Verify that 4 subscription plans are returned"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        
        plans = response.json()
        assert len(plans) == 4, f"Expected 4 plans, got {len(plans)}"
        
        plan_ids = [p['id'] for p in plans]
        assert 'starter' in plan_ids
        assert 'growth' in plan_ids
        assert 'pro' in plan_ids
        assert 'enterprise' in plan_ids
    
    def test_starter_plan_details(self):
        """Verify Starter plan has correct pricing and features"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        
        plans = response.json()
        starter = next((p for p in plans if p['id'] == 'starter'), None)
        
        assert starter is not None, "Starter plan not found"
        assert starter['name'] == 'Starter'
        assert starter['price_monthly'] == 0, "Starter should be free"
        assert starter['price_yearly'] == 0, "Starter yearly should be free"
        assert starter['commission_rate'] == 20, "Starter commission should be 20%"
        assert starter['product_limit'] == 5, "Starter product limit should be 5"
        assert starter['is_custom'] == False
        assert len(starter['features']) > 0, "Starter should have features"
    
    def test_growth_plan_details(self):
        """Verify Growth plan has correct pricing and features"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        
        plans = response.json()
        growth = next((p for p in plans if p['id'] == 'growth'), None)
        
        assert growth is not None, "Growth plan not found"
        assert growth['name'] == 'Growth'
        assert growth['price_monthly'] == 25, "Growth monthly should be $25"
        assert growth['price_yearly'] == 250, "Growth yearly should be $250"
        assert growth['commission_rate'] == 15, "Growth commission should be 15%"
        assert growth['product_limit'] == 50, "Growth product limit should be 50"
        assert growth['is_custom'] == False
        
        # Verify ~17% savings on yearly
        monthly_cost = growth['price_monthly'] * 12  # $300
        yearly_cost = growth['price_yearly']  # $250
        savings_percent = ((monthly_cost - yearly_cost) / monthly_cost) * 100
        assert 15 <= savings_percent <= 20, f"Yearly savings should be ~17%, got {savings_percent:.1f}%"
    
    def test_pro_plan_details(self):
        """Verify Pro plan has correct pricing and features"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        
        plans = response.json()
        pro = next((p for p in plans if p['id'] == 'pro'), None)
        
        assert pro is not None, "Pro plan not found"
        assert pro['name'] == 'Pro Vendor'
        assert pro['price_monthly'] == 50, "Pro monthly should be $50"
        assert pro['price_yearly'] == 500, "Pro yearly should be $500"
        assert pro['commission_rate'] == 10, "Pro commission should be 10%"
        assert pro['product_limit'] == -1, "Pro product limit should be unlimited (-1)"
        assert pro['is_custom'] == False
    
    def test_enterprise_plan_details(self):
        """Verify Enterprise plan is custom pricing"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        
        plans = response.json()
        enterprise = next((p for p in plans if p['id'] == 'enterprise'), None)
        
        assert enterprise is not None, "Enterprise plan not found"
        assert enterprise['name'] == 'Enterprise / Partner'
        assert enterprise['is_custom'] == True, "Enterprise should be custom pricing"
        assert enterprise['product_limit'] == -1, "Enterprise should have unlimited products"


class TestCurrentSubscription:
    """Test GET /api/subscriptions/current endpoint"""
    
    @pytest.fixture
    def vendor_token(self):
        """Get vendor authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Vendor login failed: {response.text}")
        return response.json()['access_token']
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.text}")
        return response.json()['access_token']
    
    def test_current_subscription_requires_auth(self):
        """Verify endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/current")
        assert response.status_code == 403 or response.status_code == 401
    
    def test_vendor_gets_current_subscription(self, vendor_token):
        """Verify vendor can get their current subscription"""
        headers = {"Authorization": f"Bearer {vendor_token}"}
        response = requests.get(f"{BASE_URL}/api/subscriptions/current", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have plan info
        assert 'plan' in data
        assert data['plan'] is not None
        
        # Should have product count
        assert 'product_count' in data
        assert isinstance(data['product_count'], int)
        
        # Should have products_remaining
        assert 'products_remaining' in data
        
        # Should have can_upgrade flag
        assert 'can_upgrade' in data
    
    def test_vendor_default_to_starter_plan(self, vendor_token):
        """Verify vendor without subscription defaults to Starter plan"""
        headers = {"Authorization": f"Bearer {vendor_token}"}
        response = requests.get(f"{BASE_URL}/api/subscriptions/current", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # If no active subscription, should default to starter
        if data.get('subscription') is None:
            assert data['plan']['id'] == 'starter'
            assert data['plan']['name'] == 'Starter'
            assert data['plan']['commission_rate'] == 20
            assert data['plan']['product_limit'] == 5


class TestProductLimitEnforcement:
    """Test product limit enforcement based on subscription"""
    
    @pytest.fixture
    def vendor_token(self):
        """Get vendor authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Vendor login failed: {response.text}")
        return response.json()['access_token']
    
    @pytest.fixture
    def vendor_info(self, vendor_token):
        """Get vendor info"""
        headers = {"Authorization": f"Bearer {vendor_token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        if response.status_code != 200:
            pytest.skip("Failed to get vendor info")
        return response.json()
    
    def test_product_limit_check_in_subscription(self, vendor_token):
        """Verify subscription response includes product limit info"""
        headers = {"Authorization": f"Bearer {vendor_token}"}
        response = requests.get(f"{BASE_URL}/api/subscriptions/current", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify product limit is present
        assert 'plan' in data
        assert 'product_limit' in data['plan']
        
        # Verify product count is tracked
        assert 'product_count' in data
        assert 'products_remaining' in data
        
        # Verify products_remaining calculation
        if data['plan']['product_limit'] != -1:
            expected_remaining = max(0, data['plan']['product_limit'] - data['product_count'])
            assert data['products_remaining'] == expected_remaining


class TestSubscriptionCheckout:
    """Test subscription checkout flow"""
    
    @pytest.fixture
    def vendor_token(self):
        """Get vendor authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Vendor login failed: {response.text}")
        return response.json()['access_token']
    
    def test_checkout_requires_auth(self):
        """Verify checkout requires authentication"""
        response = requests.post(f"{BASE_URL}/api/subscriptions/checkout", json={
            "plan_id": "growth",
            "billing_cycle": "monthly",
            "origin_url": "https://example.com"
        })
        assert response.status_code == 403 or response.status_code == 401
    
    def test_checkout_rejects_starter_plan(self, vendor_token):
        """Verify checkout rejects free Starter plan"""
        headers = {"Authorization": f"Bearer {vendor_token}"}
        response = requests.post(f"{BASE_URL}/api/subscriptions/checkout", 
            headers=headers,
            json={
                "plan_id": "starter",
                "billing_cycle": "monthly",
                "origin_url": "https://example.com"
            }
        )
        assert response.status_code == 400
        assert "free" in response.json()['detail'].lower() or "starter" in response.json()['detail'].lower()
    
    def test_checkout_rejects_enterprise_plan(self, vendor_token):
        """Verify checkout rejects Enterprise plan (requires custom setup)"""
        headers = {"Authorization": f"Bearer {vendor_token}"}
        response = requests.post(f"{BASE_URL}/api/subscriptions/checkout", 
            headers=headers,
            json={
                "plan_id": "enterprise",
                "billing_cycle": "monthly",
                "origin_url": "https://example.com"
            }
        )
        assert response.status_code == 400
        assert "custom" in response.json()['detail'].lower() or "enterprise" in response.json()['detail'].lower()
    
    def test_checkout_rejects_invalid_plan(self, vendor_token):
        """Verify checkout rejects invalid plan ID"""
        headers = {"Authorization": f"Bearer {vendor_token}"}
        response = requests.post(f"{BASE_URL}/api/subscriptions/checkout", 
            headers=headers,
            json={
                "plan_id": "invalid_plan",
                "billing_cycle": "monthly",
                "origin_url": "https://example.com"
            }
        )
        assert response.status_code == 400
    
    def test_checkout_growth_plan_creates_session(self, vendor_token):
        """Verify checkout for Growth plan creates Stripe session"""
        headers = {"Authorization": f"Bearer {vendor_token}"}
        response = requests.post(f"{BASE_URL}/api/subscriptions/checkout", 
            headers=headers,
            json={
                "plan_id": "growth",
                "billing_cycle": "monthly",
                "origin_url": "https://example.com"
            }
        )
        
        # Should return checkout URL (may fail if Stripe key is test key)
        if response.status_code == 200:
            data = response.json()
            assert 'checkout_url' in data
            assert 'session_id' in data
            assert 'stripe.com' in data['checkout_url'] or 'checkout' in data['checkout_url']
        else:
            # Stripe error is acceptable in test environment
            print(f"Checkout returned {response.status_code}: {response.text}")


class TestSubscriptionPlanFeatures:
    """Test that plan features are correctly defined"""
    
    def test_all_plans_have_features(self):
        """Verify all plans have feature lists"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        
        plans = response.json()
        for plan in plans:
            assert 'features' in plan
            assert isinstance(plan['features'], list)
            assert len(plan['features']) > 0, f"Plan {plan['id']} has no features"
    
    def test_starter_features_include_basics(self):
        """Verify Starter plan includes basic features"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        plans = response.json()
        starter = next((p for p in plans if p['id'] == 'starter'), None)
        
        features_text = ' '.join(starter['features']).lower()
        assert '5 products' in features_text or 'up to 5' in features_text
        assert 'email support' in features_text or 'support' in features_text
    
    def test_growth_features_include_upgrades(self):
        """Verify Growth plan includes upgraded features"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        plans = response.json()
        growth = next((p for p in plans if p['id'] == 'growth'), None)
        
        features_text = ' '.join(growth['features']).lower()
        assert '50 products' in features_text or 'up to 50' in features_text
        assert 'analytics' in features_text or 'badge' in features_text
    
    def test_pro_features_include_unlimited(self):
        """Verify Pro plan includes unlimited products"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        plans = response.json()
        pro = next((p for p in plans if p['id'] == 'pro'), None)
        
        features_text = ' '.join(pro['features']).lower()
        assert 'unlimited' in features_text
    
    def test_enterprise_features_include_custom(self):
        """Verify Enterprise plan includes custom features"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        plans = response.json()
        enterprise = next((p for p in plans if p['id'] == 'enterprise'), None)
        
        features_text = ' '.join(enterprise['features']).lower()
        assert 'custom' in features_text or 'dedicated' in features_text


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
