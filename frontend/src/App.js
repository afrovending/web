import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import CartPage from './pages/CartPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import WishlistPage from './pages/WishlistPage';
import UserDashboard from './pages/UserDashboard';
import { VendorDashboard, VendorSetupPage } from './pages/VendorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { VendorsPage, VendorPage } from './pages/VendorsPages';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import { BookingDetailPage, BookingSuccessPage } from './pages/BookingPages';
import { TrackingPage, TrackingDetailPage } from './pages/TrackingPage';

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <img 
        src="https://customer-assets.emergentagent.com/job_4651b9b8-f544-4a9c-8c72-eb308d827774/artifacts/sdrbp7sb_AFROVENDINGLOGO%20copy.png" 
        alt="Afrovending" 
        className="h-20 w-auto mx-auto mb-4 animate-pulse"
      />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Inner app with auth check
const AppContent = () => {
  const { loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <Routes>
          {/* Auth pages without navbar */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Main pages with navbar */}
          <Route
            path="*"
            element={
              <>
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/:productId" element={<ProductDetailPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
                    <Route path="/wishlist" element={<WishlistPage />} />
                    <Route path="/dashboard" element={<UserDashboard />} />
                    <Route path="/vendor/dashboard" element={<VendorDashboard />} />
                    <Route path="/vendor/setup" element={<VendorSetupPage />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/vendors" element={<VendorsPage />} />
                    <Route path="/vendors/:vendorId" element={<VendorPage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/services/:serviceId" element={<ServiceDetailPage />} />
                    <Route path="/bookings/:bookingId" element={<BookingDetailPage />} />
                    <Route path="/bookings/:bookingId/success" element={<BookingSuccessPage />} />
                    <Route path="/tracking" element={<TrackingPage />} />
                    <Route path="/tracking/:itemType/:itemId" element={<TrackingDetailPage />} />
                  </Routes>
                </main>
                <Footer />
              </>
            }
          />
        </Routes>
      </div>
    </CartProvider>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
        <Toaster 
          position="top-right" 
          richColors 
          toastOptions={{
            style: {
              fontFamily: 'Manrope, sans-serif'
            }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
