import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ShoppingBag } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useCart } from '../contexts/CartContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PayPalSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const paypalToken = searchParams.get('token'); // PayPal adds this
  const { fetchCart } = useCart();
  
  const [status, setStatus] = useState('loading'); // loading, success, failed
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) {
      setStatus('failed');
      setError('Order ID not found');
      return;
    }

    const capturePayment = async () => {
      try {
        // First get the order to find the PayPal order ID
        const orderResponse = await axios.get(`${API}/checkout/paypal/status/${orderId}`);
        
        if (orderResponse.data.payment_status === 'paid') {
          // Already captured
          setOrderData(orderResponse.data);
          setStatus('success');
          fetchCart();
          return;
        }

        // Get PayPal order ID from the order
        const orderDetails = await axios.get(`${API}/orders/${orderId}`);
        const paypalOrderId = orderDetails.data.paypal_order_id;

        if (!paypalOrderId) {
          setStatus('failed');
          setError('PayPal order ID not found');
          return;
        }

        // Capture the payment
        const captureResponse = await axios.post(`${API}/checkout/paypal/capture?paypal_order_id=${paypalOrderId}`);
        
        if (captureResponse.data.status === 'success') {
          setOrderData({ ...orderResponse.data, payment_status: 'paid' });
          setStatus('success');
          fetchCart(); // Refresh cart to clear it
        } else {
          setStatus('failed');
          setError(captureResponse.data.message || 'Payment capture failed');
        }
      } catch (error) {
        console.error('Failed to capture payment:', error);
        setStatus('failed');
        setError(error.response?.data?.detail || 'Failed to process payment');
      }
    };

    capturePayment();
  }, [orderId, fetchCart]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
            Completing Payment...
          </h1>
          <p className="text-muted-foreground">Please wait while we confirm your PayPal payment.</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <XCircle className="h-20 w-20 text-destructive mx-auto mb-6" />
          <h1 className="font-heading text-3xl font-bold text-foreground mb-4">
            Payment Failed
          </h1>
          <p className="text-muted-foreground mb-8">
            {error || "We couldn't process your PayPal payment. Please try again or contact support if the issue persists."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="rounded-full" data-testid="retry-checkout-btn">
              <Link to="/cart">Return to Cart</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-secondary" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-foreground mb-4" data-testid="paypal-success-title">
          Payment Successful!
        </h1>
        <p className="text-muted-foreground mb-2">
          Thank you for your order. Your PayPal payment of{' '}
          <span className="font-semibold text-foreground">
            ${(orderData?.total || 0).toFixed(2)}
          </span>{' '}
          has been processed.
        </p>
        <p className="text-muted-foreground mb-8">
          You will receive an email confirmation shortly.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="rounded-full" data-testid="view-orders-btn">
            <Link to="/dashboard">
              <ShoppingBag className="mr-2 h-5 w-5" />
              View Orders
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PayPalSuccessPage;
