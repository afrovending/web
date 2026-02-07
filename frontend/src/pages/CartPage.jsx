import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';
import CouponInput from '../components/CouponInput';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, loading, fetchCart } = useCart();
  const { isAuthenticated } = useAuth();

  const handleCouponApplied = () => {
    fetchCart();
  };

  const handleCouponRemoved = () => {
    fetchCart();
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    try {
      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeFromCart(itemId);
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to checkout');
      navigate('/login');
      return;
    }
    
    try {
      const response = await axios.post(`${API}/checkout/stripe`, {
        payment_method: 'stripe',
        origin_url: window.location.origin
      });
      
      // Redirect to Stripe checkout
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start checkout');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground/30 mb-6" />
          <h1 className="font-heading text-3xl font-bold text-foreground mb-4">
            Your Cart
          </h1>
          <p className="text-muted-foreground mb-8">
            Please login to view your cart
          </p>
          <Button asChild className="rounded-full" data-testid="cart-login-btn">
            <Link to="/login">Login to Continue</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-heading text-3xl font-bold text-foreground mb-8">Shopping Cart</h1>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-muted rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-5 bg-muted rounded w-1/2" />
                    <div className="h-6 bg-muted rounded w-1/6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground/30 mb-6" />
          <h1 className="font-heading text-3xl font-bold text-foreground mb-4">
            Your Cart is Empty
          </h1>
          <p className="text-muted-foreground mb-8">
            Discover amazing African products and add them to your cart.
          </p>
          <Button asChild className="rounded-full" data-testid="cart-shop-btn">
            <Link to="/products">
              Start Shopping
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 md:py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-8">
          Shopping Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="bg-card rounded-xl p-4 md:p-6 border border-border"
                data-testid={`cart-item-${item.id}`}
              >
                <div className="flex gap-4">
                  <Link to={`/products/${item.product_id}`} className="flex-shrink-0">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={item.product_image || 'https://images.unsplash.com/photo-1567696154083-9547fd0c8e1d?w=200'}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{item.vendor_name}</p>
                    <Link
                      to={`/products/${item.product_id}`}
                      className="font-heading font-semibold text-foreground hover:text-primary line-clamp-1"
                    >
                      {item.product_name}
                    </Link>
                    
                    {/* Variant Options */}
                    {item.selected_options && Object.keys(item.selected_options).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {Object.entries(item.selected_options).map(([key, value]) => (
                          <span key={key} className="text-xs bg-muted px-2 py-0.5 rounded">
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.variant_sku && (
                      <p className="text-xs text-muted-foreground mt-1">SKU: {item.variant_sku}</p>
                    )}
                    
                    <p className="font-accent font-semibold text-lg mt-1">
                      ${item.price.toFixed(2)}
                    </p>
                    
                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity */}
                      <div className="flex items-center border border-border rounded-full">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full h-8 w-8"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          data-testid={`cart-decrease-${item.id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full h-8 w-8"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          data-testid={`cart-increase-${item.id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* Remove */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemove(item.id)}
                        data-testid={`cart-remove-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl p-6 border border-border sticky top-24">
              <h2 className="font-heading font-semibold text-xl mb-6">Order Summary</h2>
              
              {/* Coupon Input */}
              <div className="mb-6">
                <CouponInput
                  onCouponApplied={handleCouponApplied}
                  appliedCode={cart.discount_code}
                  onCouponRemoved={handleCouponRemoved}
                />
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${cart.subtotal.toFixed(2)}</span>
                </div>
                
                {/* Discount Line */}
                {cart.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600" data-testid="discount-line">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Discount ({cart.discount_code})
                    </span>
                    <span>-${cart.discount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-secondary">Free</span>
                </div>
              </div>
              
              <div className="border-t border-border pt-4 mb-6">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="font-accent">${cart.total.toFixed(2)}</span>
                </div>
                {cart.discount > 0 && (
                  <p className="text-xs text-green-600 mt-1" data-testid="savings-message">
                    You're saving ${cart.discount.toFixed(2)} on this order!
                  </p>
                )}
              </div>
              
              <Button
                className="w-full rounded-full h-12 text-lg font-semibold"
                onClick={handleCheckout}
                data-testid="checkout-btn"
              >
                Proceed to Checkout
              </Button>
              
              <p className="text-xs text-muted-foreground text-center mt-4">
                Secure checkout powered by Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
