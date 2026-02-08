"""
Test shipping addresses CRUD endpoints for Afrovending
Tests: GET /api/user/addresses, POST /api/user/addresses, 
       PUT /api/user/addresses/:id, DELETE /api/user/addresses/:id,
       PUT /api/user/addresses/:id/default
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_EMAIL = "vendor@afrovending.com"
TEST_PASSWORD = "password123"


class TestShippingAddresses:
    """Test shipping addresses CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get authentication token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("access_token")  # API returns access_token not token
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            self.authenticated = True
        else:
            self.authenticated = False
            pytest.skip("Authentication failed - skipping address tests")
    
    def test_01_get_addresses_empty_or_existing(self):
        """Test GET /api/user/addresses - should return list"""
        response = self.session.get(f"{BASE_URL}/api/user/addresses")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Expected list of addresses"
        print(f"Found {len(data)} existing addresses")
    
    def test_02_create_address(self):
        """Test POST /api/user/addresses - create new address"""
        test_address = {
            "label": "TEST_Home",
            "recipient_name": "Test User",
            "street_address": "123 Test Street",
            "apartment": "Apt 4B",
            "city": "Lagos",
            "state": "Lagos",
            "postal_code": "100001",
            "country": "Nigeria",
            "phone": "+234 123 456 7890",
            "is_default": False
        }
        
        response = self.session.post(f"{BASE_URL}/api/user/addresses", json=test_address)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "id" in data, "Response should include address ID"
        assert data["label"] == test_address["label"]
        assert data["recipient_name"] == test_address["recipient_name"]
        assert data["street_address"] == test_address["street_address"]
        assert data["city"] == test_address["city"]
        assert data["country"] == test_address["country"]
        
        # Store ID for subsequent tests
        self.__class__.created_address_id = data["id"]
        print(f"Created address with ID: {data['id']}")
    
    def test_03_verify_address_persisted(self):
        """Test GET to verify address was persisted"""
        address_id = getattr(self.__class__, 'created_address_id', None)
        if not address_id:
            pytest.skip("No address created in previous test")
        
        response = self.session.get(f"{BASE_URL}/api/user/addresses")
        assert response.status_code == 200
        
        addresses = response.json()
        address_found = any(addr["id"] == address_id for addr in addresses)
        assert address_found, f"Address {address_id} not found in list"
        print(f"Verified address {address_id} exists in list")
    
    def test_04_get_single_address(self):
        """Test GET /api/user/addresses/:id - get specific address"""
        address_id = getattr(self.__class__, 'created_address_id', None)
        if not address_id:
            pytest.skip("No address created in previous test")
        
        response = self.session.get(f"{BASE_URL}/api/user/addresses/{address_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["id"] == address_id
        assert data["label"] == "TEST_Home"
        print(f"Successfully retrieved address: {data['label']}")
    
    def test_05_update_address(self):
        """Test PUT /api/user/addresses/:id - update address"""
        address_id = getattr(self.__class__, 'created_address_id', None)
        if not address_id:
            pytest.skip("No address created in previous test")
        
        update_data = {
            "label": "TEST_Updated_Home",
            "city": "Abuja"
        }
        
        response = self.session.put(f"{BASE_URL}/api/user/addresses/{address_id}", json=update_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["label"] == "TEST_Updated_Home"
        assert data["city"] == "Abuja"
        print(f"Updated address: label={data['label']}, city={data['city']}")
    
    def test_06_verify_update_persisted(self):
        """Verify update was persisted via GET"""
        address_id = getattr(self.__class__, 'created_address_id', None)
        if not address_id:
            pytest.skip("No address created in previous test")
        
        response = self.session.get(f"{BASE_URL}/api/user/addresses/{address_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["label"] == "TEST_Updated_Home", "Update was not persisted"
        assert data["city"] == "Abuja", "City update was not persisted"
        print("Update verified in database")
    
    def test_07_create_second_address(self):
        """Create second address for default testing"""
        test_address = {
            "label": "TEST_Work",
            "recipient_name": "Test Worker",
            "street_address": "456 Office Road",
            "city": "Port Harcourt",
            "state": "Rivers",
            "postal_code": "500001",
            "country": "Nigeria",
            "is_default": False
        }
        
        response = self.session.post(f"{BASE_URL}/api/user/addresses", json=test_address)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        self.__class__.second_address_id = data["id"]
        print(f"Created second address with ID: {data['id']}")
    
    def test_08_set_default_address(self):
        """Test PUT /api/user/addresses/:id/default - set as default"""
        address_id = getattr(self.__class__, 'second_address_id', None)
        if not address_id:
            pytest.skip("No second address created")
        
        response = self.session.put(f"{BASE_URL}/api/user/addresses/{address_id}/default")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["is_default"] == True, "Address should be set as default"
        print(f"Set address {address_id} as default")
    
    def test_09_verify_default_updated(self):
        """Verify only one address is default"""
        response = self.session.get(f"{BASE_URL}/api/user/addresses")
        assert response.status_code == 200
        
        addresses = response.json()
        default_count = sum(1 for addr in addresses if addr.get("is_default"))
        assert default_count == 1, f"Expected 1 default address, found {default_count}"
        
        default_addr = next((addr for addr in addresses if addr.get("is_default")), None)
        assert default_addr["id"] == self.__class__.second_address_id
        print(f"Verified: only address {default_addr['id']} is default")
    
    def test_10_delete_address(self):
        """Test DELETE /api/user/addresses/:id"""
        address_id = getattr(self.__class__, 'created_address_id', None)
        if not address_id:
            pytest.skip("No address to delete")
        
        response = self.session.delete(f"{BASE_URL}/api/user/addresses/{address_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data
        print(f"Deleted address: {address_id}")
    
    def test_11_verify_delete(self):
        """Verify address was deleted"""
        address_id = getattr(self.__class__, 'created_address_id', None)
        if not address_id:
            pytest.skip("No address to verify")
        
        response = self.session.get(f"{BASE_URL}/api/user/addresses/{address_id}")
        assert response.status_code == 404, f"Expected 404 for deleted address, got {response.status_code}"
        print(f"Verified: address {address_id} no longer exists")
    
    def test_12_cleanup_test_addresses(self):
        """Cleanup: Delete test addresses created during tests"""
        response = self.session.get(f"{BASE_URL}/api/user/addresses")
        if response.status_code != 200:
            pytest.skip("Could not get addresses for cleanup")
        
        addresses = response.json()
        deleted = 0
        
        for addr in addresses:
            if addr.get("label", "").startswith("TEST_"):
                del_response = self.session.delete(f"{BASE_URL}/api/user/addresses/{addr['id']}")
                if del_response.status_code == 200:
                    deleted += 1
        
        print(f"Cleanup: deleted {deleted} test addresses")


class TestShippingAddressesValidation:
    """Test validation and error cases"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("access_token")  # API returns access_token not token
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip("Authentication failed")
    
    def test_create_address_missing_required_field(self):
        """Test validation: missing required fields"""
        incomplete_address = {
            "label": "Incomplete",
            # Missing recipient_name, street_address, city, state, postal_code, country
        }
        
        response = self.session.post(f"{BASE_URL}/api/user/addresses", json=incomplete_address)
        assert response.status_code == 422, f"Expected 422 validation error, got {response.status_code}"
        print("Validation: missing fields correctly rejected")
    
    def test_get_nonexistent_address(self):
        """Test GET for non-existent address returns 404"""
        fake_id = str(uuid.uuid4())
        response = self.session.get(f"{BASE_URL}/api/user/addresses/{fake_id}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Correctly returned 404 for non-existent address")
    
    def test_update_nonexistent_address(self):
        """Test PUT for non-existent address returns 404"""
        fake_id = str(uuid.uuid4())
        response = self.session.put(f"{BASE_URL}/api/user/addresses/{fake_id}", json={"label": "Test"})
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Correctly returned 404 for update of non-existent address")
    
    def test_delete_nonexistent_address(self):
        """Test DELETE for non-existent address returns 404"""
        fake_id = str(uuid.uuid4())
        response = self.session.delete(f"{BASE_URL}/api/user/addresses/{fake_id}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Correctly returned 404 for delete of non-existent address")


class TestAddressesUnauthenticated:
    """Test endpoints without authentication"""
    
    def test_get_addresses_requires_auth(self):
        """GET /api/user/addresses should require auth"""
        response = requests.get(f"{BASE_URL}/api/user/addresses")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("GET addresses correctly requires authentication")
    
    def test_create_address_requires_auth(self):
        """POST /api/user/addresses should require auth"""
        response = requests.post(f"{BASE_URL}/api/user/addresses", json={
            "label": "Test",
            "recipient_name": "Test",
            "street_address": "123 Test",
            "city": "Test",
            "state": "Test",
            "postal_code": "12345",
            "country": "Test"
        })
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("POST address correctly requires authentication")
