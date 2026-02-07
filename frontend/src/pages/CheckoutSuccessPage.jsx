import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ShoppingBag } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useCart } from '../contexts/CartContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { fetchCart } = useCart();
  
  const [status, setStatus] = useState('loading'); // loading, success, failed
  const [paymentData, setPaymentData] = useState(null);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setStatus('failed');
      return;
    }

    const pollPaymentStatus = async () => {
      if (pollCount >= 5) {
        setStatus('failed');
        return;
      }

      try {
        const response = await axios.get(`${API}/checkout/status/${sessionId}`);
        setPaymentData(response.data);
        
        if (response.data.payment_status === 'paid') {
          setStatus('success');
          fetchCart(); // Refresh cart to clear it
        } else if (response.data.status === 'expired') {
          setStatus('failed');
        } else {
          // Keep polling
          setPollCount(prev => prev + 1);
          setTimeout(pollPaymentStatus, 2000);
        }
      } catch (error) {
        console.error('Failed to check payment status:', error);
        setPollCount(prev => prev + 1);
        setTimeout(pollPaymentStatus, 2000);
      }
    };

    pollPaymentStatus();
  }, [sessionId, pollCount, fetchCart]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
            Processing Payment...
          </h1>
          <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
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
            We couldn't process your payment. Please try again or contact support if the issue persists.
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
        <h1 className="font-heading text-3xl font-bold text-foreground mb-4" data-testid="success-title">
          Payment Successful!
        </h1>
        <p className="text-muted-foreground mb-2">
          Thank you for your order. Your payment of{' '}
          <span className="font-semibold text-foreground">
            ${((paymentData?.amount_total || 0) / 100).toFixed(2)}
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

export default CheckoutSuccessPage;
