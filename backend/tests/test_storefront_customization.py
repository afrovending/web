"""
Test Vendor Storefront Customization Feature
Tests: Theme presets, custom colors, social links, featured products, storefront settings
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_VENDOR_EMAIL = "vendor@afrovending.com"
TEST_VENDOR_PASSWORD = "password123"


class TestStorefrontCustomization:
    """Test storefront customization endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as vendor
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_VENDOR_EMAIL,
            "password": TEST_VENDOR_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip("Vendor login failed - skipping storefront tests")
        
        login_data = login_response.json()
        self.token = login_data.get("access_token")
        self.user = login_data.get("user", {})
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

    # ============== GET STOREFRONT TESTS ==============
    
    def test_get_storefront_returns_defaults(self):
        """GET /api/vendors/{id}/storefront returns storefront settings with defaults"""
        response = self.session.get(f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify structure has required fields
        assert "vendor_id" in data
        assert data["vendor_id"] == self.vendor_id
        assert "store_name" in data
        assert "theme" in data
        assert "social_links" in data
        # Verify theme has default values
        assert "primary_color" in data.get("theme", {})
        assert "accent_color" in data.get("theme", {})
        assert "background_style" in data.get("theme", {})
        assert "layout_style" in data.get("theme", {})
        print(f"✓ Storefront defaults returned for vendor {self.vendor_id}")
        print(f"  Theme: {data.get('theme', {})}")

    def test_get_storefront_no_auth_works(self):
        """GET /api/vendors/{id}/storefront is public (no auth required)"""
        # Use new session without auth
        public_session = requests.Session()
        response = public_session.get(f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront")
        
        assert response.status_code == 200, f"Public storefront access should work, got {response.status_code}"
        print("✓ Storefront is publicly accessible")
        public_session.close()

    def test_get_storefront_invalid_vendor_404(self):
        """GET /api/vendors/{id}/storefront returns 404 for non-existent vendor"""
        response = self.session.get(f"{BASE_URL}/api/vendors/non-existent-vendor-id/storefront")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ 404 returned for invalid vendor ID")

    # ============== UPDATE STOREFRONT TESTS ==============
    
    def test_update_storefront_basic(self):
        """PUT /api/vendors/{id}/storefront updates basic settings"""
        update_data = {
            "tagline": "TEST_Authentic African Crafts",
            "about_text": "TEST_About our store - we sell authentic African products."
        }
        
        response = self.session.put(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront",
            json=update_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "storefront" in data or "message" in data
        print(f"✓ Storefront basic settings updated")
        
        # Verify persistence with GET
        get_response = self.session.get(f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront")
        get_data = get_response.json()
        assert get_data.get("tagline") == "TEST_Authentic African Crafts"
        assert "TEST_About our store" in get_data.get("about_text", "")
        print("✓ Changes persisted correctly")

    def test_update_storefront_theme_custom_colors(self):
        """PUT /api/vendors/{id}/storefront updates custom theme colors"""
        update_data = {
            "theme": {
                "primary_color": "#ff5500",
                "accent_color": "#333333",
                "background_style": "light",
                "layout_style": "grid"
            }
        }
        
        response = self.session.put(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront",
            json=update_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify persistence
        get_response = self.session.get(f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront")
        get_data = get_response.json()
        theme = get_data.get("theme", {})
        assert theme.get("primary_color") == "#ff5500"
        assert theme.get("accent_color") == "#333333"
        print(f"✓ Custom colors saved: primary={theme.get('primary_color')}, accent={theme.get('accent_color')}")

    def test_update_storefront_social_links(self):
        """PUT /api/vendors/{id}/storefront updates social links"""
        update_data = {
            "social_links": {
                "instagram": "https://instagram.com/test_afrovending",
                "facebook": "https://facebook.com/test_afrovending",
                "twitter": "https://twitter.com/test_afrovending",
                "website": "https://test.afrovending.com"
            }
        }
        
        response = self.session.put(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront",
            json=update_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify persistence
        get_response = self.session.get(f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront")
        get_data = get_response.json()
        social = get_data.get("social_links", {})
        assert social.get("instagram") == "https://instagram.com/test_afrovending"
        assert social.get("facebook") == "https://facebook.com/test_afrovending"
        print(f"✓ Social links saved correctly")

    def test_update_storefront_display_toggles(self):
        """PUT /api/vendors/{id}/storefront updates display toggles"""
        update_data = {
            "show_reviews": False,
            "show_product_count": True,
            "show_member_since": False
        }
        
        response = self.session.put(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront",
            json=update_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify persistence
        get_response = self.session.get(f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront")
        get_data = get_response.json()
        assert get_data.get("show_reviews") == False
        assert get_data.get("show_product_count") == True
        assert get_data.get("show_member_since") == False
        print("✓ Display toggles saved correctly")

    def test_update_storefront_requires_auth(self):
        """PUT /api/vendors/{id}/storefront requires authentication"""
        public_session = requests.Session()
        public_session.headers.update({"Content-Type": "application/json"})
        
        response = public_session.put(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront",
            json={"tagline": "Unauthorized change"}
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Unauthorized update correctly rejected")
        public_session.close()

    # ============== THEME PRESETS TESTS ==============
    
    def test_get_theme_presets(self):
        """GET /api/vendors/{id}/storefront/theme-presets returns available presets"""
        response = self.session.get(f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/theme-presets")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "presets" in data, "Response should contain 'presets' key"
        presets = data["presets"]
        
        # Verify all 6 presets exist
        expected_presets = ["classic", "ocean", "forest", "sunset", "royal", "midnight"]
        for preset_name in expected_presets:
            assert preset_name in presets, f"Missing preset: {preset_name}"
            preset = presets[preset_name]
            assert "primary_color" in preset
            assert "accent_color" in preset
            assert "background_style" in preset
        
        print(f"✓ All {len(expected_presets)} theme presets available: {', '.join(expected_presets)}")
        
        # Verify specific preset colors
        assert presets["classic"]["primary_color"] == "#dc2626"  # Red
        assert presets["ocean"]["primary_color"] == "#0891b2"    # Blue
        assert presets["forest"]["primary_color"] == "#16a34a"   # Green
        assert presets["sunset"]["primary_color"] == "#ea580c"   # Orange
        assert presets["royal"]["primary_color"] == "#7c3aed"    # Purple
        assert presets["midnight"]["primary_color"] == "#6366f1" # Dark indigo
        print("✓ Preset colors verified")

    def test_apply_theme_preset_classic(self):
        """POST /api/vendors/{id}/storefront/apply-preset applies classic theme"""
        response = self.session.post(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/apply-preset?preset_name=classic"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "theme" in data
        theme = data["theme"]
        assert theme.get("primary_color") == "#dc2626"
        assert theme.get("preset") == "classic"
        print("✓ Classic theme applied successfully")

    def test_apply_theme_preset_ocean(self):
        """POST /api/vendors/{id}/storefront/apply-preset applies ocean theme"""
        response = self.session.post(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/apply-preset?preset_name=ocean"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["theme"].get("primary_color") == "#0891b2"
        assert data["theme"].get("preset") == "ocean"
        print("✓ Ocean theme applied successfully")

    def test_apply_theme_preset_forest(self):
        """POST /api/vendors/{id}/storefront/apply-preset applies forest theme"""
        response = self.session.post(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/apply-preset?preset_name=forest"
        )
        
        assert response.status_code == 200
        assert response.json()["theme"].get("primary_color") == "#16a34a"
        print("✓ Forest theme applied successfully")

    def test_apply_theme_preset_sunset(self):
        """POST /api/vendors/{id}/storefront/apply-preset applies sunset theme"""
        response = self.session.post(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/apply-preset?preset_name=sunset"
        )
        
        assert response.status_code == 200
        assert response.json()["theme"].get("primary_color") == "#ea580c"
        print("✓ Sunset theme applied successfully")

    def test_apply_theme_preset_royal(self):
        """POST /api/vendors/{id}/storefront/apply-preset applies royal theme"""
        response = self.session.post(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/apply-preset?preset_name=royal"
        )
        
        assert response.status_code == 200
        assert response.json()["theme"].get("primary_color") == "#7c3aed"
        print("✓ Royal theme applied successfully")

    def test_apply_theme_preset_midnight(self):
        """POST /api/vendors/{id}/storefront/apply-preset applies midnight theme"""
        response = self.session.post(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/apply-preset?preset_name=midnight"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["theme"].get("primary_color") == "#6366f1"
        assert data["theme"].get("background_style") == "dark"
        print("✓ Midnight theme applied successfully (dark mode)")

    def test_apply_invalid_preset_returns_400(self):
        """POST /api/vendors/{id}/storefront/apply-preset returns 400 for invalid preset"""
        response = self.session.post(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/apply-preset?preset_name=invalid_preset"
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Invalid preset correctly rejected with 400")

    def test_apply_preset_requires_auth(self):
        """POST /api/vendors/{id}/storefront/apply-preset requires authentication"""
        public_session = requests.Session()
        
        response = public_session.post(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/apply-preset?preset_name=ocean"
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Unauthenticated preset apply correctly rejected")
        public_session.close()

    # ============== FEATURED PRODUCTS TESTS ==============
    
    def test_update_featured_products(self):
        """PUT /api/vendors/{id}/storefront/featured-products updates featured products"""
        # First get vendor's products
        products_response = self.session.get(f"{BASE_URL}/api/products?vendor_id={self.vendor_id}&limit=10")
        products = products_response.json() if products_response.status_code == 200 else []
        
        if len(products) == 0:
            pytest.skip("No products available to test featured products")
        
        # Select up to 3 products to feature
        product_ids = [p["id"] for p in products[:3]]
        
        response = self.session.put(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/featured-products",
            json=product_ids
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "featured_product_ids" in data
        assert len(data["featured_product_ids"]) <= 6  # Max 6 featured
        print(f"✓ Featured products updated: {len(data['featured_product_ids'])} products")
        
        # Verify in storefront GET
        get_response = self.session.get(f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront")
        get_data = get_response.json()
        assert "featured_products" in get_data
        print(f"✓ Featured products appear in storefront response")

    def test_featured_products_max_6(self):
        """PUT /api/vendors/{id}/storefront/featured-products limits to 6 products"""
        # Get many products
        products_response = self.session.get(f"{BASE_URL}/api/products?vendor_id={self.vendor_id}&limit=20")
        products = products_response.json() if products_response.status_code == 200 else []
        
        if len(products) < 7:
            pytest.skip("Not enough products to test max limit")
        
        # Try to add 10 products
        product_ids = [p["id"] for p in products[:10]]
        
        response = self.session.put(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/featured-products",
            json=product_ids
        )
        
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["featured_product_ids"]) <= 6, "Should be limited to 6 featured products"
        print(f"✓ Featured products correctly limited to {len(data['featured_product_ids'])} (max 6)")

    def test_featured_products_requires_auth(self):
        """PUT /api/vendors/{id}/storefront/featured-products requires authentication"""
        public_session = requests.Session()
        public_session.headers.update({"Content-Type": "application/json"})
        
        response = public_session.put(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront/featured-products",
            json=["product-1", "product-2"]
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Unauthenticated featured products update correctly rejected")
        public_session.close()

    # ============== LAYOUT STYLE TESTS ==============
    
    def test_update_layout_grid(self):
        """PUT /api/vendors/{id}/storefront updates layout to grid"""
        response = self.session.put(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront",
            json={"theme": {"layout_style": "grid"}}
        )
        
        assert response.status_code == 200
        
        get_response = self.session.get(f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront")
        assert get_response.json().get("theme", {}).get("layout_style") == "grid"
        print("✓ Grid layout saved")

    def test_update_layout_list(self):
        """PUT /api/vendors/{id}/storefront updates layout to list"""
        response = self.session.put(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront",
            json={"theme": {"layout_style": "list"}}
        )
        
        assert response.status_code == 200
        
        get_response = self.session.get(f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront")
        assert get_response.json().get("theme", {}).get("layout_style") == "list"
        print("✓ List layout saved")

    def test_update_layout_masonry(self):
        """PUT /api/vendors/{id}/storefront updates layout to masonry"""
        response = self.session.put(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront",
            json={"theme": {"layout_style": "masonry"}}
        )
        
        assert response.status_code == 200
        
        get_response = self.session.get(f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront")
        assert get_response.json().get("theme", {}).get("layout_style") == "masonry"
        print("✓ Masonry layout saved")

    # ============== CLEANUP TEST ==============
    
    def test_cleanup_reset_storefront(self):
        """Cleanup: Reset storefront to defaults for future tests"""
        # Reset to clean state
        update_data = {
            "tagline": "",
            "about_text": "",
            "banner_url": None,
            "logo_url": None,
            "theme": {
                "primary_color": "#dc2626",
                "accent_color": "#1a1a1a",
                "background_style": "light",
                "layout_style": "grid",
                "preset": "classic"
            },
            "social_links": {
                "instagram": None,
                "facebook": None,
                "twitter": None,
                "website": None
            },
            "show_reviews": True,
            "show_product_count": True,
            "show_member_since": True
        }
        
        response = self.session.put(
            f"{BASE_URL}/api/vendors/{self.vendor_id}/storefront",
            json=update_data
        )
        
        assert response.status_code == 200
        print("✓ Storefront reset to defaults")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
