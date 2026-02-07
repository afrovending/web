"""
Test suite for Advanced Search and Filtering features
Tests: /api/search, /api/search/suggestions, /api/products, /api/services with filters
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestUnifiedSearch:
    """Tests for /api/search endpoint"""
    
    def test_search_endpoint_basic(self):
        """Test basic search endpoint returns products and services"""
        response = requests.get(f"{BASE_URL}/api/search")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "products" in data
        assert "services" in data
        assert "total_products" in data
        assert "total_services" in data
        assert "filters_applied" in data
        print(f"SUCCESS: Search endpoint returns {data['total_products']} products and {data['total_services']} services")
    
    def test_search_with_query(self):
        """Test search with query parameter"""
        response = requests.get(f"{BASE_URL}/api/search?q=african")
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        assert "services" in data
        assert data["filters_applied"].get("search") == "african"
        print(f"SUCCESS: Search with query 'african' returned {data['total_products']} products, {data['total_services']} services")
    
    def test_search_products_only(self):
        """Test search filtering to products only"""
        response = requests.get(f"{BASE_URL}/api/search?type=products")
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        assert len(data["services"]) == 0 or data["total_services"] == 0
        print(f"SUCCESS: Search type=products returned {data['total_products']} products only")
    
    def test_search_services_only(self):
        """Test search filtering to services only"""
        response = requests.get(f"{BASE_URL}/api/search?type=services")
        assert response.status_code == 200
        data = response.json()
        
        assert "services" in data
        assert len(data["products"]) == 0 or data["total_products"] == 0
        print(f"SUCCESS: Search type=services returned {data['total_services']} services only")
    
    def test_search_with_price_range(self):
        """Test search with min/max price filters"""
        response = requests.get(f"{BASE_URL}/api/search?min_price=10&max_price=100")
        assert response.status_code == 200
        data = response.json()
        
        # Verify all returned products are within price range
        for product in data["products"]:
            assert product["price"] >= 10
            assert product["price"] <= 100
        
        for service in data["services"]:
            assert service["price"] >= 10
            assert service["price"] <= 100
        
        print(f"SUCCESS: Price range filter (10-100) working correctly")
    
    def test_search_with_sort(self):
        """Test search with sort options"""
        # Test sort by price ascending
        response = requests.get(f"{BASE_URL}/api/search?type=products&sort_by=price&sort_order=asc")
        assert response.status_code == 200
        data = response.json()
        
        products = data["products"]
        if len(products) > 1:
            for i in range(len(products) - 1):
                assert products[i]["price"] <= products[i+1]["price"]
        
        print(f"SUCCESS: Sort by price ascending working correctly")
    
    def test_search_with_pagination(self):
        """Test search with skip and limit"""
        response = requests.get(f"{BASE_URL}/api/search?skip=0&limit=5")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["products"]) <= 5
        assert len(data["services"]) <= 5
        print(f"SUCCESS: Pagination (limit=5) working correctly")


class TestSearchSuggestions:
    """Tests for /api/search/suggestions endpoint"""
    
    def test_suggestions_endpoint(self):
        """Test search suggestions endpoint"""
        response = requests.get(f"{BASE_URL}/api/search/suggestions?q=hair")
        assert response.status_code == 200
        data = response.json()
        
        assert "suggestions" in data
        assert isinstance(data["suggestions"], list)
        print(f"SUCCESS: Suggestions endpoint returned {len(data['suggestions'])} suggestions for 'hair'")
    
    def test_suggestions_short_query(self):
        """Test suggestions with short query (< 2 chars)"""
        response = requests.get(f"{BASE_URL}/api/search/suggestions?q=a")
        assert response.status_code == 200
        data = response.json()
        
        assert "suggestions" in data
        assert len(data["suggestions"]) == 0  # Should return empty for short queries
        print(f"SUCCESS: Short query returns empty suggestions as expected")
    
    def test_suggestions_with_limit(self):
        """Test suggestions with limit parameter"""
        response = requests.get(f"{BASE_URL}/api/search/suggestions?q=african&limit=3")
        assert response.status_code == 200
        data = response.json()
        
        assert "suggestions" in data
        assert len(data["suggestions"]) <= 3
        print(f"SUCCESS: Suggestions limit working correctly")


class TestProductsFilters:
    """Tests for /api/products endpoint with filters"""
    
    def test_products_basic(self):
        """Test basic products endpoint"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"SUCCESS: Products endpoint returned {len(data)} products")
    
    def test_products_with_search(self):
        """Test products with search filter"""
        response = requests.get(f"{BASE_URL}/api/products?search=shea")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"SUCCESS: Products search returned {len(data)} results for 'shea'")
    
    def test_products_with_category_ids(self):
        """Test products with multiple category IDs"""
        # First get categories
        cat_response = requests.get(f"{BASE_URL}/api/categories")
        assert cat_response.status_code == 200
        categories = cat_response.json()
        
        if len(categories) >= 2:
            cat_ids = f"{categories[0]['id']},{categories[1]['id']}"
            response = requests.get(f"{BASE_URL}/api/products?category_ids={cat_ids}")
            assert response.status_code == 200
            data = response.json()
            print(f"SUCCESS: Products with multiple categories returned {len(data)} products")
        else:
            print("SKIP: Not enough categories to test multi-category filter")
    
    def test_products_with_price_range(self):
        """Test products with min/max price"""
        response = requests.get(f"{BASE_URL}/api/products?min_price=20&max_price=80")
        assert response.status_code == 200
        data = response.json()
        
        for product in data:
            assert product["price"] >= 20
            assert product["price"] <= 80
        
        print(f"SUCCESS: Products price range filter returned {len(data)} products")
    
    def test_products_with_rating_filter(self):
        """Test products with minimum rating filter"""
        response = requests.get(f"{BASE_URL}/api/products?min_rating=3")
        assert response.status_code == 200
        data = response.json()
        
        for product in data:
            assert product.get("average_rating", 0) >= 3
        
        print(f"SUCCESS: Products rating filter returned {len(data)} products with 3+ stars")
    
    def test_products_in_stock_filter(self):
        """Test products with in_stock filter"""
        response = requests.get(f"{BASE_URL}/api/products?in_stock=true")
        assert response.status_code == 200
        data = response.json()
        
        for product in data:
            assert product.get("stock", 0) > 0
        
        print(f"SUCCESS: In-stock filter returned {len(data)} products")
    
    def test_products_sort_by_price_asc(self):
        """Test products sorted by price ascending"""
        response = requests.get(f"{BASE_URL}/api/products?sort_by=price&sort_order=asc")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 1:
            for i in range(len(data) - 1):
                assert data[i]["price"] <= data[i+1]["price"]
        
        print(f"SUCCESS: Products sorted by price ascending")
    
    def test_products_sort_by_price_desc(self):
        """Test products sorted by price descending"""
        response = requests.get(f"{BASE_URL}/api/products?sort_by=price&sort_order=desc")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 1:
            for i in range(len(data) - 1):
                assert data[i]["price"] >= data[i+1]["price"]
        
        print(f"SUCCESS: Products sorted by price descending")
    
    def test_products_sort_by_name(self):
        """Test products sorted by name"""
        response = requests.get(f"{BASE_URL}/api/products?sort_by=name&sort_order=asc")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"SUCCESS: Products sorted by name returned {len(data)} products")


