import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingCart, Heart as HeartEmpty } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';
import axios from 'axios';
import { useState, useEffect, useCallback } from 'react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const WishlistPage = () => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await axios.get(`${API}/wishlist`);
      setWishlist(response.data);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (productId) => {
    try {
      await axios.delete(`${API}/wishlist/${productId}`);
      setWishlist(wishlist.filter(item => item.product_id !== productId));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      await addToCart(productId);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <HeartEmpty className="h-24 w-24 mx-auto text-muted-foreground/30 mb-6" />
          <h1 className="font-heading text-3xl font-bold text-foreground mb-4">
            Your Wishlist
          </h1>
          <p className="text-muted-foreground mb-8">
            Please login to view your wishlist
          </p>
          <Button asChild className="rounded-full" data-testid="wishlist-login-btn">
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
          <h1 className="font-heading text-3xl font-bold text-foreground mb-8">My Wishlist</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-6 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-background py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <HeartEmpty className="h-24 w-24 mx-auto text-muted-foreground/30 mb-6" />
          <h1 className="font-heading text-3xl font-bold text-foreground mb-4">
            Your Wishlist is Empty
          </h1>
          <p className="text-muted-foreground mb-8">
            Save your favorite products here for later.
          </p>
          <Button asChild className="rounded-full" data-testid="wishlist-shop-btn">
            <Link to="/products">Explore Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 md:py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-8">
          My Wishlist
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => (
            <div
              key={item.id}
              className="bg-card rounded-xl overflow-hidden border border-border group"
              data-testid={`wishlist-item-${item.id}`}
            >
              <Link to={`/products/${item.product_id}`} className="block">
                <div className="aspect-square overflow-hidden bg-muted">
                  <img
                    src={item.product_image || 'https://images.unsplash.com/photo-1567696154083-9547fd0c8e1d?w=400'}
                    alt={item.product_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </Link>
              
              <div className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{item.vendor_name}</p>
                <Link
                  to={`/products/${item.product_id}`}
                  className="font-heading font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors"
                >
                  {item.product_name}
                </Link>
                <p className="font-accent font-semibold text-lg mt-2">
                  ${item.price.toFixed(2)}
                </p>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    className="flex-1 rounded-full"
                    onClick={() => handleAddToCart(item.product_id)}
                    data-testid={`wishlist-add-cart-${item.id}`}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemove(item.product_id)}
                    data-testid={`wishlist-remove-${item.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
