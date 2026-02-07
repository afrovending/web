"""
Test Product Variants Feature
Tests for product variants (size, color), cart with variants, and variant selection
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test product with variants
TEST_PRODUCT_ID = "41db2e79-2497-4cc4-a182-bd9c56e79451"

# Test credentials
TEST_EMAIL = "testuser123@example.com"
TEST_PASSWORD = "password123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for test user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestProductVariants:
    """Test product variant endpoints"""
    
    def test_get_product_with_variants(self):
        """Test getting a product with variants returns variant data"""
        response = requests.get(f"{BASE_URL}/api/products/{TEST_PRODUCT_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify product has variants
        assert data["has_variants"] == True
        assert "variant_options" in data
        assert "variants" in data
        
        # Verify variant_options structure
        assert len(data["variant_options"]) == 2  # Size and Color
        
        size_option = next((o for o in data["variant_options"] if o["name"] == "Size"), None)
        color_option = next((o for o in data["variant_options"] if o["name"] == "Color"), None)
        
        assert size_option is not None
        assert color_option is not None
        assert "S" in size_option["values"]
        assert "M" in size_option["values"]
        assert "L" in size_option["values"]
        assert "XL" in size_option["values"]
        assert "Red" in color_option["values"]
        assert "Blue" in color_option["values"]
        
        print(f"Product has {len(data['variants'])} variants")
    
    def test_variant_has_required_fields(self):
        """Test each variant has required fields"""
        response = requests.get(f"{BASE_URL}/api/products/{TEST_PRODUCT_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        for variant in data["variants"]:
            assert "id" in variant
            assert "sku" in variant
            assert "options" in variant
            assert "stock" in variant
            assert "Size" in variant["options"]
            assert "Color" in variant["options"]
            
            print(f"Variant {variant['sku']}: Size={variant['options']['Size']}, Color={variant['options']['Color']}, Stock={variant['stock']}")
    
    def test_variant_prices(self):
        """Test variants have correct prices"""
        response = requests.get(f"{BASE_URL}/api/products/{TEST_PRODUCT_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Find specific variants and check prices
        m_red = next((v for v in data["variants"] if v["options"]["Size"] == "M" and v["options"]["Color"] == "Red"), None)
        xl_red = next((v for v in data["variants"] if v["options"]["Size"] == "XL" and v["options"]["Color"] == "Red"), None)
        
        assert m_red is not None
        assert xl_red is not None
        
        # M-Red should be $89.99, XL-Red should be $99.99
        assert m_red["price"] == 89.99
        assert xl_red["price"] == 99.99
        
        print(f"M-Red price: ${m_red['price']}, XL-Red price: ${xl_red['price']}")
    
    def test_out_of_stock_variant(self):
        """Test XL-Blue variant has 0 stock"""
        response = requests.get(f"{BASE_URL}/api/products/{TEST_PRODUCT_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        xl_blue = next((v for v in data["variants"] if v["options"]["Size"] == "XL" and v["options"]["Color"] == "Blue"), None)
        
        assert xl_blue is not None
        assert xl_blue["stock"] == 0
        
        print(f"XL-Blue stock: {xl_blue['stock']} (out of stock)")
    
    def test_product_without_variants(self):
        """Test product without variants doesn't have variant data"""
        # Get products list and find one without variants
        response = requests.get(f"{BASE_URL}/api/products?limit=10")
        assert response.status_code == 200
        
        products = response.json()
        non_variant_product = next((p for p in products if not p.get("has_variants", False)), None)
        
        assert non_variant_product is not None
        
        # Get full product details
        response = requests.get(f"{BASE_URL}/api/products/{non_variant_product['id']}")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("has_variants", False) == False
        assert len(data.get("variant_options", [])) == 0
        assert len(data.get("variants", [])) == 0
        
        print(f"Non-variant product: {data['name']}")