class TestServicesFilters:
    """Tests for /api/services endpoint with filters"""
    
    def test_services_basic(self):
        """Test basic services endpoint"""
        response = requests.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"SUCCESS: Services endpoint returned {len(data)} services")
    
    def test_services_with_search(self):
        """Test services with search filter"""
        response = requests.get(f"{BASE_URL}/api/services?search=hair")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"SUCCESS: Services search returned {len(data)} results for 'hair'")
    
    def test_services_with_location_type(self):
        """Test services with location_type filter"""
        for loc_type in ["onsite", "remote", "both"]:
            response = requests.get(f"{BASE_URL}/api/services?location_type={loc_type}")
            assert response.status_code == 200
            data = response.json()
            print(f"SUCCESS: Services with location_type={loc_type} returned {len(data)} services")
    
    def test_services_with_price_range(self):
        """Test services with min/max price"""
        response = requests.get(f"{BASE_URL}/api/services?min_price=30&max_price=150")
        assert response.status_code == 200
        data = response.json()
        
        for service in data:
            assert service["price"] >= 30
            assert service["price"] <= 150
        
        print(f"SUCCESS: Services price range filter returned {len(data)} services")
    
    def test_services_with_rating_filter(self):
        """Test services with minimum rating filter"""
        response = requests.get(f"{BASE_URL}/api/services?min_rating=3")
        assert response.status_code == 200
        data = response.json()
        
        for service in data:
            assert service.get("average_rating", 0) >= 3
        
        print(f"SUCCESS: Services rating filter returned {len(data)} services with 3+ stars")
    
    def test_services_sort_by_price(self):
        """Test services sorted by price"""
        response = requests.get(f"{BASE_URL}/api/services?sort_by=price&sort_order=asc")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 1:
            for i in range(len(data) - 1):
                assert data[i]["price"] <= data[i+1]["price"]
        
        print(f"SUCCESS: Services sorted by price ascending")
    
    def test_services_with_category_ids(self):
        """Test services with multiple category IDs"""
        cat_response = requests.get(f"{BASE_URL}/api/categories")
        assert cat_response.status_code == 200
        categories = cat_response.json()
        
        if len(categories) >= 2:
            cat_ids = f"{categories[0]['id']},{categories[1]['id']}"
            response = requests.get(f"{BASE_URL}/api/services?category_ids={cat_ids}")
            assert response.status_code == 200
            data = response.json()
            print(f"SUCCESS: Services with multiple categories returned {len(data)} services")
        else:
            print("SKIP: Not enough categories to test multi-category filter")


