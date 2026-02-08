"""
Currency routes and utilities for Afrovending API
Handles multi-currency support with real-time exchange rates and IP-based detection
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Dict, Optional
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
import httpx

from config import db, logger
from utils.auth import get_current_user

router = APIRouter(tags=["Currency"])

# Supported currencies with metadata
SUPPORTED_CURRENCIES = {
    "USD": {"name": "US Dollar", "symbol": "$", "decimal_places": 2},
    "EUR": {"name": "Euro", "symbol": "€", "decimal_places": 2},
    "GBP": {"name": "British Pound", "symbol": "£", "decimal_places": 2},
    "NGN": {"name": "Nigerian Naira", "symbol": "₦", "decimal_places": 0},
    "GHS": {"name": "Ghanaian Cedi", "symbol": "GH₵", "decimal_places": 2},
    "KES": {"name": "Kenyan Shilling", "symbol": "KSh", "decimal_places": 0},
    "ZAR": {"name": "South African Rand", "symbol": "R", "decimal_places": 2},
    "CAD": {"name": "Canadian Dollar", "symbol": "CA$", "decimal_places": 2},
    "AUD": {"name": "Australian Dollar", "symbol": "A$", "decimal_places": 2},
    "INR": {"name": "Indian Rupee", "symbol": "₹", "decimal_places": 0},
    "XOF": {"name": "West African CFA", "symbol": "CFA", "decimal_places": 0},
    "XAF": {"name": "Central African CFA", "symbol": "FCFA", "decimal_places": 0},
}

BASE_CURRENCY = "USD"

# Country to currency mapping
COUNTRY_TO_CURRENCY = {
    # African countries
    "NG": "NGN",  # Nigeria
    "GH": "GHS",  # Ghana
    "KE": "KES",  # Kenya
    "ZA": "ZAR",  # South Africa
    "TZ": "KES",  # Tanzania (uses KES as close match)
    "UG": "KES",  # Uganda
    "RW": "KES",  # Rwanda
    # West African CFA countries
    "SN": "XOF",  # Senegal
    "CI": "XOF",  # Ivory Coast
    "ML": "XOF",  # Mali
    "BF": "XOF",  # Burkina Faso
    "NE": "XOF",  # Niger
    "TG": "XOF",  # Togo
    "BJ": "XOF",  # Benin
    "GW": "XOF",  # Guinea-Bissau
    # Central African CFA countries
    "CM": "XAF",  # Cameroon
    "CF": "XAF",  # Central African Republic
    "TD": "XAF",  # Chad
    "CG": "XAF",  # Congo
    "GA": "XAF",  # Gabon
    "GQ": "XAF",  # Equatorial Guinea
    # European countries
    "GB": "GBP",  # United Kingdom
    "DE": "EUR",  # Germany
    "FR": "EUR",  # France
    "IT": "EUR",  # Italy
    "ES": "EUR",  # Spain
    "NL": "EUR",  # Netherlands
    "BE": "EUR",  # Belgium
    "AT": "EUR",  # Austria
    "PT": "EUR",  # Portugal
    "IE": "EUR",  # Ireland
    "FI": "EUR",  # Finland
    "GR": "EUR",  # Greece
    # Other major countries
    "CA": "CAD",  # Canada
    "AU": "AUD",  # Australia
    "NZ": "AUD",  # New Zealand (use AUD as close match)
    "IN": "INR",  # India
    "US": "USD",  # United States
}

# Cache for exchange rates
_exchange_rates_cache: Dict = {
    "rates": {},
    "last_updated": None,
    "cache_duration": timedelta(hours=1)
}

# Fallback rates (approximate, used if API fails)
FALLBACK_RATES = {
    "USD": 1.0,
    "EUR": 0.92,
    "GBP": 0.79,
    "NGN": 1550.0,
    "GHS": 15.5,
    "KES": 153.0,
    "ZAR": 18.5,
    "CAD": 1.36,
    "AUD": 1.53,
    "INR": 83.0,
    "XOF": 605.0,
    "XAF": 605.0,
}


class CurrencyPreference(BaseModel):
    currency: str


class ConvertRequest(BaseModel):
    amount: float
    from_currency: str = "USD"
    to_currency: str


async def fetch_exchange_rates() -> Dict[str, float]:
    """Fetch latest exchange rates from free API"""
    global _exchange_rates_cache
    
    # Check cache
    if (_exchange_rates_cache["last_updated"] and 
        datetime.now(timezone.utc) - _exchange_rates_cache["last_updated"] < _exchange_rates_cache["cache_duration"]):
        return _exchange_rates_cache["rates"]
    
    try:
        # Using exchangerate-api.com free tier (no key required for basic)
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://api.exchangerate-api.com/v4/latest/{BASE_CURRENCY}"
            )
            
            if response.status_code == 200:
                data = response.json()
                rates = data.get("rates", {})
                
                # Filter to supported currencies only
                filtered_rates = {
                    code: rates.get(code, FALLBACK_RATES.get(code, 1.0))
                    for code in SUPPORTED_CURRENCIES.keys()
                }
                
                # Update cache
                _exchange_rates_cache["rates"] = filtered_rates
                _exchange_rates_cache["last_updated"] = datetime.now(timezone.utc)
                
                # Store in database for persistence
                await db.exchange_rates.update_one(
                    {"base": BASE_CURRENCY},
                    {
                        "$set": {
                            "rates": filtered_rates,
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    },
                    upsert=True
                )
                
                logger.info("Exchange rates updated successfully")
                return filtered_rates
    except Exception as e:
        logger.error(f"Failed to fetch exchange rates: {e}")
    
    # Try to load from database
    stored = await db.exchange_rates.find_one({"base": BASE_CURRENCY}, {"_id": 0})
    if stored and stored.get("rates"):
        _exchange_rates_cache["rates"] = stored["rates"]
        _exchange_rates_cache["last_updated"] = datetime.now(timezone.utc) - timedelta(minutes=30)
        return stored["rates"]
    
    # Use fallback rates
    logger.warning("Using fallback exchange rates")
    return FALLBACK_RATES


def convert_currency(amount: float, from_currency: str, to_currency: str, rates: Dict[str, float]) -> float:
    """Convert amount between currencies"""
    if from_currency == to_currency:
        return amount
    
    # Convert to USD first (base currency)
    if from_currency != BASE_CURRENCY:
        from_rate = rates.get(from_currency, 1.0)
        amount_usd = amount / from_rate
    else:
        amount_usd = amount
    
    # Convert from USD to target currency
    if to_currency != BASE_CURRENCY:
        to_rate = rates.get(to_currency, 1.0)
        return amount_usd * to_rate
    
    return amount_usd


def format_currency(amount: float, currency_code: str) -> str:
    """Format amount with currency symbol and proper decimal places"""
    currency = SUPPORTED_CURRENCIES.get(currency_code, SUPPORTED_CURRENCIES["USD"])
    symbol = currency["symbol"]
    decimals = currency["decimal_places"]
    
    if decimals == 0:
        formatted = f"{amount:,.0f}"
    else:
        formatted = f"{amount:,.{decimals}f}"
    
    return f"{symbol}{formatted}"


# ==================== API ROUTES ====================

@router.get("/currency/supported")
async def get_supported_currencies():
    """Get list of supported currencies with metadata"""
    return {
        "currencies": [
            {
                "code": code,
                "name": info["name"],
                "symbol": info["symbol"],
                "decimal_places": info["decimal_places"]
            }
            for code, info in SUPPORTED_CURRENCIES.items()
        ],
        "base_currency": BASE_CURRENCY
    }


@router.get("/currency/rates")
async def get_exchange_rates():
    """Get current exchange rates (base: USD)"""
    rates = await fetch_exchange_rates()
    
    return {
        "base": BASE_CURRENCY,
        "rates": rates,
        "last_updated": _exchange_rates_cache.get("last_updated", datetime.now(timezone.utc)).isoformat()
    }


@router.post("/currency/convert")
async def convert_amount(request: ConvertRequest):
    """Convert an amount between currencies"""
    if request.from_currency not in SUPPORTED_CURRENCIES:
        raise HTTPException(status_code=400, detail=f"Unsupported currency: {request.from_currency}")
    if request.to_currency not in SUPPORTED_CURRENCIES:
        raise HTTPException(status_code=400, detail=f"Unsupported currency: {request.to_currency}")
    
    rates = await fetch_exchange_rates()
    converted = convert_currency(request.amount, request.from_currency, request.to_currency, rates)
    
    return {
        "original": {
            "amount": request.amount,
            "currency": request.from_currency,
            "formatted": format_currency(request.amount, request.from_currency)
        },
        "converted": {
            "amount": round(converted, SUPPORTED_CURRENCIES[request.to_currency]["decimal_places"]),
            "currency": request.to_currency,
            "formatted": format_currency(converted, request.to_currency)
        },
        "rate": rates.get(request.to_currency, 1.0) / rates.get(request.from_currency, 1.0)
    }


@router.get("/currency/preference")
async def get_currency_preference(user: dict = Depends(get_current_user)):
    """Get user's currency preference"""
    user_doc = await db.users.find_one({"id": user["id"]}, {"_id": 0, "currency_preference": 1})
    return {
        "currency": user_doc.get("currency_preference", BASE_CURRENCY) if user_doc else BASE_CURRENCY
    }


