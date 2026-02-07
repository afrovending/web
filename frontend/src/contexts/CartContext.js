import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const CartProvider = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [cart, setCart] = useState({ items: [], subtotal: 0, total: 0 });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [], subtotal: 0, total: 0 });
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.get(`${API}/cart`);
      setCart(response.data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart, token]);

  const addToCart = async (productId, quantity = 1, variantId = null, selectedOptions = null) => {
    if (!isAuthenticated) {
      throw new Error('Please login to add items to cart');
    }
    
    const payload = { 
      product_id: productId, 
      quantity,
      variant_id: variantId,
      selected_options: selectedOptions
    };
    
    await axios.post(`${API}/cart/items`, payload);
    await fetchCart();
  };

  const updateQuantity = async (itemId, quantity) => {
    await axios.put(`${API}/cart/items/${itemId}?quantity=${quantity}`);
    await fetchCart();
  };

  const removeFromCart = async (itemId) => {
    await axios.delete(`${API}/cart/items/${itemId}`);
    await fetchCart();
  };

  const clearCart = async () => {
    await axios.delete(`${API}/cart`);
    await fetchCart();
  };

  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      cartCount,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