class TestCategoriesEndpoint:
    """Tests for /api/categories endpoint"""
    
    def test_categories_list(self):
        """Test categories endpoint returns list"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        if len(data) > 0:
            assert "id" in data[0]
            assert "name" in data[0]
        
        print(f"SUCCESS: Categories endpoint returned {len(data)} categories")


class TestVendorsEndpoint:
    """Tests for /api/vendors endpoint"""
    
    def test_vendors_list(self):
        """Test vendors endpoint returns list"""
        response = requests.get(f"{BASE_URL}/api/vendors")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"SUCCESS: Vendors endpoint returned {len(data)} vendors")
    
    def test_vendors_approved_filter(self):
        """Test vendors with is_approved filter"""
        response = requests.get(f"{BASE_URL}/api/vendors?is_approved=true")
        assert response.status_code == 200
        data = response.json()
        
        for vendor in data:
            assert vendor.get("is_approved") == True
        
        print(f"SUCCESS: Approved vendors filter returned {len(data)} vendors")


class TestServiceBookingFlow:
    """Tests for service booking flow (regression test)"""
    
    def test_service_detail(self):
        """Test service detail endpoint"""
        # First get a service
        services_response = requests.get(f"{BASE_URL}/api/services?limit=1")
        assert services_response.status_code == 200
        services = services_response.json()
        
        if len(services) > 0:
            service_id = services[0]["id"]
            response = requests.get(f"{BASE_URL}/api/services/{service_id}")
            assert response.status_code == 200
            data = response.json()
            
            assert data["id"] == service_id
            assert "name" in data
            assert "price" in data
            assert "vendor_name" in data
            print(f"SUCCESS: Service detail endpoint working for service: {data['name']}")
        else:
            print("SKIP: No services available to test detail endpoint")
    
    def test_booking_requires_auth(self):
        """Test that booking creation requires authentication"""
        services_response = requests.get(f"{BASE_URL}/api/services?limit=1")
        services = services_response.json()
        
        if len(services) > 0:
            booking_data = {
                "service_id": services[0]["id"],
                "booking_date": "2026-03-15",
                "booking_time": "10:00"
            }
            response = requests.post(f"{BASE_URL}/api/bookings", json=booking_data)
            assert response.status_code in [401, 403]  # Should require auth
            print(f"SUCCESS: Booking creation correctly requires authentication")
        else:
            print("SKIP: No services available to test booking")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
