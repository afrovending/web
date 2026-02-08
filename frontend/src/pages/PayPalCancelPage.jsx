import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

const PayPalCancelPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <XCircle className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
        <h1 className="font-heading text-3xl font-bold text-foreground mb-4">
          Payment Cancelled
        </h1>
        <p className="text-muted-foreground mb-8">
          Your PayPal payment was cancelled. No charges were made to your account.
          Your items are still in your cart.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="rounded-full" data-testid="back-to-cart-btn">
            <Link to="/cart">Return to Cart</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PayPalCancelPage;