@router.put("/currency/preference")
async def set_currency_preference(
    preference: CurrencyPreference,
    user: dict = Depends(get_current_user)
):
    """Set user's currency preference"""
    if preference.currency not in SUPPORTED_CURRENCIES:
        raise HTTPException(status_code=400, detail=f"Unsupported currency: {preference.currency}")
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"currency_preference": preference.currency}}
    )
    
    return {"message": "Currency preference updated", "currency": preference.currency}


@router.get("/currency/format/{currency_code}/{amount}")
async def format_amount(currency_code: str, amount: float):
    """Format an amount in a specific currency"""
    if currency_code not in SUPPORTED_CURRENCIES:
        raise HTTPException(status_code=400, detail=f"Unsupported currency: {currency_code}")
    
    return {
        "amount": amount,
        "currency": currency_code,
        "formatted": format_currency(amount, currency_code)
    }



# ==================== IP GEOLOCATION ====================

async def get_country_from_ip(ip_address: str) -> Optional[str]:
    """Get country code from IP address using free geolocation API"""
    # Skip local/private IPs
    if ip_address in ['127.0.0.1', 'localhost', '::1'] or ip_address.startswith(('10.', '192.168.', '172.')):
        return None
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Using ip-api.com (free, no key required, 45 requests/minute)
            response = await client.get(f"http://ip-api.com/json/{ip_address}?fields=status,countryCode")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    return data.get("countryCode")
    except Exception as e:
        logger.warning(f"Failed to get country from IP {ip_address}: {e}")
    
    return None


