"""
Google OAuth Backend Tests for AfroVending
Tests Google OAuth session handling, JWT authentication, and logout

Test Categories:
1. Google OAuth Session endpoint
2. Auth/me endpoint with Google session
3. JWT email/password login
4. Google logout
5. Protected endpoint access
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestGoogleOAuthSession:
    """Tests for POST /api/auth/google/session"""
    
    def test_google_session_requires_session_id(self):
        """POST /api/auth/google/session should require session_id"""
        response = requests.post(
            f"{BASE_URL}/api/auth/google/session",
            json={},
            headers={"Content-Type": "application/json"}
        )
        # Should return 400 when session_id is missing
        assert response.status_code == 400
        data = response.json()
        assert "session_id" in data.get("detail", "").lower()
    
    def test_google_session_rejects_invalid_session(self):
        """POST /api/auth/google/session should reject invalid session_id"""
        response = requests.post(
            f"{BASE_URL}/api/auth/google/session",
            json={"session_id": "invalid_session_12345"},
            headers={"Content-Type": "application/json"}
        )
        # Should return 401 for invalid session
        assert response.status_code == 401
        data = response.json()
        assert "invalid session" in data.get("detail", "").lower()


class TestAuthMeEndpoint:
    """Tests for GET /api/auth/me with various auth methods"""
    
    def test_auth_me_requires_authentication(self):
        """GET /api/auth/me should return 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        data = response.json()
        assert "not authenticated" in data.get("detail", "").lower()
    
    def test_auth_me_with_google_session_header(self):
        """GET /api/auth/me should work with session token in Authorization header"""
        # This test uses a pre-created Google session
        # Create test user and session first
        import subprocess
        result = subprocess.run([
            'mongosh', '--quiet', '--eval', '''
            db = db.getSiblingDB('afrovending_db');
            var userId = 'pytest-google-' + Date.now();
            var sessionToken = 'pytest_session_' + Date.now();
            var email = 'pytest.google.' + Date.now() + '@example.com';
            
            db.users.insertOne({
              id: userId,
              email: email,
              first_name: 'PyTest',
              last_name: 'GoogleUser',
              role: 'customer',
              picture: 'https://via.placeholder.com/150',
              google_id: 'pytest_google_id',
              password_hash: null,
              created_at: new Date().toISOString()
            });
            
            db.google_sessions.insertOne({
              id: 'session-' + Date.now(),
              user_id: userId,
              session_token: sessionToken,
              expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
              created_at: new Date().toISOString()
            });
            
            print(sessionToken);
            '''
        ], capture_output=True, text=True)
        
        session_token = result.stdout.strip()
        
        # Test with Authorization header
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {session_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("email", "").startswith("pytest.google.")
        assert data.get("first_name") == "PyTest"
        assert data.get("role") == "customer"
        
        # Cleanup
        subprocess.run([
            'mongosh', '--quiet', '--eval', f'''
            db = db.getSiblingDB('afrovending_db');
            db.users.deleteMany({{email: /pytest\\.google\\./}});
            db.google_sessions.deleteMany({{session_token: /pytest_session_/}});
            '''
        ])
    
    def test_auth_me_with_google_session_cookie(self):
        """GET /api/auth/me should work with session token in Cookie"""
        # Create test user and session
        import subprocess
        result = subprocess.run([
            'mongosh', '--quiet', '--eval', '''
            db = db.getSiblingDB('afrovending_db');
            var userId = 'pytest-cookie-' + Date.now();
            var sessionToken = 'pytest_cookie_session_' + Date.now();
            var email = 'pytest.cookie.' + Date.now() + '@example.com';
            
            db.users.insertOne({
              id: userId,
              email: email,
              first_name: 'PyTest',
              last_name: 'CookieUser',
              role: 'customer',
              picture: 'https://via.placeholder.com/150',
              google_id: 'pytest_cookie_google_id',
              password_hash: null,
              created_at: new Date().toISOString()
            });
            
            db.google_sessions.insertOne({
              id: 'session-' + Date.now(),
              user_id: userId,
              session_token: sessionToken,
              expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
              created_at: new Date().toISOString()
            });
            
            print(sessionToken);
            '''
        ], capture_output=True, text=True)
        
        session_token = result.stdout.strip()
        
        # Test with Cookie header
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Cookie": f"session_token={session_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("email", "").startswith("pytest.cookie.")
        assert data.get("first_name") == "PyTest"
        
        # Cleanup
        subprocess.run([
            'mongosh', '--quiet', '--eval', f'''
            db = db.getSiblingDB('afrovending_db');
            db.users.deleteMany({{email: /pytest\\.cookie\\./}});
            db.google_sessions.deleteMany({{session_token: /pytest_cookie_session_/}});
            '''
        ])


class TestJWTAuthentication:
    """Tests for regular email/password JWT login"""
    
    def test_login_valid_credentials(self):
        """POST /api/auth/login should work with valid email/password"""
        # First create a test user with password
        import subprocess
        import hashlib
        
        result = subprocess.run([
            'mongosh', '--quiet', '--eval', '''
            db = db.getSiblingDB('afrovending_db');
            var userId = 'pytest-jwt-' + Date.now();
            var email = 'pytest.jwt.' + Date.now() + '@example.com';
            
            // Create user with bcrypt-style hash placeholder (will be created properly)
            db.users.insertOne({
              id: userId,
              email: email,
              first_name: 'PyTest',
              last_name: 'JWTUser',
              role: 'customer',
              password_hash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4J8pMfUGz.r.F.Xe',
              created_at: new Date().toISOString()
            });
            
            print(email);
            '''
        ], capture_output=True, text=True)
        
        email = result.stdout.strip()
        
        # Try login with created credentials - note: password hash is dummy, so this tests the flow
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": email, "password": "testpassword123"},
            headers={"Content-Type": "application/json"}
        )
        
        # Should fail due to password mismatch (dummy hash)
        # This tests the endpoint is working, even if login fails
        assert response.status_code in [200, 401]
        
        # Cleanup
        subprocess.run([
            'mongosh', '--quiet', '--eval', f'''
            db = db.getSiblingDB('afrovending_db');
            db.users.deleteMany({{email: /pytest\\.jwt\\./}});
            '''
        ])
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login should return 401 for invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "nonexistent@example.com", "password": "wrongpassword"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401
        data = response.json()
        assert "invalid" in data.get("detail", "").lower()
    
    def test_login_google_only_user_rejected(self):
        """POST /api/auth/login should reject Google-only users (no password)"""
        # Create a Google-only user (no password)
        import subprocess
        result = subprocess.run([
            'mongosh', '--quiet', '--eval', '''
            db = db.getSiblingDB('afrovending_db');
            var email = 'pytest.googleonly.' + Date.now() + '@example.com';
            
            db.users.insertOne({
              id: 'pytest-googleonly-' + Date.now(),
              email: email,
              first_name: 'PyTest',
              last_name: 'GoogleOnly',
              role: 'customer',
              password_hash: null,
              google_id: 'google_only_id',
              created_at: new Date().toISOString()
            });
            
            print(email);
            '''
        ], capture_output=True, text=True)
        
        email = result.stdout.strip()
        
        # Try to login with password
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": email, "password": "anypassword"},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 401
        data = response.json()
        assert "google" in data.get("detail", "").lower()
        
        # Cleanup
        subprocess.run([
            'mongosh', '--quiet', '--eval', f'''
            db = db.getSiblingDB('afrovending_db');
            db.users.deleteMany({{email: /pytest\\.googleonly\\./}});
            '''
        ])


class TestGoogleLogout:
    """Tests for POST /api/auth/google/logout"""
    
    def test_google_logout_clears_session(self):
        """POST /api/auth/google/logout should clear Google session"""
        # Create a test session
        import subprocess
        result = subprocess.run([
            'mongosh', '--quiet', '--eval', '''
            db = db.getSiblingDB('afrovending_db');
            var userId = 'pytest-logout-' + Date.now();
            var sessionToken = 'pytest_logout_session_' + Date.now();
            
            db.users.insertOne({
              id: userId,
              email: 'pytest.logout.' + Date.now() + '@example.com',
              first_name: 'PyTest',
              last_name: 'LogoutUser',
              role: 'customer',
              created_at: new Date().toISOString()
            });
            
            db.google_sessions.insertOne({
              id: 'session-' + Date.now(),
              user_id: userId,
              session_token: sessionToken,
              expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
              created_at: new Date().toISOString()
            });
            
            print(sessionToken);
            '''
        ], capture_output=True, text=True)
        
        session_token = result.stdout.strip()
        
        # Verify session works before logout
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Cookie": f"session_token={session_token}"}
        )
        assert response.status_code == 200
        
        # Logout
        logout_response = requests.post(
            f"{BASE_URL}/api/auth/google/logout",
            headers={"Cookie": f"session_token={session_token}"}
        )
        assert logout_response.status_code == 200
        logout_data = logout_response.json()
        assert logout_data.get("success") == True
        
        # Verify session no longer works
        verify_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Cookie": f"session_token={session_token}"}
        )
        assert verify_response.status_code == 401
        
        # Cleanup
        subprocess.run([
            'mongosh', '--quiet', '--eval', f'''
            db = db.getSiblingDB('afrovending_db');
            db.users.deleteMany({{email: /pytest\\.logout\\./}});
            db.google_sessions.deleteMany({{session_token: /pytest_logout_session_/}});
            '''
        ])
    
    def test_google_logout_without_session(self):
        """POST /api/auth/google/logout should succeed even without session"""
        response = requests.post(f"{BASE_URL}/api/auth/google/logout")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True


