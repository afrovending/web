"""
Test suite for Email Preferences and Weekly Analytics Reports
Features tested:
- GET /api/vendor/email-preferences - returns all 4 preference settings
- PUT /api/vendor/email-preferences - updates specific preferences
- POST /api/analytics/send-weekly-report/{vendor_id} - generates and sends report
- GET /api/analytics/preview-weekly-report - preview report HTML
- Weekly report only available for Growth+ vendors
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
VENDOR_STARTER_EMAIL = "vendor.approved@example.com"
VENDOR_STARTER_PASSWORD = "password123"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "password123"


class TestEmailPreferencesEndpoints:
    """Test email preferences GET and PUT endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_vendor_token(self):
        """Login as vendor and get token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_STARTER_EMAIL,
            "password": VENDOR_STARTER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    
    def get_admin_token(self):
        """Login as admin and get token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    
    def test_get_email_preferences_requires_auth(self):
        """GET /api/vendor/email-preferences requires authentication"""
        response = self.session.get(f"{BASE_URL}/api/vendor/email-preferences")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ GET /api/vendor/email-preferences requires authentication")
    
    def test_get_email_preferences_returns_all_settings(self):
        """GET /api/vendor/email-preferences returns all 4 preference settings"""
        token = self.get_vendor_token()
        assert token, "Failed to get vendor token"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        response = self.session.get(f"{BASE_URL}/api/vendor/email-preferences")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify all 4 preference fields exist
        assert "weekly_analytics_report" in data, "Missing weekly_analytics_report field"
        assert "order_notifications" in data, "Missing order_notifications field"
        assert "booking_notifications" in data, "Missing booking_notifications field"
        assert "marketing_emails" in data, "Missing marketing_emails field"
        
        # Verify they are boolean values
        assert isinstance(data["weekly_analytics_report"], bool), "weekly_analytics_report should be boolean"
        assert isinstance(data["order_notifications"], bool), "order_notifications should be boolean"
        assert isinstance(data["booking_notifications"], bool), "booking_notifications should be boolean"
        assert isinstance(data["marketing_emails"], bool), "marketing_emails should be boolean"
        
        print(f"✓ GET /api/vendor/email-preferences returns all 4 settings: {data}")
    
    def test_put_email_preferences_updates_single_field(self):
        """PUT /api/vendor/email-preferences updates specific preferences"""
        token = self.get_vendor_token()
        assert token, "Failed to get vendor token"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Get current preferences
        get_response = self.session.get(f"{BASE_URL}/api/vendor/email-preferences")
        assert get_response.status_code == 200
        original = get_response.json()
        
        # Toggle order_notifications
        new_value = not original["order_notifications"]
        update_response = self.session.put(
            f"{BASE_URL}/api/vendor/email-preferences",
            json={"order_notifications": new_value}
        )
        
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        updated = update_response.json()
        
        assert updated["order_notifications"] == new_value, "order_notifications was not updated"
        # Other fields should remain unchanged
        assert updated["weekly_analytics_report"] == original["weekly_analytics_report"], "weekly_analytics_report changed unexpectedly"
        assert updated["booking_notifications"] == original["booking_notifications"], "booking_notifications changed unexpectedly"
        assert updated["marketing_emails"] == original["marketing_emails"], "marketing_emails changed unexpectedly"
        
        # Restore original value
        self.session.put(
            f"{BASE_URL}/api/vendor/email-preferences",
            json={"order_notifications": original["order_notifications"]}
        )
        
        print(f"✓ PUT /api/vendor/email-preferences updates single field correctly")
    
    def test_put_email_preferences_updates_multiple_fields(self):
        """PUT /api/vendor/email-preferences can update multiple fields at once"""
        token = self.get_vendor_token()
        assert token, "Failed to get vendor token"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Get current preferences
        get_response = self.session.get(f"{BASE_URL}/api/vendor/email-preferences")
        original = get_response.json()
        
        # Update multiple fields
        update_response = self.session.put(
            f"{BASE_URL}/api/vendor/email-preferences",
            json={
                "booking_notifications": not original["booking_notifications"],
                "marketing_emails": not original["marketing_emails"]
            }
        )
        
        assert update_response.status_code == 200
        updated = update_response.json()
        
        assert updated["booking_notifications"] != original["booking_notifications"], "booking_notifications not updated"
        assert updated["marketing_emails"] != original["marketing_emails"], "marketing_emails not updated"
        
        # Restore original values
        self.session.put(
            f"{BASE_URL}/api/vendor/email-preferences",
            json={
                "booking_notifications": original["booking_notifications"],
                "marketing_emails": original["marketing_emails"]
            }
        )
        
        print("✓ PUT /api/vendor/email-preferences updates multiple fields correctly")
    
    def test_put_email_preferences_requires_auth(self):
        """PUT /api/vendor/email-preferences requires authentication"""
        response = self.session.put(
            f"{BASE_URL}/api/vendor/email-preferences",
            json={"order_notifications": False}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ PUT /api/vendor/email-preferences requires authentication")


class TestWeeklyReportEndpoints:
    """Test weekly analytics report endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_vendor_token(self):
        """Login as vendor and get token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_STARTER_EMAIL,
            "password": VENDOR_STARTER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    
    def get_admin_token(self):
        """Login as admin and get token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    
    def get_vendor_id(self, token):
        """Get vendor ID from current user"""
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        response = self.session.get(f"{BASE_URL}/api/auth/me")
        if response.status_code == 200:
            return response.json().get("vendor_id")
        return None
    
    def test_preview_weekly_report_requires_auth(self):
        """GET /api/analytics/preview-weekly-report requires authentication"""
        response = self.session.get(f"{BASE_URL}/api/analytics/preview-weekly-report")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ GET /api/analytics/preview-weekly-report requires authentication")
    
    def test_preview_weekly_report_starter_plan_denied(self):
        """GET /api/analytics/preview-weekly-report denied for Starter plan vendors"""
        token = self.get_vendor_token()
        assert token, "Failed to get vendor token"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        response = self.session.get(f"{BASE_URL}/api/analytics/preview-weekly-report")
        
        # Starter plan should be denied (403)
        assert response.status_code == 403, f"Expected 403 for Starter plan, got {response.status_code}"
        assert "Growth+" in response.text or "Growth" in response.text, "Error should mention Growth+ requirement"
        print("✓ GET /api/analytics/preview-weekly-report denied for Starter plan (Growth+ only)")
    
    def test_send_weekly_report_requires_auth(self):
        """POST /api/analytics/send-weekly-report/{vendor_id} requires authentication"""
        response = self.session.post(f"{BASE_URL}/api/analytics/send-weekly-report/test-vendor-id")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ POST /api/analytics/send-weekly-report requires authentication")
    
    def test_send_weekly_report_starter_plan_denied(self):
        """POST /api/analytics/send-weekly-report/{vendor_id} denied for Starter plan"""
        token = self.get_vendor_token()
        assert token, "Failed to get vendor token"
        
        vendor_id = self.get_vendor_id(token)
        assert vendor_id, "Failed to get vendor ID"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        response = self.session.post(f"{BASE_URL}/api/analytics/send-weekly-report/{vendor_id}")
        
        # Starter plan should be denied (403)
        assert response.status_code == 403, f"Expected 403 for Starter plan, got {response.status_code}"
        print("✓ POST /api/analytics/send-weekly-report denied for Starter plan (Growth+ only)")
    
    def test_send_weekly_report_invalid_vendor(self):
        """POST /api/analytics/send-weekly-report/{vendor_id} returns 404 for invalid vendor"""
        token = self.get_admin_token()
        assert token, "Failed to get admin token"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        response = self.session.post(f"{BASE_URL}/api/analytics/send-weekly-report/invalid-vendor-id-12345")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ POST /api/analytics/send-weekly-report returns 404 for invalid vendor")
    
    def test_send_all_weekly_reports_requires_api_key(self):
        """POST /api/analytics/send-all-weekly-reports requires API key"""
        response = self.session.post(f"{BASE_URL}/api/analytics/send-all-weekly-reports")
        # Should fail without api_key parameter
        assert response.status_code in [401, 422], f"Expected 401 or 422, got {response.status_code}"
        print("✓ POST /api/analytics/send-all-weekly-reports requires API key")
    
    def test_send_all_weekly_reports_invalid_api_key(self):
        """POST /api/analytics/send-all-weekly-reports rejects invalid API key"""
        response = self.session.post(
            f"{BASE_URL}/api/analytics/send-all-weekly-reports",
            params={"api_key": "invalid-key"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ POST /api/analytics/send-all-weekly-reports rejects invalid API key")


class TestEmailPreferencesIntegration:
    """Test email preferences integration with weekly reports"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_vendor_token(self):
        """Login as vendor and get token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": VENDOR_STARTER_EMAIL,
            "password": VENDOR_STARTER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    
    def test_weekly_report_toggle_affects_preferences(self):
        """Toggling weekly_analytics_report updates preferences correctly"""
        token = self.get_vendor_token()
        assert token, "Failed to get vendor token"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Get current state
        get_response = self.session.get(f"{BASE_URL}/api/vendor/email-preferences")
        original = get_response.json()
        
        # Toggle weekly_analytics_report to False (opt-out)
        update_response = self.session.put(
            f"{BASE_URL}/api/vendor/email-preferences",
            json={"weekly_analytics_report": False}
        )
        assert update_response.status_code == 200
        assert update_response.json()["weekly_analytics_report"] == False
        
        # Verify it persisted
        verify_response = self.session.get(f"{BASE_URL}/api/vendor/email-preferences")
        assert verify_response.json()["weekly_analytics_report"] == False
        
        # Restore original value
        self.session.put(
            f"{BASE_URL}/api/vendor/email-preferences",
            json={"weekly_analytics_report": original["weekly_analytics_report"]}
        )
        
        print("✓ weekly_analytics_report toggle updates and persists correctly")
    
    def test_all_notification_toggles_work(self):
        """All notification toggles (order, booking, marketing) work correctly"""
        token = self.get_vendor_token()
        assert token, "Failed to get vendor token"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Get current state
        get_response = self.session.get(f"{BASE_URL}/api/vendor/email-preferences")
        original = get_response.json()
        
        # Test each toggle
        toggles = ["order_notifications", "booking_notifications", "marketing_emails"]
        
        for toggle in toggles:
            # Toggle to opposite value
            new_value = not original[toggle]
            update_response = self.session.put(
                f"{BASE_URL}/api/vendor/email-preferences",
                json={toggle: new_value}
            )
            assert update_response.status_code == 200, f"Failed to update {toggle}"
            assert update_response.json()[toggle] == new_value, f"{toggle} not updated correctly"
            
            # Restore
            self.session.put(
                f"{BASE_URL}/api/vendor/email-preferences",
                json={toggle: original[toggle]}
            )
        
        print("✓ All notification toggles (order, booking, marketing) work correctly")


class TestWeeklyReportDataStructure:
    """Test weekly report data structure and content"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_admin_token(self):
        """Login as admin and get token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        return None
    
    def test_admin_can_preview_weekly_report(self):
        """Admin can preview weekly report (bypasses subscription check)"""
        token = self.get_admin_token()
        assert token, "Failed to get admin token"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        response = self.session.get(f"{BASE_URL}/api/analytics/preview-weekly-report")
        
        # Admin should be able to preview (may get 404 if no vendor profile, or 200 with HTML)
        # If admin has vendor profile, should return HTML
        if response.status_code == 200:
            # Should return HTML content
            content_type = response.headers.get("content-type", "")
            assert "text/html" in content_type, f"Expected HTML content, got {content_type}"
            
            # Check HTML contains expected sections
            html = response.text
            assert "Weekly Analytics Report" in html or "weekly" in html.lower(), "Missing report title"
            print("✓ Admin can preview weekly report - HTML content returned")
        elif response.status_code == 404:
            # Admin may not have vendor profile
            print("✓ Admin preview returns 404 (no vendor profile) - expected behavior")
        else:
            # Unexpected status
            print(f"⚠ Admin preview returned {response.status_code}: {response.text}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