def get_currency_for_country(country_code: str) -> str:
    """Get the default currency for a country"""
    if not country_code:
        return BASE_CURRENCY
    
    return COUNTRY_TO_CURRENCY.get(country_code.upper(), BASE_CURRENCY)


@router.get("/currency/detect")
async def detect_currency(request: Request):
    """
    Detect user's preferred currency based on their IP address.
    Returns the suggested currency and country information.
    """
    # Get client IP from request
    # Check X-Forwarded-For header first (for proxied requests)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Take the first IP in the chain (original client)
        client_ip = forwarded_for.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else None
    
    if not client_ip:
        return {
            "detected": False,
            "currency": BASE_CURRENCY,
            "country_code": None,
            "country_name": None,
            "message": "Could not determine IP address"
        }
    
    # Get country from IP
    country_code = await get_country_from_ip(client_ip)
    
    if not country_code:
        return {
            "detected": False,
            "currency": BASE_CURRENCY,
            "country_code": None,
            "country_name": None,
            "ip": client_ip,
            "message": "Could not determine location"
        }
    
    # Get currency for country
    suggested_currency = get_currency_for_country(country_code)
    currency_info = SUPPORTED_CURRENCIES.get(suggested_currency, SUPPORTED_CURRENCIES[BASE_CURRENCY])
    
    # Country names for common countries
    country_names = {
        "NG": "Nigeria", "GH": "Ghana", "KE": "Kenya", "ZA": "South Africa",
        "GB": "United Kingdom", "US": "United States", "CA": "Canada",
        "AU": "Australia", "IN": "India", "DE": "Germany", "FR": "France",
        "SN": "Senegal", "CI": "Ivory Coast", "CM": "Cameroon"
    }
    
    return {
        "detected": True,
        "currency": suggested_currency,
        "currency_name": currency_info["name"],
        "currency_symbol": currency_info["symbol"],
        "country_code": country_code,
        "country_name": country_names.get(country_code, country_code),
        "ip": client_ip,
        "message": f"Currency set to {currency_info['name']} based on your location"
    }


@router.get("/currency/country-mapping")
async def get_country_currency_mapping():
    """Get the full country to currency mapping"""
    return {
        "mapping": COUNTRY_TO_CURRENCY,
        "supported_currencies": list(SUPPORTED_CURRENCIES.keys())
    }