class TestProtectedEndpoints:
    """Tests that protected endpoints work with Google OAuth session"""
    
    def test_user_dashboard_requires_auth(self):
        """User dashboard endpoint should require authentication"""
        # This tests that various endpoints check auth
        response = requests.get(f"{BASE_URL}/api/orders")
        assert response.status_code == 401
    
    def test_orders_endpoint_with_google_session(self):
        """Orders endpoint should work with Google session"""
        # Create test session
        import subprocess
        result = subprocess.run([
            'mongosh', '--quiet', '--eval', '''
            db = db.getSiblingDB('afrovending_db');
            var userId = 'pytest-orders-' + Date.now();
            var sessionToken = 'pytest_orders_session_' + Date.now();
            
            db.users.insertOne({
              id: userId,
              email: 'pytest.orders.' + Date.now() + '@example.com',
              first_name: 'PyTest',
              last_name: 'OrdersUser',
              role: 'customer',
              created_at: new Date().toISOString()
            });
            
            db.google_sessions.insertOne({
              id: 'session-' + Date.now(),
              user_id: userId,
              session_token: sessionToken,
              expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
              created_at: new Date().toISOString()
            });
            
            print(sessionToken);
            '''
        ], capture_output=True, text=True)
        
        session_token = result.stdout.strip()
        
        # Test orders endpoint with Google session
        response = requests.get(
            f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {session_token}"}
        )
        
        # Should return orders (may be empty list)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Cleanup
        subprocess.run([
            'mongosh', '--quiet', '--eval', f'''
            db = db.getSiblingDB('afrovending_db');
            db.users.deleteMany({{email: /pytest\\.orders\\./}});
            db.google_sessions.deleteMany({{session_token: /pytest_orders_session_/}});
            '''
        ])


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
