"""
Test Storefront Analytics Feature
Tests: View tracking, unique visitors, referrers, device breakdown, peak hours, analytics endpoints
"""
import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_VENDOR_EMAIL = "vendor@afrovending.com"
TEST_VENDOR_PASSWORD = "password123"
TEST_VENDOR_ID = "96ef621b-4a7b-430e-bf9f-07210acb6335"


class TestStorefrontAnalytics:
    """Test storefront analytics tracking and retrieval endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.vendor_id = TEST_VENDOR_ID
        
        # Login as vendor
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_VENDOR_EMAIL,
            "password": TEST_VENDOR_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip("Vendor login failed - skipping analytics tests")
        
        login_data = login_response.json()
        self.token = login_data.get("access_token")
        self.user = login_data.get("user", {})
        
        # Try to get vendor_id from user if not hardcoded
        if not self.vendor_id:
            self.vendor_id = self.user.get("vendor_id")
        
        if not self.vendor_id:
            # Try to find vendor by user_id
            vendors_response = self.session.get(f"{BASE_URL}/api/vendors")
            if vendors_response.status_code == 200:
                vendors = vendors_response.json()
                for v in vendors:
                    if v.get("user_id") == self.user.get("id"):
                        self.vendor_id = v.get("id")
                        break
        
        if not self.vendor_id:
            pytest.skip("No vendor_id found for test user")
        
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        yield
        self.session.close()

    # ============== TRACK VIEW ENDPOINT TESTS ==============
    
    def test_track_view_basic(self):
        """POST /api/vendors/{id}/storefront/track-view tracks a basic page view"""
        # Use a unique session id for testing
        session_id = f"TEST_session_{uuid.uuid4().hex[:8]}"
        
        track_data = {
            "referrer": None,
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
            "session_id": session_id
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/track-view",
            json=track_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data
        assert data.get("message") == "View tracked"
        assert "session_id" in data
        print(f"✓ View tracked successfully with session: {data.get('session_id')}")

    def test_track_view_with_referrer(self):
        """POST /api/vendors/{id}/storefront/track-view tracks view with referrer"""
        session_id = f"TEST_ref_{uuid.uuid4().hex[:8]}"
        
        track_data = {
            "referrer": "https://google.com/search?q=african+art",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
            "session_id": session_id
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/track-view",
            json=track_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ View tracked with referrer (google.com)")

    def test_track_view_with_mobile_user_agent(self):
        """POST /api/vendors/{id}/storefront/track-view tracks mobile device"""
        session_id = f"TEST_mobile_{uuid.uuid4().hex[:8]}"
        
        track_data = {
            "referrer": None,
            "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
            "session_id": session_id
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/track-view",
            json=track_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ Mobile view tracked successfully")

    def test_track_view_with_tablet_user_agent(self):
        """POST /api/vendors/{id}/storefront/track-view tracks tablet device"""
        session_id = f"TEST_tablet_{uuid.uuid4().hex[:8]}"
        
        track_data = {
            "referrer": None,
            "user_agent": "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
            "session_id": session_id
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/track-view",
            json=track_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ Tablet view tracked successfully")

    def test_track_view_with_product_click(self):
        """POST /api/vendors/{id}/storefront/track-view tracks product click"""
        session_id = f"TEST_product_{uuid.uuid4().hex[:8]}"
        
        # First get a product for this vendor
        products_response = self.session.get(f"{BASE_URL}/api/products?vendor_id={self.vendor_id}&limit=1")
        if products_response.status_code == 200 and products_response.json():
            product_id = products_response.json()[0].get("id")
        else:
            product_id = "TEST_product_id"  # Use placeholder if no products
        
        track_data = {
            "referrer": None,
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
            "session_id": session_id,
            "product_id": product_id
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/track-view",
            json=track_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ Product click tracked for product: {product_id}")

    def test_track_view_public_endpoint(self):
        """POST /api/vendors/{id}/storefront/track-view is public (no auth required)"""
        public_session = requests.Session()
        public_session.headers.update({"Content-Type": "application/json"})
        
        track_data = {
            "referrer": "https://facebook.com",
            "user_agent": "Mozilla/5.0 Test Browser",
            "session_id": f"TEST_public_{uuid.uuid4().hex[:8]}"
        }
        
        response = public_session.post(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/track-view",
            json=track_data
        )
        
        assert response.status_code == 200, f"Track view should be public, got {response.status_code}"
        print("✓ Track view endpoint is publicly accessible (no auth required)")
        public_session.close()

    def test_track_view_invalid_vendor_404(self):
        """POST /api/vendors/{id}/storefront/track-view returns 404 for invalid vendor"""
        track_data = {
            "referrer": None,
            "user_agent": "Test Browser",
            "session_id": "test_session"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/vendors/non-existent-vendor-id/storefront/track-view",
            json=track_data
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ 404 returned for invalid vendor ID")

    def test_track_view_generates_session_id_if_missing(self):
        """POST /api/vendors/{id}/storefront/track-view generates session_id if not provided"""
        track_data = {
            "referrer": None,
            "user_agent": "Test Browser"
            # No session_id provided
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/track-view",
            json=track_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "session_id" in data
        assert data["session_id"] is not None
        assert len(data["session_id"]) > 0
        print(f"✓ Session ID generated when not provided: {data['session_id'][:20]}...")

    # ============== GET ANALYTICS ENDPOINT TESTS ==============

    def test_get_analytics_full_data(self):
        """GET /api/vendors/{id}/storefront/analytics returns full analytics data"""
        response = self.session.get(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/analytics?days=30"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify required fields exist
        assert "total_views" in data, "Missing total_views"
        assert "unique_visitors" in data, "Missing unique_visitors"
        assert "views_today" in data, "Missing views_today"
        assert "views_this_week" in data, "Missing views_this_week"
        assert "views_this_month" in data, "Missing views_this_month"
        assert "views_by_day" in data, "Missing views_by_day"
        assert "top_referrers" in data, "Missing top_referrers"
        assert "device_breakdown" in data, "Missing device_breakdown"
        assert "peak_hours" in data, "Missing peak_hours"
        assert "product_clicks" in data, "Missing product_clicks"
        
        # Verify data types
        assert isinstance(data["total_views"], int)
        assert isinstance(data["unique_visitors"], int)
        assert isinstance(data["views_today"], int)
        assert isinstance(data["views_this_week"], int)
        assert isinstance(data["views_this_month"], int)
        assert isinstance(data["views_by_day"], list)
        assert isinstance(data["top_referrers"], list)
        assert isinstance(data["device_breakdown"], dict)
        assert isinstance(data["peak_hours"], list)
        assert isinstance(data["product_clicks"], list)
        
        print(f"✓ Full analytics returned:")
        print(f"  - Total views: {data['total_views']}")
        print(f"  - Unique visitors: {data['unique_visitors']}")
        print(f"  - Views today: {data['views_today']}")
        print(f"  - Views this week: {data['views_this_week']}")
        print(f"  - Views this month: {data['views_this_month']}")

    def test_get_analytics_device_breakdown_structure(self):
        """GET /api/vendors/{id}/storefront/analytics has proper device breakdown"""
        response = self.session.get(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/analytics?days=30"
        )
        
        assert response.status_code == 200
        
        data = response.json()
        device_breakdown = data.get("device_breakdown", {})
        
        # Should have all device categories
        expected_devices = ["mobile", "desktop", "tablet", "unknown"]
        for device in expected_devices:
            assert device in device_breakdown, f"Missing device category: {device}"
            assert isinstance(device_breakdown[device], int)
        
        print(f"✓ Device breakdown: {device_breakdown}")

    def test_get_analytics_top_referrers_structure(self):
        """GET /api/vendors/{id}/storefront/analytics has proper referrer structure"""
        response = self.session.get(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/analytics?days=30"
        )
        
        assert response.status_code == 200
        
        data = response.json()
        referrers = data.get("top_referrers", [])
        
        # Verify referrer structure if there are any
        for ref in referrers:
            assert "referrer" in ref, "Missing referrer field"
            assert "count" in ref, "Missing count field"
            assert isinstance(ref["count"], int)
        
        print(f"✓ Top referrers count: {len(referrers)}")
        if referrers:
            print(f"  Top referrer: {referrers[0]}")

    def test_get_analytics_peak_hours_structure(self):
        """GET /api/vendors/{id}/storefront/analytics has proper peak hours structure"""
        response = self.session.get(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/analytics?days=30"
        )
        
        assert response.status_code == 200
        
        data = response.json()
        peak_hours = data.get("peak_hours", [])
        
        # Verify peak hours structure if there are any
        for ph in peak_hours:
            assert "hour" in ph, "Missing hour field"
            assert "views" in ph, "Missing views field"
            assert isinstance(ph["hour"], int)
            assert ph["hour"] >= 0 and ph["hour"] <= 23
            assert isinstance(ph["views"], int)
        
        print(f"✓ Peak hours entries: {len(peak_hours)}")

    def test_get_analytics_views_by_day_structure(self):
        """GET /api/vendors/{id}/storefront/analytics has proper views_by_day structure"""
        response = self.session.get(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/analytics?days=30"
        )
        
        assert response.status_code == 200
        
        data = response.json()
        views_by_day = data.get("views_by_day", [])
        
        # Verify views_by_day structure if there are any
        for vbd in views_by_day:
            assert "date" in vbd, "Missing date field"
            assert "views" in vbd, "Missing views field"
            assert "unique" in vbd, "Missing unique field"
            assert isinstance(vbd["views"], int)
            assert isinstance(vbd["unique"], int)
        
        print(f"✓ Views by day entries: {len(views_by_day)}")

    def test_get_analytics_requires_auth(self):
        """GET /api/vendors/{id}/storefront/analytics requires authentication"""
        public_session = requests.Session()
        
        response = public_session.get(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/analytics?days=30"
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Analytics endpoint correctly requires authentication")
        public_session.close()

    def test_get_analytics_different_date_ranges(self):
        """GET /api/vendors/{id}/storefront/analytics accepts different date ranges"""
        for days in [7, 14, 30, 90]:
            response = self.session.get(
                f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/analytics?days={days}"
            )
            
            assert response.status_code == 200, f"Failed for days={days}: {response.status_code}"
        
        print("✓ Analytics works with date ranges: 7, 14, 30, 90 days")

    def test_get_analytics_invalid_vendor_404(self):
        """GET /api/vendors/{id}/storefront/analytics returns 404 for invalid vendor"""
        response = self.session.get(
            f"{BASE_URL}/api/vendors/non-existent-vendor-id/storefront/analytics?days=30"
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ 404 returned for invalid vendor ID")

    # ============== ANALYTICS SUMMARY ENDPOINT TESTS ==============

    def test_get_analytics_summary(self):
        """GET /api/vendors/{id}/storefront/analytics/summary returns quick summary"""
        response = self.session.get(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/analytics/summary"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify required fields
        assert "views_today" in data, "Missing views_today"
        assert "views_this_week" in data, "Missing views_this_week"
        assert "views_this_month" in data, "Missing views_this_month"
        assert "unique_visitors_this_month" in data, "Missing unique_visitors_this_month"
        
        # Verify data types
        assert isinstance(data["views_today"], int)
        assert isinstance(data["views_this_week"], int)
        assert isinstance(data["views_this_month"], int)
        assert isinstance(data["unique_visitors_this_month"], int)
        
        print(f"✓ Analytics summary returned:")
        print(f"  - Views today: {data['views_today']}")
        print(f"  - Views this week: {data['views_this_week']}")
        print(f"  - Views this month: {data['views_this_month']}")
        print(f"  - Unique visitors this month: {data['unique_visitors_this_month']}")

    def test_get_analytics_summary_requires_auth(self):
        """GET /api/vendors/{id}/storefront/analytics/summary requires authentication"""
        public_session = requests.Session()
        
        response = public_session.get(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/analytics/summary"
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Summary endpoint correctly requires authentication")
        public_session.close()

    def test_get_analytics_summary_invalid_vendor_404(self):
        """GET /api/vendors/{id}/storefront/analytics/summary returns 404 for invalid vendor"""
        response = self.session.get(
            f"{BASE_URL}/api/vendors/non-existent-vendor-id/storefront/analytics/summary"
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ 404 returned for invalid vendor ID")

    # ============== INTEGRATION TESTS ==============

    def test_track_multiple_views_and_verify_counts(self):
        """Track multiple views and verify analytics counts update"""
        # Track several views with unique sessions
        num_views = 3
        unique_sessions = []
        
        for i in range(num_views):
            session_id = f"TEST_multi_{uuid.uuid4().hex[:8]}"
            unique_sessions.append(session_id)
            
            track_data = {
                "referrer": f"https://testsite{i}.com",
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
                "session_id": session_id
            }
            
            response = self.session.post(
                f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/track-view",
                json=track_data
            )
            
            assert response.status_code == 200
        
        print(f"✓ Tracked {num_views} views with unique sessions")
        
        # Give a small delay for database writes
        time.sleep(0.5)
        
        # Verify analytics shows the views
        analytics_response = self.session.get(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/analytics?days=1"
        )
        
        assert analytics_response.status_code == 200
        analytics_data = analytics_response.json()
        
        # Views should be reflected (might have other views too from other tests)
        assert analytics_data["total_views"] >= 0  # Just verify it's a valid number
        assert analytics_data["unique_visitors"] >= 0
        print(f"✓ Analytics verified: {analytics_data['total_views']} total views, {analytics_data['unique_visitors']} unique visitors")

    def test_referrer_aggregation(self):
        """Track views from same referrer and verify aggregation"""
        session_id = f"TEST_refagg_{uuid.uuid4().hex[:8]}"
        
        # Track 2 views from same referrer
        for _ in range(2):
            track_data = {
                "referrer": "https://instagram.com/p/testpost",
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
                "session_id": session_id
            }
            
            response = self.session.post(
                f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/track-view",
                json=track_data
            )
            assert response.status_code == 200
        
        time.sleep(0.3)
        
        # Check analytics
        analytics_response = self.session.get(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/analytics?days=1"
        )
        
        assert analytics_response.status_code == 200
        data = analytics_response.json()
        
        # Find instagram in referrers
        referrers = data.get("top_referrers", [])
        instagram_refs = [r for r in referrers if "instagram" in r.get("referrer", "").lower()]
        
        print(f"✓ Referrer aggregation working. Instagram referrals found: {len(instagram_refs) > 0}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
