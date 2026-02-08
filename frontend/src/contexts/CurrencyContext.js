import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CurrencyContext = createContext(null);

// Supported currencies with metadata
const SUPPORTED_CURRENCIES = {
  USD: { name: 'US Dollar', symbol: '$', decimal_places: 2 },
  EUR: { name: 'Euro', symbol: '€', decimal_places: 2 },
  GBP: { name: 'British Pound', symbol: '£', decimal_places: 2 },
  NGN: { name: 'Nigerian Naira', symbol: '₦', decimal_places: 0 },
  GHS: { name: 'Ghanaian Cedi', symbol: 'GH₵', decimal_places: 2 },
  KES: { name: 'Kenyan Shilling', symbol: 'KSh', decimal_places: 0 },
  ZAR: { name: 'South African Rand', symbol: 'R', decimal_places: 2 },
  CAD: { name: 'Canadian Dollar', symbol: 'CA$', decimal_places: 2 },
  AUD: { name: 'Australian Dollar', symbol: 'A$', decimal_places: 2 },
  INR: { name: 'Indian Rupee', symbol: '₹', decimal_places: 0 },
  XOF: { name: 'West African CFA', symbol: 'CFA', decimal_places: 0 },
  XAF: { name: 'Central African CFA', symbol: 'FCFA', decimal_places: 0 },
};

const BASE_CURRENCY = 'USD';
const STORAGE_KEY = 'afrovending_currency';
const RATES_CACHE_KEY = 'afrovending_rates';
const DETECTED_KEY = 'afrovending_currency_detected';

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && SUPPORTED_CURRENCIES[stored] ? stored : BASE_CURRENCY;
  });
  
  const [rates, setRates] = useState(() => {
    try {
      const cached = localStorage.getItem(RATES_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Check if cache is less than 1 hour old
        if (parsed.timestamp && Date.now() - parsed.timestamp < 3600000) {
          return parsed.rates;
        }
      }
    } catch (e) {}
    return null;
  });
  
  const [loading, setLoading] = useState(!rates);
  const [detectedCountry, setDetectedCountry] = useState(null);

  // Auto-detect currency based on IP location (only on first visit)
  const detectCurrency = useCallback(async () => {
    // Skip if user has already set a preference or we've already detected
    const hasStoredCurrency = localStorage.getItem(STORAGE_KEY);
    const alreadyDetected = localStorage.getItem(DETECTED_KEY);
    
    if (hasStoredCurrency || alreadyDetected) {
      return;
    }

    try {
      const response = await axios.get(`${API}/currency/detect`);
      const data = response.data;
      
      if (data.detected && data.currency && SUPPORTED_CURRENCIES[data.currency]) {
        // Mark as detected to avoid repeated detection
        localStorage.setItem(DETECTED_KEY, 'true');
        
        // Only update if different from current (USD default)
        if (data.currency !== BASE_CURRENCY) {
          setCurrencyState(data.currency);
          localStorage.setItem(STORAGE_KEY, data.currency);
          setDetectedCountry(data.country_name);
          
          // Show toast notification
          toast.success(
            `Currency set to ${data.currency_name} (${data.currency_symbol}) based on your location in ${data.country_name}`,
            {
              duration: 5000,
              action: {
                label: 'Change',
                onClick: () => {
                  // This will open the currency selector - user can click it manually
                  document.querySelector('[data-testid="currency-selector"]')?.click();
                }
              }
            }
          );
        } else {
          // Still mark as detected even if USD
          localStorage.setItem(DETECTED_KEY, 'true');
        }
      } else {
        // Mark as attempted even if detection failed
        localStorage.setItem(DETECTED_KEY, 'true');
      }
    } catch (error) {
      console.log('Currency detection failed:', error);
      // Mark as attempted to avoid retrying
      localStorage.setItem(DETECTED_KEY, 'true');
    }
  }, []);

  // Fetch exchange rates
  const fetchRates = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/currency/rates`);
      const newRates = response.data.rates;
      setRates(newRates);
      
      // Cache rates with timestamp
      localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({
        rates: newRates,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      // Use fallback rates if fetch fails
      if (!rates) {
        setRates({
          USD: 1, EUR: 0.92, GBP: 0.79, NGN: 1550, GHS: 15.5,
          KES: 153, ZAR: 18.5, CAD: 1.36, AUD: 1.53, INR: 83,
          XOF: 605, XAF: 605
        });
      }
    } finally {
      setLoading(false);
    }
  }, [rates]);

  // Fetch rates on mount
  useEffect(() => {
    fetchRates();
    
    // Refresh rates every hour
    const interval = setInterval(fetchRates, 3600000);
    return () => clearInterval(interval);
  }, []);

  // Set currency preference
  const setCurrency = useCallback(async (newCurrency) => {
    if (!SUPPORTED_CURRENCIES[newCurrency]) return;
    
    setCurrencyState(newCurrency);
    localStorage.setItem(STORAGE_KEY, newCurrency);
    
    // Update on server if user is logged in
    try {
      await axios.put(`${API}/currency/preference`, { currency: newCurrency });
    } catch (error) {
      // Silently fail - local storage is the primary source
    }
  }, []);

  // Convert price from USD to selected currency
  const convertPrice = useCallback((priceUSD, toCurrency = currency) => {
    if (!rates || !priceUSD) return priceUSD;
    
    const rate = rates[toCurrency] || 1;
    return priceUSD * rate;
  }, [rates, currency]);

  // Format price with currency symbol
  const formatPrice = useCallback((price, currencyCode = currency) => {
    const curr = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
    const converted = currencyCode !== BASE_CURRENCY ? convertPrice(price, currencyCode) : price;
    
    const options = {
      minimumFractionDigits: curr.decimal_places,
      maximumFractionDigits: curr.decimal_places
    };
    
    const formatted = converted.toLocaleString('en-US', options);
    return `${curr.symbol}${formatted}`;
  }, [currency, convertPrice]);

  // Get display price (converted and formatted)
  const displayPrice = useCallback((priceUSD) => {
    if (!priceUSD && priceUSD !== 0) return '';
    return formatPrice(priceUSD, currency);
  }, [formatPrice, currency]);

  // Get raw converted price (for calculations)
  const getConvertedPrice = useCallback((priceUSD) => {
    return convertPrice(priceUSD, currency);
  }, [convertPrice, currency]);

  // Get currency info
  const getCurrencyInfo = useCallback((code = currency) => {
    return SUPPORTED_CURRENCIES[code] || SUPPORTED_CURRENCIES.USD;
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      rates,
      loading,
      currencies: SUPPORTED_CURRENCIES,
      baseCurrency: BASE_CURRENCY,
      convertPrice,
      formatPrice,
      displayPrice,
      getConvertedPrice,
      getCurrencyInfo,
      refreshRates: fetchRates
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

// Helper component for displaying prices
export const Price = ({ amount, comparePrice, className = '' }) => {
  const { displayPrice, currency, getConvertedPrice, getCurrencyInfo } = useCurrency();
  
  if (!amount && amount !== 0) return null;
  
  const currInfo = getCurrencyInfo();
  const convertedAmount = getConvertedPrice(amount);
  const convertedCompare = comparePrice ? getConvertedPrice(comparePrice) : null;
  
  return (
    <span className={className} data-currency={currency}>
      <span className="font-bold">{displayPrice(amount)}</span>
      {convertedCompare && convertedCompare > convertedAmount && (
        <span className="text-muted-foreground line-through ml-2 text-sm">
          {displayPrice(comparePrice)}
        </span>
      )}
    </span>
  );
};

export default CurrencyContext;
