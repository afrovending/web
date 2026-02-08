"""
Test Verified Seller Badge Feature
Tests that is_verified_seller field is correctly returned for:
- Products API (list, detail, featured, search)
- Vendors API (list, detail, featured)
- Verified status based on Growth+ subscription (growth, pro, enterprise)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')


class TestVerifiedSellerBadgeBackend:
    """Test verified seller badge in API responses"""
    
    # ==================== PRODUCTS API TESTS ====================
    
    def test_products_list_returns_is_verified_seller_field(self):
        """GET /api/products should return is_verified_seller field for each product"""
        response = requests.get(f"{BASE_URL}/api/products?limit=10")
        assert response.status_code == 200
        
        products = response.json()
        assert isinstance(products, list)
        
        if len(products) > 0:
            # Check that is_verified_seller field exists in each product
            for product in products:
                assert "is_verified_seller" in product, f"Product {product.get('id')} missing is_verified_seller field"
                assert isinstance(product["is_verified_seller"], bool), "is_verified_seller should be boolean"
            print(f"✓ All {len(products)} products have is_verified_seller field")
        else:
            print("⚠ No products found to test")
    
    def test_product_detail_returns_is_verified_seller_field(self):
        """GET /api/products/{id} should return is_verified_seller field"""
        # First get a product ID
        list_response = requests.get(f"{BASE_URL}/api/products?limit=1")
        assert list_response.status_code == 200
        products = list_response.json()
        
        if len(products) > 0:
            product_id = products[0]["id"]
            
            # Get product detail
            response = requests.get(f"{BASE_URL}/api/products/{product_id}")
            assert response.status_code == 200
            
            product = response.json()
            assert "is_verified_seller" in product, "Product detail missing is_verified_seller field"
            assert isinstance(product["is_verified_seller"], bool)
            print(f"✓ Product detail has is_verified_seller: {product['is_verified_seller']}")
        else:
            pytest.skip("No products available to test")
    
    def test_featured_products_returns_is_verified_seller_field(self):
        """GET /api/products/featured should return is_verified_seller field"""
        response = requests.get(f"{BASE_URL}/api/products/featured?limit=8")
        assert response.status_code == 200
        
        products = response.json()
        if len(products) > 0:
            for product in products:
                assert "is_verified_seller" in product, f"Featured product {product.get('id')} missing is_verified_seller"
                assert isinstance(product["is_verified_seller"], bool)
            print(f"✓ All {len(products)} featured products have is_verified_seller field")
        else:
            print("⚠ No featured products found")
    
    def test_search_products_returns_is_verified_seller_field(self):
        """GET /api/search should return is_verified_seller field in products"""
        response = requests.get(f"{BASE_URL}/api/search?type=products&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "products" in data
        
        products = data["products"]
        if len(products) > 0:
            for product in products:
                assert "is_verified_seller" in product, f"Search product {product.get('id')} missing is_verified_seller"
                assert isinstance(product["is_verified_seller"], bool)
            print(f"✓ All {len(products)} search products have is_verified_seller field")
        else:
            print("⚠ No products in search results")
    
    # ==================== VENDORS API TESTS ====================
    
    def test_vendors_list_returns_is_verified_seller_field(self):
        """GET /api/vendors should return is_verified_seller field for each vendor"""
        response = requests.get(f"{BASE_URL}/api/vendors?is_approved=true&limit=10")
        assert response.status_code == 200
        
        vendors = response.json()
        assert isinstance(vendors, list)
        
        if len(vendors) > 0:
            for vendor in vendors:
                assert "is_verified_seller" in vendor, f"Vendor {vendor.get('id')} missing is_verified_seller field"
                assert isinstance(vendor["is_verified_seller"], bool)
            print(f"✓ All {len(vendors)} vendors have is_verified_seller field")
        else:
            print("⚠ No vendors found to test")
    
    def test_vendors_list_returns_subscription_plan_field(self):
        """GET /api/vendors should return subscription_plan field for each vendor"""
        response = requests.get(f"{BASE_URL}/api/vendors?is_approved=true&limit=10")
        assert response.status_code == 200
        
        vendors = response.json()
        if len(vendors) > 0:
            for vendor in vendors:
                assert "subscription_plan" in vendor, f"Vendor {vendor.get('id')} missing subscription_plan field"
                # subscription_plan should be one of: starter, growth, pro, enterprise
                valid_plans = ["starter", "growth", "pro", "enterprise"]
                assert vendor["subscription_plan"] in valid_plans, f"Invalid subscription_plan: {vendor['subscription_plan']}"
            print(f"✓ All {len(vendors)} vendors have valid subscription_plan field")
        else:
            print("⚠ No vendors found to test")
    
    def test_vendor_detail_returns_is_verified_seller_field(self):
        """GET /api/vendors/{id} should return is_verified_seller field"""
        # First get a vendor ID
        list_response = requests.get(f"{BASE_URL}/api/vendors?is_approved=true&limit=1")
        assert list_response.status_code == 200
        vendors = list_response.json()
        
        if len(vendors) > 0:
            vendor_id = vendors[0]["id"]
            
            # Get vendor detail
            response = requests.get(f"{BASE_URL}/api/vendors/{vendor_id}")
            assert response.status_code == 200
            
            vendor = response.json()
            assert "is_verified_seller" in vendor, "Vendor detail missing is_verified_seller field"
            assert isinstance(vendor["is_verified_seller"], bool)
            print(f"✓ Vendor detail has is_verified_seller: {vendor['is_verified_seller']}")
        else:
            pytest.skip("No vendors available to test")
    
    def test_vendor_detail_returns_subscription_plan_field(self):
        """GET /api/vendors/{id} should return subscription_plan field"""
        list_response = requests.get(f"{BASE_URL}/api/vendors?is_approved=true&limit=1")
        assert list_response.status_code == 200
        vendors = list_response.json()
        
        if len(vendors) > 0:
            vendor_id = vendors[0]["id"]
            
            response = requests.get(f"{BASE_URL}/api/vendors/{vendor_id}")
            assert response.status_code == 200
            
            vendor = response.json()
            assert "subscription_plan" in vendor, "Vendor detail missing subscription_plan field"
            valid_plans = ["starter", "growth", "pro", "enterprise"]
            assert vendor["subscription_plan"] in valid_plans
            print(f"✓ Vendor detail has subscription_plan: {vendor['subscription_plan']}")
        else:
            pytest.skip("No vendors available to test")
    
    def test_featured_vendors_returns_is_verified_seller_field(self):
        """GET /api/vendors/featured should return is_verified_seller field"""
        response = requests.get(f"{BASE_URL}/api/vendors/featured?limit=4")
        assert response.status_code == 200
        
        vendors = response.json()
        if len(vendors) > 0:
            for vendor in vendors:
                assert "is_verified_seller" in vendor, f"Featured vendor {vendor.get('id')} missing is_verified_seller"
                assert isinstance(vendor["is_verified_seller"], bool)
            print(f"✓ All {len(vendors)} featured vendors have is_verified_seller field")
        else:
            print("⚠ No featured vendors found")
    
    # ==================== VERIFIED STATUS LOGIC TESTS ====================
    
    def test_verified_seller_only_for_growth_plus_plans(self):
        """Verify that is_verified_seller=true only for Growth, Pro, or Enterprise plans"""
        response = requests.get(f"{BASE_URL}/api/vendors?is_approved=true&limit=50")
        assert response.status_code == 200
        
        vendors = response.json()
        growth_plus_plans = ["growth", "pro", "enterprise"]
        
        verified_count = 0
        non_verified_count = 0
        
        for vendor in vendors:
            is_verified = vendor.get("is_verified_seller", False)
            plan = vendor.get("subscription_plan", "starter")
            
            if is_verified:
                # If verified, must be Growth+ plan
                assert plan in growth_plus_plans, f"Vendor {vendor['store_name']} is verified but has {plan} plan (should be Growth+)"
                verified_count += 1
            else:
                non_verified_count += 1
        
        print(f"✓ Verified sellers: {verified_count}, Non-verified: {non_verified_count}")
        print(f"✓ All verified sellers have Growth+ subscription")
    
    def test_starter_plan_vendors_not_verified(self):
        """Verify that Starter plan vendors are NOT verified"""
        response = requests.get(f"{BASE_URL}/api/vendors?is_approved=true&limit=50")
        assert response.status_code == 200
        
        vendors = response.json()
        
        starter_vendors = [v for v in vendors if v.get("subscription_plan") == "starter"]
        
        for vendor in starter_vendors:
            assert vendor.get("is_verified_seller") == False, f"Starter vendor {vendor['store_name']} should NOT be verified"
        
        print(f"✓ All {len(starter_vendors)} Starter plan vendors are correctly NOT verified")
    
    def test_products_from_verified_vendor_show_verified_badge(self):
        """Products from verified vendors should have is_verified_seller=true"""
        # Get vendors to find a verified one
        vendors_response = requests.get(f"{BASE_URL}/api/vendors?is_approved=true&limit=50")
        assert vendors_response.status_code == 200
        vendors = vendors_response.json()
        
        verified_vendor = None
        for v in vendors:
            if v.get("is_verified_seller"):
                verified_vendor = v
                break
        
        if verified_vendor:
            # Get products from this vendor
            products_response = requests.get(f"{BASE_URL}/api/products?vendor_id={verified_vendor['id']}&limit=10")
            assert products_response.status_code == 200
            products = products_response.json()
            
            for product in products:
                assert product.get("is_verified_seller") == True, f"Product from verified vendor should have is_verified_seller=true"
            
            print(f"✓ All {len(products)} products from verified vendor '{verified_vendor['store_name']}' show verified badge")
        else:
            print("⚠ No verified vendors found to test product badge inheritance")
    
    def test_products_from_non_verified_vendor_no_badge(self):
        """Products from non-verified vendors should have is_verified_seller=false"""
        # Get vendors to find a non-verified one
        vendors_response = requests.get(f"{BASE_URL}/api/vendors?is_approved=true&limit=50")
        assert vendors_response.status_code == 200
        vendors = vendors_response.json()
        
        non_verified_vendor = None
        for v in vendors:
            if not v.get("is_verified_seller"):
                non_verified_vendor = v
                break
        
        if non_verified_vendor:
            # Get products from this vendor
            products_response = requests.get(f"{BASE_URL}/api/products?vendor_id={non_verified_vendor['id']}&limit=10")
            assert products_response.status_code == 200
            products = products_response.json()
            
            for product in products:
                assert product.get("is_verified_seller") == False, f"Product from non-verified vendor should have is_verified_seller=false"
            
            print(f"✓ All {len(products)} products from non-verified vendor '{non_verified_vendor['store_name']}' correctly have no badge")
        else:
            print("⚠ No non-verified vendors found to test")


class TestVerifiedSellerBadgeSpecificVendors:
    """Test specific vendors mentioned in requirements"""
    
    def test_lagos_african_crafts_is_verified(self):
        """Lagos African Crafts should be verified (Growth subscription)"""
        response = requests.get(f"{BASE_URL}/api/vendors?is_approved=true&limit=50")
        assert response.status_code == 200
        vendors = response.json()
        
        lagos_vendor = None
        for v in vendors:
            if "Lagos African Crafts" in v.get("store_name", ""):
                lagos_vendor = v
                break
        
        if lagos_vendor:
            assert lagos_vendor.get("is_verified_seller") == True, "Lagos African Crafts should be verified"
            assert lagos_vendor.get("subscription_plan") in ["growth", "pro", "enterprise"], "Lagos African Crafts should have Growth+ plan"
            print(f"✓ Lagos African Crafts is verified with {lagos_vendor['subscription_plan']} plan")
        else:
            print("⚠ Lagos African Crafts vendor not found - may need to check vendor name")
    
    def test_african_crafts_shop_not_verified(self):
        """African Crafts Shop should NOT be verified (Starter plan)"""
        response = requests.get(f"{BASE_URL}/api/vendors?is_approved=true&limit=50")
        assert response.status_code == 200
        vendors = response.json()
        
        crafts_shop = None
        for v in vendors:
            if "African Crafts Shop" in v.get("store_name", ""):
                crafts_shop = v
                break
        
        if crafts_shop:
            assert crafts_shop.get("is_verified_seller") == False, "African Crafts Shop should NOT be verified"
            assert crafts_shop.get("subscription_plan") == "starter", "African Crafts Shop should have Starter plan"
            print(f"✓ African Crafts Shop is correctly NOT verified with {crafts_shop['subscription_plan']} plan")
        else:
            print("⚠ African Crafts Shop vendor not found - may need to check vendor name")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
