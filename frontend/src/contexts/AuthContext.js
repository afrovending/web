import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('afrovending_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Configure axios to send cookies
    axios.defaults.withCredentials = true;
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // Always try to fetch user (may have session cookie from Google OAuth)
    fetchUser();
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(response.data);
      
      // If we have a user from Google OAuth but no local token, that's fine
      // The session cookie handles authentication
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Only clear token if it exists and is invalid
      if (token) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { access_token, user: userData } = response.data;
    
    localStorage.setItem('afrovending_token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    
    setToken(access_token);
    setUser(userData);
    
    return userData;
  };

  // Google OAuth login - redirect to Emergent Auth
  const loginWithGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  // Process Google OAuth callback
  const processGoogleCallback = async (sessionId) => {
    try {
      const response = await axios.post(`${API}/auth/google/session`, 
        { session_id: sessionId },
        { withCredentials: true }
      );
      
      const { access_token, user: userData } = response.data;
      
      if (access_token) {
        localStorage.setItem('afrovending_token', access_token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        setToken(access_token);
      }
      
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Google OAuth callback failed:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    const response = await axios.post(`${API}/auth/register`, userData);
    const { access_token, user: newUser } = response.data;
    
    localStorage.setItem('afrovending_token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    
    setToken(access_token);
    setUser(newUser);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return newUser;
  };

  const logout = async () => {
    try {
      // Try to clear Google session
      await axios.post(`${API}/auth/google/logout`, {}, { withCredentials: true });
    } catch (error) {
      // Ignore errors on logout
    }
    
    localStorage.removeItem('afrovending_token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const isVendor = user?.role === 'vendor' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      loginWithGoogle,
      processGoogleCallback,
      register,
      logout,
      isVendor,
      isAdmin,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
