"""
Test Suite for Currency System
Tests for Multi-Currency Support feature in AfroVending
- GET /api/currency/supported - Returns list of 12 supported currencies
- GET /api/currency/rates - Returns exchange rates from API (or fallback)
- POST /api/currency/convert - Converts amount between currencies
- GET /api/currency/preference - Gets user's saved currency preference
- PUT /api/currency/preference - Sets user's currency preference
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Expected currencies for validation
EXPECTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'CAD', 'AUD', 'INR', 'XOF', 'XAF']
AFRICAN_CURRENCIES = ['NGN', 'GHS', 'KES', 'ZAR', 'XOF', 'XAF']
MAJOR_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR']


class TestCurrencySupported:
    """Tests for GET /api/currency/supported endpoint"""
    
    def test_supported_currencies_returns_200(self):
        """Should return 200 OK"""
        response = requests.get(f"{BASE_URL}/api/currency/supported")
        assert response.status_code == 200
        print("✓ GET /api/currency/supported returns 200")
    
    def test_supported_currencies_returns_12_currencies(self):
        """Should return exactly 12 currencies"""
        response = requests.get(f"{BASE_URL}/api/currency/supported")
        data = response.json()
        
        assert "currencies" in data
        assert len(data["currencies"]) == 12
        print("✓ Returns exactly 12 currencies")
    
    def test_supported_currencies_has_correct_structure(self):
        """Each currency should have code, name, symbol, decimal_places"""
        response = requests.get(f"{BASE_URL}/api/currency/supported")
        data = response.json()
        
        for currency in data["currencies"]:
            assert "code" in currency
            assert "name" in currency
            assert "symbol" in currency
            assert "decimal_places" in currency
            assert isinstance(currency["decimal_places"], int)
        print("✓ All currencies have correct structure (code, name, symbol, decimal_places)")
    
    def test_supported_currencies_contains_all_expected(self):
        """Should contain all expected currency codes"""
        response = requests.get(f"{BASE_URL}/api/currency/supported")
        data = response.json()
        
        currency_codes = [c["code"] for c in data["currencies"]]
        for expected in EXPECTED_CURRENCIES:
            assert expected in currency_codes, f"Missing currency: {expected}"
        print(f"✓ Contains all 12 expected currencies: {EXPECTED_CURRENCIES}")
    
    def test_supported_currencies_base_is_usd(self):
        """Base currency should be USD"""
        response = requests.get(f"{BASE_URL}/api/currency/supported")
        data = response.json()
        
        assert "base_currency" in data
        assert data["base_currency"] == "USD"
        print("✓ Base currency is USD")
    
    def test_african_currencies_present(self):
        """Should include all 6 African currencies"""
        response = requests.get(f"{BASE_URL}/api/currency/supported")
        data = response.json()
        
        currency_codes = [c["code"] for c in data["currencies"]]
        for african in AFRICAN_CURRENCIES:
            assert african in currency_codes
        print(f"✓ Contains all African currencies: {AFRICAN_CURRENCIES}")


class TestCurrencyRates:
    """Tests for GET /api/currency/rates endpoint"""
    
    def test_rates_returns_200(self):
        """Should return 200 OK"""
        response = requests.get(f"{BASE_URL}/api/currency/rates")
        assert response.status_code == 200
        print("✓ GET /api/currency/rates returns 200")
    
    def test_rates_has_base_usd(self):
        """Base should be USD"""
        response = requests.get(f"{BASE_URL}/api/currency/rates")
        data = response.json()
        
        assert "base" in data
        assert data["base"] == "USD"
        print("✓ Rates base is USD")
    
    def test_rates_has_all_currencies(self):
        """Should have rates for all 12 currencies"""
        response = requests.get(f"{BASE_URL}/api/currency/rates")
        data = response.json()
        
        assert "rates" in data
        rates = data["rates"]
        
        for currency in EXPECTED_CURRENCIES:
            assert currency in rates, f"Missing rate for {currency}"
            assert isinstance(rates[currency], (int, float))
            assert rates[currency] > 0
        print("✓ Rates available for all 12 currencies")
    
    def test_rates_usd_is_one(self):
        """USD rate should be 1 (base currency)"""
        response = requests.get(f"{BASE_URL}/api/currency/rates")
        data = response.json()
        
        assert data["rates"]["USD"] == 1 or data["rates"]["USD"] == 1.0
        print("✓ USD rate is 1.0")
    
    def test_rates_has_timestamp(self):
        """Should include last_updated timestamp"""
        response = requests.get(f"{BASE_URL}/api/currency/rates")
        data = response.json()
        
        assert "last_updated" in data
        assert len(data["last_updated"]) > 0
        print("✓ Rates include last_updated timestamp")
    
    def test_african_currencies_realistic_rates(self):
        """African currencies should have realistic rates (> 1 USD)"""
        response = requests.get(f"{BASE_URL}/api/currency/rates")
        data = response.json()
        
        # NGN, KES, XOF, XAF should all be > 100 per USD
        rates = data["rates"]
        assert rates["NGN"] > 100, f"NGN rate {rates['NGN']} seems too low"
        assert rates["KES"] > 100, f"KES rate {rates['KES']} seems too low"
        assert rates["XOF"] > 100, f"XOF rate {rates['XOF']} seems too low"
        assert rates["XAF"] > 100, f"XAF rate {rates['XAF']} seems too low"
        print("✓ African currency rates are realistic (NGN, KES, XOF, XAF > 100)")


class TestCurrencyConvert:
    """Tests for POST /api/currency/convert endpoint"""
    
    def test_convert_usd_to_ngn(self):
        """Should convert USD to NGN"""
        response = requests.post(
            f"{BASE_URL}/api/currency/convert",
            json={"amount": 100, "from_currency": "USD", "to_currency": "NGN"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "original" in data
        assert "converted" in data
        assert "rate" in data
        
        assert data["original"]["amount"] == 100
        assert data["original"]["currency"] == "USD"
        assert data["converted"]["currency"] == "NGN"
        assert data["converted"]["amount"] > 10000  # Should be substantial
        print(f"✓ USD to NGN: $100 = ₦{data['converted']['amount']}")
    
    def test_convert_eur_to_gbp(self):
        """Should convert EUR to GBP"""
        response = requests.post(
            f"{BASE_URL}/api/currency/convert",
            json={"amount": 50, "from_currency": "EUR", "to_currency": "GBP"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["original"]["currency"] == "EUR"
        assert data["converted"]["currency"] == "GBP"
        print(f"✓ EUR to GBP: €50 = £{data['converted']['amount']}")
    
    def test_convert_same_currency(self):
        """Converting same currency should return same amount"""
        response = requests.post(
            f"{BASE_URL}/api/currency/convert",
            json={"amount": 100, "from_currency": "USD", "to_currency": "USD"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["converted"]["amount"] == 100
        print("✓ Same currency conversion returns same amount")
    
    def test_convert_formatted_output(self):
        """Should return properly formatted amounts with symbols"""
        response = requests.post(
            f"{BASE_URL}/api/currency/convert",
            json={"amount": 100, "from_currency": "USD", "to_currency": "GHS"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "$" in data["original"]["formatted"]
        assert "GH₵" in data["converted"]["formatted"]
        print(f"✓ Formatted output: {data['original']['formatted']} → {data['converted']['formatted']}")
    
    def test_convert_invalid_from_currency(self):
        """Should return 400 for invalid from_currency"""
        response = requests.post(
            f"{BASE_URL}/api/currency/convert",
            json={"amount": 100, "from_currency": "INVALID", "to_currency": "USD"}
        )
        assert response.status_code == 400
        print("✓ Invalid from_currency returns 400")
    
    def test_convert_invalid_to_currency(self):
        """Should return 400 for invalid to_currency"""
        response = requests.post(
            f"{BASE_URL}/api/currency/convert",
            json={"amount": 100, "from_currency": "USD", "to_currency": "FAKE"}
        )
        assert response.status_code == 400
        print("✓ Invalid to_currency returns 400")
    
    def test_convert_decimal_amounts(self):
        """Should handle decimal amounts"""
        response = requests.post(
            f"{BASE_URL}/api/currency/convert",
            json={"amount": 99.99, "from_currency": "USD", "to_currency": "EUR"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["original"]["amount"] == 99.99
        print(f"✓ Decimal amount handled: $99.99 → €{data['converted']['amount']}")
    
    def test_convert_african_to_major(self):
        """Should convert African currency to major currency"""
        response = requests.post(
            f"{BASE_URL}/api/currency/convert",
            json={"amount": 10000, "from_currency": "NGN", "to_currency": "USD"}
        )
        assert response.status_code == 200
        
        data = response.json()
        # 10000 NGN should be less than 100 USD at current rates
        assert data["converted"]["amount"] < 100
        print(f"✓ NGN to USD: ₦10,000 = ${data['converted']['amount']:.2f}")


class TestCurrencyPreference:
    """Tests for GET/PUT /api/currency/preference endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "vendor@afrovending.com", "password": "password123"}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed - skipping preference tests")
    
    def test_preference_get_requires_auth(self):
        """GET preference should require authentication"""
        response = requests.get(f"{BASE_URL}/api/currency/preference")
        assert response.status_code == 401 or response.status_code == 403
        print("✓ GET preference requires authentication")
    
    def test_preference_put_requires_auth(self):
        """PUT preference should require authentication"""
        response = requests.put(
            f"{BASE_URL}/api/currency/preference",
            json={"currency": "EUR"}
        )
        assert response.status_code == 401 or response.status_code == 403
        print("✓ PUT preference requires authentication")
    
    def test_preference_get_with_auth(self, auth_token):
        """Should return user's currency preference when authenticated"""
        response = requests.get(
            f"{BASE_URL}/api/currency/preference",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "currency" in data
        assert data["currency"] in EXPECTED_CURRENCIES
        print(f"✓ GET preference returned: {data['currency']}")
    
    def test_preference_put_valid_currency(self, auth_token):
        """Should allow setting valid currency preference"""
        # Set to NGN
        response = requests.put(
            f"{BASE_URL}/api/currency/preference",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"currency": "NGN"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["currency"] == "NGN"
        print("✓ PUT preference set to NGN")
        
        # Verify it persisted
        get_response = requests.get(
            f"{BASE_URL}/api/currency/preference",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert get_response.json()["currency"] == "NGN"
        print("✓ Preference persisted in database")
    
    def test_preference_put_invalid_currency(self, auth_token):
        """Should reject invalid currency"""
        response = requests.put(
            f"{BASE_URL}/api/currency/preference",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"currency": "INVALID"}
        )
        assert response.status_code == 400
        print("✓ Invalid currency rejected with 400")
    
    def test_preference_set_all_currencies(self, auth_token):
        """Should be able to set any supported currency"""
        for currency in EXPECTED_CURRENCIES:
            response = requests.put(
                f"{BASE_URL}/api/currency/preference",
                headers={"Authorization": f"Bearer {auth_token}"},
                json={"currency": currency}
            )
            assert response.status_code == 200
            assert response.json()["currency"] == currency
        print(f"✓ Successfully set all 12 currencies as preference")
        
        # Reset to USD
        requests.put(
            f"{BASE_URL}/api/currency/preference",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"currency": "USD"}
        )


class TestCurrencyFormat:
    """Tests for GET /api/currency/format/{currency_code}/{amount} endpoint"""
    
    def test_format_usd(self):
        """Should format USD correctly"""
        response = requests.get(f"{BASE_URL}/api/currency/format/USD/1234.56")
        assert response.status_code == 200
        
        data = response.json()
        assert "$" in data["formatted"]
        assert "1,234.56" in data["formatted"]
        print(f"✓ USD format: {data['formatted']}")
    
    def test_format_ngn_no_decimals(self):
        """NGN should format with 0 decimal places"""
        response = requests.get(f"{BASE_URL}/api/currency/format/NGN/1234")
        assert response.status_code == 200
        
        data = response.json()
        assert "₦" in data["formatted"]
        assert "1,234" in data["formatted"]
        assert ".00" not in data["formatted"]  # NGN has 0 decimals
        print(f"✓ NGN format (0 decimals): {data['formatted']}")
    
    def test_format_eur(self):
        """Should format EUR correctly"""
        response = requests.get(f"{BASE_URL}/api/currency/format/EUR/99.99")
        assert response.status_code == 200
        
        data = response.json()
        assert "€" in data["formatted"]
        print(f"✓ EUR format: {data['formatted']}")
    
    def test_format_invalid_currency(self):
        """Should return 400 for invalid currency"""
        response = requests.get(f"{BASE_URL}/api/currency/format/INVALID/100")
        assert response.status_code == 400
        print("✓ Invalid currency format returns 400")
    
    def test_format_cfa_currencies(self):
        """Should format CFA currencies (XOF, XAF) correctly"""
        # XOF - West African CFA
        response_xof = requests.get(f"{BASE_URL}/api/currency/format/XOF/50000")
        assert response_xof.status_code == 200
        assert "CFA" in response_xof.json()["formatted"]
        
        # XAF - Central African CFA
        response_xaf = requests.get(f"{BASE_URL}/api/currency/format/XAF/50000")
        assert response_xaf.status_code == 200
        assert "FCFA" in response_xaf.json()["formatted"]
        
        print(f"✓ CFA formats: XOF={response_xof.json()['formatted']}, XAF={response_xaf.json()['formatted']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
