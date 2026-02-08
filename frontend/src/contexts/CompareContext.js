import React, { createContext, useContext, useState, useEffect } from 'react';

const CompareContext = createContext(null);

const MAX_COMPARE_ITEMS = 4;
const STORAGE_KEY = 'afrovending_compare';

export const CompareProvider = ({ children }) => {
  const [compareItems, setCompareItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compareItems));
  }, [compareItems]);

  const addToCompare = (product) => {
    if (compareItems.length >= MAX_COMPARE_ITEMS) {
      return { success: false, message: `Maximum ${MAX_COMPARE_ITEMS} items for comparison` };
    }
    
    if (compareItems.find(item => item.id === product.id)) {
      return { success: false, message: 'Product already in comparison' };
    }

    setCompareItems(prev => [...prev, {
      id: product.id,
      name: product.name,
      price: product.price,
      compare_price: product.compare_price,
      image: product.images?.[0] || '',
      average_rating: product.average_rating || 0,
      review_count: product.review_count || 0,
      vendor_name: product.vendor_name || '',
      category_name: product.category_name || '',
      stock: product.stock || 0,
      has_variants: product.has_variants || false,
      description: product.description || ''
    }]);

    return { success: true, message: 'Added to comparison' };
  };

  const removeFromCompare = (productId) => {
    setCompareItems(prev => prev.filter(item => item.id !== productId));
  };

  const clearCompare = () => {
    setCompareItems([]);
  };

  const isInCompare = (productId) => {
    return compareItems.some(item => item.id === productId);
  };

  return (
    <CompareContext.Provider value={{
      compareItems,
      addToCompare,
      removeFromCompare,
      clearCompare,
      isInCompare,
      maxItems: MAX_COMPARE_ITEMS
    }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};
