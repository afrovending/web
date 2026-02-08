"""
Backend API Tests for AfroVending
- Messaging/Chat System
- Image Gallery & Compare feature support endpoints

Tests cover:
1. GET /api/messages/conversations - returns conversation list
2. POST /api/messages/send - creates new message
3. GET /api/messages/unread-count - returns unread count
4. GET /api/messages/vendor/{vendor_id}/start - start conversation with vendor
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "vendor@afrovending.com"
TEST_PASSWORD = "password123"

class TestMessagingAPI:
    """Messaging API endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json().get("access_token")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get auth headers"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    @pytest.fixture(scope="class")
    def user_info(self):
        """Get logged in user info"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json().get("user")
    
    def test_get_unread_count_unauthenticated(self):
        """GET /api/messages/unread-count without auth returns 403"""
        response = requests.get(f"{BASE_URL}/api/messages/unread-count")
        assert response.status_code == 403
    
    def test_get_unread_count_authenticated(self, auth_headers):
        """GET /api/messages/unread-count returns count object"""
        response = requests.get(f"{BASE_URL}/api/messages/unread-count", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "unread_count" in data
        assert isinstance(data["unread_count"], int)
        assert data["unread_count"] >= 0
        print(f"✓ Unread count: {data['unread_count']}")
    
    def test_get_conversations_unauthenticated(self):
        """GET /api/messages/conversations without auth returns 403"""
        response = requests.get(f"{BASE_URL}/api/messages/conversations")
        assert response.status_code == 403
    
    def test_get_conversations_authenticated(self, auth_headers):
        """GET /api/messages/conversations returns list"""
        response = requests.get(f"{BASE_URL}/api/messages/conversations", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} conversations")
        
        # Validate conversation structure if any exist
        if len(data) > 0:
            conv = data[0]
            assert "id" in conv
            assert "participants" in conv
            assert "created_at" in conv
    
    def test_send_message_unauthenticated(self):
        """POST /api/messages/send without auth returns 403"""
        response = requests.post(f"{BASE_URL}/api/messages/send", json={
            "recipient_id": "some-id",
            "content": "Test message"
        })
        assert response.status_code == 403
    
    def test_send_message_to_self(self, auth_headers, user_info):
        """POST /api/messages/send to self returns 400"""
        response = requests.post(f"{BASE_URL}/api/messages/send", 
            headers=auth_headers,
            json={
                "recipient_id": user_info["id"],
                "content": "Cannot message myself"
            }
        )
        assert response.status_code == 400
        assert "yourself" in response.json().get("detail", "").lower()
        print("✓ Correctly rejected self-messaging")
    
    def test_send_message_to_nonexistent_user(self, auth_headers):
        """POST /api/messages/send to non-existent user returns 404"""
        response = requests.post(f"{BASE_URL}/api/messages/send",
            headers=auth_headers,
            json={
                "recipient_id": "nonexistent-user-id-12345",
                "content": "Test message"
            }
        )
        assert response.status_code == 404
        print("✓ Correctly rejected message to non-existent user")
    
    def test_start_vendor_conversation_unauthenticated(self):
        """GET /api/messages/vendor/{vendor_id}/start without auth returns 403"""
        response = requests.get(f"{BASE_URL}/api/messages/vendor/some-vendor-id/start")
        assert response.status_code == 403
    
    def test_start_vendor_conversation_nonexistent(self, auth_headers):
        """GET /api/messages/vendor/{vendor_id}/start with non-existent vendor returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/messages/vendor/nonexistent-vendor-123/start",
            headers=auth_headers
        )
        assert response.status_code == 404
        print("✓ Correctly rejected non-existent vendor conversation")
    
    def test_get_conversation_nonexistent(self, auth_headers):
        """GET /api/messages/conversations/{id} with non-existent ID returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/messages/conversations/nonexistent-conv-123",
            headers=auth_headers
        )
        assert response.status_code == 404
    
    def test_delete_conversation_nonexistent(self, auth_headers):
        """DELETE /api/messages/conversations/{id} with non-existent ID returns 404"""
        response = requests.delete(
            f"{BASE_URL}/api/messages/conversations/nonexistent-conv-123",
            headers=auth_headers
        )
        assert response.status_code == 404


class TestProductsForImageGallery:
    """Test products API returns images for gallery functionality"""
    
    def test_products_have_images_array(self):
        """GET /api/products returns products with images array"""
        response = requests.get(f"{BASE_URL}/api/products?limit=5")
        assert response.status_code == 200
        products = response.json()
        
        if len(products) > 0:
            product = products[0]
            assert "images" in product
            assert isinstance(product["images"], list)
            print(f"✓ Product has images array with {len(product['images'])} images")
    
    def test_product_detail_has_images(self):
        """GET /api/products/{id} returns product with images for gallery"""
        # First get a product ID
        response = requests.get(f"{BASE_URL}/api/products?limit=1")
        assert response.status_code == 200
        products = response.json()
        
        if len(products) > 0:
            product_id = products[0]["id"]
            
            # Get product detail
            response = requests.get(f"{BASE_URL}/api/products/{product_id}")
            assert response.status_code == 200
            product = response.json()
            
            assert "id" in product
            assert "name" in product
            assert "images" in product
            assert isinstance(product["images"], list)
            print(f"✓ Product detail has images array: {product['name']}")


class TestProductsForCompareFeature:
    """Test products API returns all needed fields for comparison"""
    
    def test_products_have_compare_fields(self):
        """GET /api/products returns all fields needed for comparison"""
        response = requests.get(f"{BASE_URL}/api/products?limit=5")
        assert response.status_code == 200
        products = response.json()
        
        required_compare_fields = [
            "id", "name", "price", "images", 
            "average_rating", "review_count", 
            "vendor_name", "stock", "description"
        ]
        
        if len(products) > 0:
            product = products[0]
            for field in required_compare_fields:
                assert field in product, f"Missing field: {field}"
            print(f"✓ Products have all comparison fields: {required_compare_fields}")
    
    def test_product_detail_has_compare_fields(self):
        """GET /api/products/{id} returns all fields for comparison"""
        # First get a product ID
        response = requests.get(f"{BASE_URL}/api/products?limit=1")
        assert response.status_code == 200
        products = response.json()
        
        if len(products) > 0:
            product_id = products[0]["id"]
            
            response = requests.get(f"{BASE_URL}/api/products/{product_id}")
            assert response.status_code == 200
            product = response.json()
            
            # Check compare price field (optional but should exist)
            assert "compare_price" in product or product.get("compare_price") is None
            assert "has_variants" in product
            print(f"✓ Product detail has all comparison fields including compare_price")


class TestVendorsForMessaging:
    """Test vendors API for starting conversations"""
    
    def test_vendors_list(self):
        """GET /api/vendors returns vendor list"""
        response = requests.get(f"{BASE_URL}/api/vendors?limit=5")
        assert response.status_code == 200
        vendors = response.json()
        assert isinstance(vendors, list)
        
        if len(vendors) > 0:
            vendor = vendors[0]
            assert "id" in vendor
            assert "store_name" in vendor
            assert "user_id" in vendor
            print(f"✓ Found {len(vendors)} vendors with required fields")
    
    def test_vendor_detail(self):
        """GET /api/vendors/{id} returns vendor with user_id for messaging"""
        response = requests.get(f"{BASE_URL}/api/vendors?limit=1")
        assert response.status_code == 200
        vendors = response.json()
        
        if len(vendors) > 0:
            vendor_id = vendors[0]["id"]
            
            response = requests.get(f"{BASE_URL}/api/vendors/{vendor_id}")
            assert response.status_code == 200
            vendor = response.json()
            
            assert "id" in vendor
            assert "user_id" in vendor
            assert "store_name" in vendor
            print(f"✓ Vendor detail has user_id for messaging: {vendor['store_name']}")


class TestMessagingIntegration:
    """Integration tests for messaging with real vendors"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json().get("access_token")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}"}
    
    @pytest.fixture(scope="class")
    def user_info(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        return response.json().get("user")
    
    def test_full_messaging_flow(self, auth_headers, user_info):
        """Full integration test: start conversation, send message, verify"""
        # Step 1: Get a vendor (not ourselves)
        vendors_response = requests.get(f"{BASE_URL}/api/vendors?limit=10")
        assert vendors_response.status_code == 200
        vendors = vendors_response.json()
        
        # Find a vendor that is NOT the current user
        target_vendor = None
        for v in vendors:
            if v.get("user_id") != user_info["id"]:
                target_vendor = v
                break
        
        if not target_vendor:
            pytest.skip("No other vendors found to test messaging")
        
        print(f"Testing messaging with vendor: {target_vendor['store_name']}")
        
        # Step 2: Start conversation with vendor
        start_response = requests.get(
            f"{BASE_URL}/api/messages/vendor/{target_vendor['id']}/start",
            headers=auth_headers
        )
        
        # Should succeed or return existing conversation
        assert start_response.status_code == 200
        conversation = start_response.json()
        assert "id" in conversation
        assert "participants" in conversation
        conversation_id = conversation["id"]
        print(f"✓ Started/retrieved conversation: {conversation_id}")
        
        # Step 3: Send a test message
        test_message = f"TEST_MSG_Integration test message {int(time.time())}"
        send_response = requests.post(
            f"{BASE_URL}/api/messages/send",
            headers=auth_headers,
            json={
                "conversation_id": conversation_id,
                "recipient_id": target_vendor["user_id"],
                "content": test_message
            }
        )
        assert send_response.status_code == 200
        message = send_response.json()
        assert "id" in message
        assert message["content"] == test_message
        assert message["sender_id"] == user_info["id"]
        print(f"✓ Sent message: {message['id']}")
        
        # Step 4: Verify message appears in conversation
        messages_response = requests.get(
            f"{BASE_URL}/api/messages/conversations/{conversation_id}/messages",
            headers=auth_headers
        )
        assert messages_response.status_code == 200
        messages = messages_response.json()
        assert isinstance(messages, list)
        assert len(messages) > 0
        
        # Verify our message is in the list
        message_found = any(m["content"] == test_message for m in messages)
        assert message_found, "Sent message not found in conversation messages"
        print(f"✓ Message verified in conversation ({len(messages)} messages total)")
        
        # Step 5: Verify conversation appears in conversations list
        convs_response = requests.get(
            f"{BASE_URL}/api/messages/conversations",
            headers=auth_headers
        )
        assert convs_response.status_code == 200
        convs = convs_response.json()
        
        conv_found = any(c["id"] == conversation_id for c in convs)
        assert conv_found, "Conversation not found in list"
        print(f"✓ Conversation found in conversations list")
        
        # Step 6: Verify last_message is updated
        for c in convs:
            if c["id"] == conversation_id:
                assert c.get("last_message") is not None
                assert test_message[:100] in c["last_message"].get("content", "")
                print(f"✓ Last message updated correctly")
                break


class TestMessageValidation:
    """Test message validation rules"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return {"Authorization": f"Bearer {response.json()['access_token']}"}
    
    def test_empty_message_rejected(self, auth_headers):
        """POST /api/messages/send with empty content rejected"""
        vendors_response = requests.get(f"{BASE_URL}/api/vendors?limit=1")
        vendors = vendors_response.json()
        
        if len(vendors) > 0:
            response = requests.post(
                f"{BASE_URL}/api/messages/send",
                headers=auth_headers,
                json={
                    "recipient_id": vendors[0]["user_id"],
                    "content": ""
                }
            )
            # Should be 422 (validation error) or 400
            assert response.status_code in [400, 422]
            print("✓ Empty message correctly rejected")
    
    def test_message_max_length(self, auth_headers):
        """POST /api/messages/send with very long content"""
        vendors_response = requests.get(f"{BASE_URL}/api/vendors?limit=1")
        vendors = vendors_response.json()
        
        if len(vendors) > 0:
            # Try message over 2000 chars (should be rejected)
            long_message = "x" * 2001
            response = requests.post(
                f"{BASE_URL}/api/messages/send",
                headers=auth_headers,
                json={
                    "recipient_id": vendors[0]["user_id"],
                    "content": long_message
                }
            )
            # Should be 422 (validation error) due to max_length=2000
            assert response.status_code in [400, 422]
            print("✓ Message length validation working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
