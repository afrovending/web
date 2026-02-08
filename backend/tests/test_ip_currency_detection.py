"""
Test IP-Based Currency Detection Feature
Tests GET /api/currency/detect and GET /api/currency/country-mapping endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://social-login-test.preview.emergentagent.com')


class TestCurrencyDetection:
    """Test IP-based currency detection endpoint"""
    
    def test_detect_currency_returns_200(self):
        """GET /api/currency/detect returns 200"""
        response = requests.get(f"{BASE_URL}/api/currency/detect")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/currency/detect returns 200")
    
    def test_detect_currency_has_required_fields(self):
        """Response has all required fields"""
        response = requests.get(f"{BASE_URL}/api/currency/detect")
        data = response.json()
        
        required_fields = ['detected', 'currency', 'country_code', 'message']
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        print(f"✓ Response has required fields: {required_fields}")
    
    def test_detect_currency_has_currency_details(self):
        """Response includes currency details when detected"""
        response = requests.get(f"{BASE_URL}/api/currency/detect")
        data = response.json()
        
        if data.get('detected'):
            assert 'currency_name' in data, "Missing currency_name when detected"
            assert 'currency_symbol' in data, "Missing currency_symbol when detected"
            assert 'country_name' in data, "Missing country_name when detected"
            print(f"✓ Detected: {data['country_name']} → {data['currency']} ({data['currency_symbol']})")
        else:
            # If not detected, should have a message
            assert 'message' in data, "Should have message when not detected"
            print(f"✓ Detection failed gracefully: {data.get('message')}")
    
    def test_detect_currency_returns_valid_currency(self):
        """Detected currency is from supported currencies"""
        response = requests.get(f"{BASE_URL}/api/currency/detect")
        data = response.json()
        
        supported = ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'CAD', 'AUD', 'INR', 'XOF', 'XAF']
        assert data['currency'] in supported, f"Currency {data['currency']} not in supported list"
        print(f"✓ Currency {data['currency']} is supported")
    
    def test_detect_returns_ip_address(self):
        """Response includes the IP address used for detection"""
        response = requests.get(f"{BASE_URL}/api/currency/detect")
        data = response.json()
        
        # Should return IP even for server requests
        if data.get('detected'):
            assert 'ip' in data, "Should include IP address when detected"
            assert data['ip'], "IP address should not be empty"
            print(f"✓ IP address returned: {data['ip']}")
        else:
            # For undetected cases, ip might still be returned
            print(f"✓ Detection result: {data}")


class TestCountryMapping:
    """Test country to currency mapping endpoint"""
    
    def test_country_mapping_returns_200(self):
        """GET /api/currency/country-mapping returns 200"""
        response = requests.get(f"{BASE_URL}/api/currency/country-mapping")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/currency/country-mapping returns 200")
    
    def test_country_mapping_has_required_structure(self):
        """Response has mapping and supported_currencies"""
        response = requests.get(f"{BASE_URL}/api/currency/country-mapping")
        data = response.json()
        
        assert 'mapping' in data, "Missing 'mapping' field"
        assert 'supported_currencies' in data, "Missing 'supported_currencies' field"
        assert isinstance(data['mapping'], dict), "mapping should be a dict"
        assert isinstance(data['supported_currencies'], list), "supported_currencies should be a list"
        print("✓ Response has correct structure")
    
    def test_country_mapping_has_38_plus_countries(self):
        """Mapping contains 38+ countries"""
        response = requests.get(f"{BASE_URL}/api/currency/country-mapping")
        data = response.json()
        
        mapping = data['mapping']
        country_count = len(mapping)
        assert country_count >= 38, f"Expected 38+ countries, got {country_count}"
        print(f"✓ Mapping contains {country_count} countries (≥38)")
    
    def test_country_mapping_has_12_currencies(self):
        """12 currencies are supported"""
        response = requests.get(f"{BASE_URL}/api/currency/country-mapping")
        data = response.json()
        
        currencies = data['supported_currencies']
        assert len(currencies) == 12, f"Expected 12 currencies, got {len(currencies)}"
        print(f"✓ 12 supported currencies: {currencies}")
    
    def test_african_countries_mapped_correctly(self):
        """African countries map to correct currencies"""
        response = requests.get(f"{BASE_URL}/api/currency/country-mapping")
        data = response.json()
        mapping = data['mapping']
        
        # Test African country mappings
        african_mappings = {
            'NG': 'NGN',  # Nigeria → Naira
            'GH': 'GHS',  # Ghana → Cedi
            'KE': 'KES',  # Kenya → Shilling
            'ZA': 'ZAR',  # South Africa → Rand
            'SN': 'XOF',  # Senegal → West African CFA
            'CM': 'XAF',  # Cameroon → Central African CFA
        }
        
        for country, expected_currency in african_mappings.items():
            assert country in mapping, f"Missing country: {country}"
            assert mapping[country] == expected_currency, f"{country} should map to {expected_currency}, got {mapping[country]}"
        
        print("✓ African country mappings verified")
    
    def test_european_countries_mapped_correctly(self):
        """European countries map to correct currencies"""
        response = requests.get(f"{BASE_URL}/api/currency/country-mapping")
        data = response.json()
        mapping = data['mapping']
        
        european_mappings = {
            'GB': 'GBP',  # UK → Pound
            'DE': 'EUR',  # Germany → Euro
            'FR': 'EUR',  # France → Euro
            'IT': 'EUR',  # Italy → Euro
            'ES': 'EUR',  # Spain → Euro
        }
        
        for country, expected_currency in european_mappings.items():
            assert country in mapping, f"Missing country: {country}"
            assert mapping[country] == expected_currency, f"{country} should map to {expected_currency}, got {mapping[country]}"
        
        print("✓ European country mappings verified")
    
    def test_other_major_countries_mapped(self):
        """Other major countries are mapped"""
        response = requests.get(f"{BASE_URL}/api/currency/country-mapping")
        data = response.json()
        mapping = data['mapping']
        
        other_mappings = {
            'US': 'USD',  # United States
            'CA': 'CAD',  # Canada
            'AU': 'AUD',  # Australia
            'IN': 'INR',  # India
        }
        
        for country, expected_currency in other_mappings.items():
            assert country in mapping, f"Missing country: {country}"
            assert mapping[country] == expected_currency, f"{country} should map to {expected_currency}, got {mapping[country]}"
        
        print("✓ Major country mappings verified (US, CA, AU, IN)")
    
    def test_cfa_countries_mapped_to_correct_zones(self):
        """CFA countries map to correct zones (XOF vs XAF)"""
        response = requests.get(f"{BASE_URL}/api/currency/country-mapping")
        data = response.json()
        mapping = data['mapping']
        
        # West African CFA (XOF) countries
        xof_countries = ['SN', 'CI', 'ML', 'BF', 'NE', 'TG', 'BJ', 'GW']
        for country in xof_countries:
            assert mapping.get(country) == 'XOF', f"{country} should map to XOF (West African CFA)"
        
        # Central African CFA (XAF) countries
        xaf_countries = ['CM', 'CF', 'TD', 'CG', 'GA', 'GQ']
        for country in xaf_countries:
            assert mapping.get(country) == 'XAF', f"{country} should map to XAF (Central African CFA)"
        
        print(f"✓ CFA zones verified: XOF ({len(xof_countries)} countries), XAF ({len(xaf_countries)} countries)")


class TestDetectionEdgeCases:
    """Test edge cases for IP detection"""
    
    def test_detect_with_x_forwarded_for_header(self):
        """Detection handles X-Forwarded-For header"""
        # This simulates a request with forwarded IP
        headers = {'X-Forwarded-For': '8.8.8.8'}  # Google DNS (US)
        response = requests.get(f"{BASE_URL}/api/currency/detect", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        # Should still return a valid response
        assert 'currency' in data
        print(f"✓ X-Forwarded-For handled: {data['currency']}")
    
    def test_detect_with_private_ip_header(self):
        """Detection handles private IP gracefully"""
        # Test with a private IP (should return null/USD fallback)
        headers = {'X-Forwarded-For': '192.168.1.1'}
        response = requests.get(f"{BASE_URL}/api/currency/detect", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        # For private IPs, detection should fail gracefully
        if not data.get('detected'):
            assert data['currency'] == 'USD', "Should fallback to USD for private IP"
            print("✓ Private IP returns USD fallback (detected=false)")
        else:
            # If it uses server IP instead of header, that's also acceptable
            print(f"✓ Private IP handled: {data}")
    
    def test_detect_with_localhost(self):
        """Detection handles localhost gracefully"""
        headers = {'X-Forwarded-For': '127.0.0.1'}
        response = requests.get(f"{BASE_URL}/api/currency/detect", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        # Should handle localhost gracefully
        assert 'currency' in data
        print(f"✓ Localhost handled: detected={data.get('detected')}, currency={data['currency']}")


class TestAllSupportedCurrencies:
    """Verify all 12 supported currencies exist"""
    
    def test_all_supported_currencies_available(self):
        """All 12 currencies are in supported list"""
        response = requests.get(f"{BASE_URL}/api/currency/country-mapping")
        data = response.json()
        
        expected_currencies = ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'CAD', 'AUD', 'INR', 'XOF', 'XAF']
        
        for currency in expected_currencies:
            assert currency in data['supported_currencies'], f"Missing currency: {currency}"
        
        print(f"✓ All 12 currencies present: {expected_currencies}")
    
    def test_all_currencies_have_country_mapping(self):
        """Each supported currency has at least one country mapping"""
        response = requests.get(f"{BASE_URL}/api/currency/country-mapping")
        data = response.json()
        
        mapping = data['mapping']
        currencies_in_use = set(mapping.values())
        
        # USD might not have many explicit mappings but should be default
        expected_in_use = {'EUR', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR', 'CAD', 'AUD', 'INR', 'XOF', 'XAF', 'USD'}
        
        for currency in expected_in_use:
            assert currency in currencies_in_use, f"Currency {currency} has no country mapping"
        
        print(f"✓ All currencies have country mappings")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