class TestCartWithVariants:
    """Test cart functionality with variants"""
    
    def test_add_variant_to_cart(self, auth_headers):
        """Test adding a variant product to cart"""
        # First get the product to find a variant ID
        response = requests.get(f"{BASE_URL}/api/products/{TEST_PRODUCT_ID}")
        assert response.status_code == 200
        product = response.json()
        
        # Find M-Green variant
        m_green = next((v for v in product["variants"] if v["options"]["Size"] == "M" and v["options"]["Color"] == "Green"), None)
        assert m_green is not None
        
        # Add to cart with variant
        cart_payload = {
            "product_id": TEST_PRODUCT_ID,
            "quantity": 1,
            "variant_id": m_green["id"],
            "selected_options": {"Size": "M", "Color": "Green"}
        }
        
        response = requests.post(f"{BASE_URL}/api/cart/items", json=cart_payload, headers=auth_headers)
        assert response.status_code == 200
        
        print(f"Added variant {m_green['sku']} to cart")
    
    def test_cart_shows_variant_info(self, auth_headers):
        """Test cart displays variant information"""
        response = requests.get(f"{BASE_URL}/api/cart", headers=auth_headers)
        assert response.status_code == 200
        
        cart = response.json()
        
        # Find the variant item we added
        variant_item = next((item for item in cart["items"] if item.get("variant_id")), None)
        
        if variant_item:
            assert "selected_options" in variant_item
            assert variant_item["selected_options"] is not None
            
            # Check variant SKU is present
            if variant_item.get("variant_sku"):
                print(f"Cart item has SKU: {variant_item['variant_sku']}")
            
            print(f"Cart item options: {variant_item['selected_options']}")
    
    def test_add_variant_without_selection_fails(self, auth_headers):
        """Test adding variant product without selecting variant fails"""
        cart_payload = {
            "product_id": TEST_PRODUCT_ID,
            "quantity": 1
            # No variant_id or selected_options
        }
        
        response = requests.post(f"{BASE_URL}/api/cart/items", json=cart_payload, headers=auth_headers)
        
        # Should fail because product has variants but none selected
        assert response.status_code == 400
        detail = response.json().get("detail", "").lower()
        assert "select" in detail or "option" in detail or "variant" in detail
        
        print(f"Adding variant product without selection correctly fails: {response.json().get('detail')}")
    
    def test_add_out_of_stock_variant_fails(self, auth_headers):
        """Test adding out of stock variant fails"""
        # Get the product to find XL-Blue variant (0 stock)
        response = requests.get(f"{BASE_URL}/api/products/{TEST_PRODUCT_ID}")
        assert response.status_code == 200
        product = response.json()
        
        xl_blue = next((v for v in product["variants"] if v["options"]["Size"] == "XL" and v["options"]["Color"] == "Blue"), None)
        assert xl_blue is not None
        assert xl_blue["stock"] == 0
        
        # Try to add to cart
        cart_payload = {
            "product_id": TEST_PRODUCT_ID,
            "quantity": 1,
            "variant_id": xl_blue["id"],
            "selected_options": {"Size": "XL", "Color": "Blue"}
        }
        
        response = requests.post(f"{BASE_URL}/api/cart/items", json=cart_payload, headers=auth_headers)
        
        # Should fail due to no stock
        assert response.status_code == 400
        assert "stock" in response.json().get("detail", "").lower()
        
        print("Adding out of stock variant correctly fails")
    
    def test_cart_price_uses_variant_price(self, auth_headers):
        """Test cart uses variant-specific price"""
        # Clear cart first
        requests.delete(f"{BASE_URL}/api/cart", headers=auth_headers)
        
        # Get product and find XL-Red variant ($99.99)
        response = requests.get(f"{BASE_URL}/api/products/{TEST_PRODUCT_ID}")
        assert response.status_code == 200
        product = response.json()
        
        xl_red = next((v for v in product["variants"] if v["options"]["Size"] == "XL" and v["options"]["Color"] == "Red"), None)
        assert xl_red is not None
        
        # Add to cart
        cart_payload = {
            "product_id": TEST_PRODUCT_ID,
            "quantity": 1,
            "variant_id": xl_red["id"],
            "selected_options": {"Size": "XL", "Color": "Red"}
        }
        
        response = requests.post(f"{BASE_URL}/api/cart/items", json=cart_payload, headers=auth_headers)
        assert response.status_code == 200
        
        # Get cart and verify price
        response = requests.get(f"{BASE_URL}/api/cart", headers=auth_headers)
        assert response.status_code == 200
        
        cart = response.json()
        xl_red_item = next((item for item in cart["items"] if item.get("variant_id") == xl_red["id"]), None)
        
        assert xl_red_item is not None
        assert xl_red_item["price"] == 99.99
        
        print(f"Cart correctly shows XL-Red price: ${xl_red_item['price']}")
    
    def test_cleanup_cart(self, auth_headers):
        """Clean up cart after tests"""
        response = requests.delete(f"{BASE_URL}/api/cart", headers=auth_headers)
        assert response.status_code == 200
        
        print("Cart cleaned up")


class TestSearchWithVariants:
    """Test search and filter still work with variant products"""
    
    def test_search_finds_variant_product(self):
        """Test search finds product with variants"""
        response = requests.get(f"{BASE_URL}/api/search?q=Ankara")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total_products"] > 0
        
        ankara_product = next((p for p in data["products"] if "Ankara" in p["name"]), None)
        assert ankara_product is not None
        assert ankara_product["has_variants"] == True
        
        print(f"Search found variant product: {ankara_product['name']}")
    
    def test_products_filter_works(self):
        """Test products filter endpoint works"""
        response = requests.get(f"{BASE_URL}/api/products?search=dress")
        assert response.status_code == 200
        
        products = response.json()
        assert len(products) > 0
        
        print(f"Filter found {len(products)} products")
    
    def test_products_sort_works(self):
        """Test products sort works"""
        response = requests.get(f"{BASE_URL}/api/products?sort_by=price&sort_order=asc")
        assert response.status_code == 200
        
        products = response.json()
        assert len(products) > 0
        
        # Verify sorted by price ascending
        prices = [p["price"] for p in products]
        assert prices == sorted(prices)
        
        print(f"Products sorted by price: {prices[:3]}...")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
