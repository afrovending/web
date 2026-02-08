#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class AfrovendingAPITester:
    def __init__(self, base_url="https://social-login-test.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.vendor_id = None
        self.product_id = None
        self.category_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None) -> tuple[bool, Dict]:
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    'test': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })
                try:
                    return False, response.json()
                except:
                    return False, {'error': response.text}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'test': name,
                'error': str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        success, response = self.run_test("Health Check", "GET", "health", 200)
        return success

    def test_get_categories(self):
        """Test categories endpoint"""
        success, response = self.run_test("Get Categories", "GET", "categories", 200)
        if success and response:
            categories = response if isinstance(response, list) else []
            if categories:
                self.category_id = categories[0].get('id')
                print(f"   Found {len(categories)} categories")
        return success

    def test_register_customer(self):
        """Test customer registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "first_name": "Test",
            "last_name": "Customer",
            "email": f"customer_{timestamp}@test.com",
            "password": "TestPass123!",
            "role": "customer"
        }
        
        success, response = self.run_test("Register Customer", "POST", "auth/register", 200, user_data)
        if success and response:
            self.token = response.get('access_token')
            self.user_id = response.get('user', {}).get('id')
            print(f"   User ID: {self.user_id}")
        return success

    def test_register_vendor(self):
        """Test vendor registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        vendor_data = {
            "first_name": "Test",
            "last_name": "Vendor",
            "email": f"vendor_{timestamp}@test.com",
            "password": "TestPass123!",
            "role": "vendor"
        }
        
        success, response = self.run_test("Register Vendor", "POST", "auth/register", 200, vendor_data)
        if success and response:
            vendor_token = response.get('access_token')
            vendor_user_id = response.get('user', {}).get('id')
            
            # Create vendor profile
            vendor_profile = {
                "store_name": f"Test Store {timestamp}",
                "description": "A test vendor store",
                "country": "Nigeria",
                "city": "Lagos"
            }
            
            # Temporarily use vendor token
            old_token = self.token
            self.token = vendor_token
            
            vendor_success, vendor_response = self.run_test("Create Vendor Profile", "POST", "vendors", 200, vendor_profile)
            if vendor_success and vendor_response:
                self.vendor_id = vendor_response.get('id')
                print(f"   Vendor ID: {self.vendor_id}")
            
            # Restore customer token
            self.token = old_token
            return vendor_success
        return success

    def test_login(self):
        """Test login with registered customer"""
        if not self.user_id:
            return False
            
        timestamp = datetime.now().strftime('%H%M%S')
        login_data = {
            "email": f"customer_{timestamp}@test.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test("Login Customer", "POST", "auth/login", 200, login_data)
        if success and response:
            self.token = response.get('access_token')
        return success

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test("Get Current User", "GET", "auth/me", 200)
        return success

    def test_get_products(self):
        """Test get products"""
        success, response = self.run_test("Get Products", "GET", "products", 200)
        if success and response:
            products = response if isinstance(response, list) else []
            print(f"   Found {len(products)} products")
        return success

    def test_get_featured_products(self):
        """Test get featured products"""
        success, response = self.run_test("Get Featured Products", "GET", "products/featured", 200)
        return success

    def test_get_vendors(self):
        """Test get vendors"""
        success, response = self.run_test("Get Vendors", "GET", "vendors", 200)
        return success

    def test_get_featured_vendors(self):
        """Test get featured vendors"""
        success, response = self.run_test("Get Featured Vendors", "GET", "vendors/featured", 200)
        return success

    def test_cart_operations(self):
        """Test cart operations"""
        # Get cart (should be empty)
        success, response = self.run_test("Get Empty Cart", "GET", "cart", 200)
        if not success:
            return False
            
        # Try to add item to cart (need a product first)
        if self.product_id:
            cart_item = {
                "product_id": self.product_id,
                "quantity": 2
            }
            success, response = self.run_test("Add to Cart", "POST", "cart/items", 200, cart_item)
            if success:
                # Get cart again
                success, response = self.run_test("Get Cart with Items", "GET", "cart", 200)
        
        return success

    def test_wishlist_operations(self):
        """Test wishlist operations"""
        # Get wishlist (should be empty)
        success, response = self.run_test("Get Empty Wishlist", "GET", "wishlist", 200)
        if not success:
            return False
            
        # Try to add item to wishlist (need a product first)
        if self.product_id:
            success, response = self.run_test("Add to Wishlist", "POST", f"wishlist/{self.product_id}", 200)
            if success:
                # Get wishlist again
                success, response = self.run_test("Get Wishlist with Items", "GET", "wishlist", 200)
        
        return success

    def test_stripe_checkout_init(self):
        """Test Stripe checkout initialization"""
        checkout_data = {
            "payment_method": "stripe",
            "origin_url": "https://social-login-test.preview.emergentagent.com"
        }
        
        # This might fail if cart is empty, but we want to test the endpoint
        success, response = self.run_test("Initialize Stripe Checkout", "POST", "checkout/stripe", 400, checkout_data)
        # Expecting 400 because cart is likely empty
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Afrovending API Tests")
        print("=" * 50)
        
        # Basic endpoints
        self.test_health_check()
        self.test_get_categories()
        
        # Authentication
        self.test_register_customer()
        self.test_register_vendor()
        self.test_login()
        self.test_get_me()
        
        # Products and vendors
        self.test_get_products()
        self.test_get_featured_products()
        self.test_get_vendors()
        self.test_get_featured_vendors()
        
        # User features (require authentication)
        if self.token:
            self.test_cart_operations()
            self.test_wishlist_operations()
            self.test_stripe_checkout_init()
        
        # Print results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"   - {test}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = AfrovendingAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())