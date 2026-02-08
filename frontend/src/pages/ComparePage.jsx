import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, X, ShoppingCart, Check, Minus, GitCompare } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useCompare } from '../contexts/CompareContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const ComparePage = () => {
  const navigate = useNavigate();
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    
    try {
      await addToCart(productId);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  if (compareItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <div className="text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <GitCompare className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="font-heading text-2xl font-bold mb-4">No Products to Compare</h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Add products to compare by clicking the compare button on product cards.
            </p>
            <Button asChild className="rounded-full">
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const comparisonRows = [
    { label: 'Price', key: 'price', render: (item) => (
      <div>
        <span className="text-xl font-bold text-primary">${item.price?.toFixed(2)}</span>
        {item.compare_price && (
          <span className="text-sm text-muted-foreground line-through ml-2">
            ${item.compare_price.toFixed(2)}
          </span>
        )}
      </div>
    )},
    { label: 'Rating', key: 'rating', render: (item) => (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.round(item.average_rating || 0)
                  ? 'fill-primary text-primary'
                  : 'text-muted-foreground/30'
              }`}
            />
          ))}
        </div>
        <span className="text-sm">({item.review_count || 0})</span>
      </div>
    )},
    { label: 'Vendor', key: 'vendor', render: (item) => (
      <span className="text-muted-foreground">{item.vendor_name || 'N/A'}</span>
    )},
    { label: 'Category', key: 'category', render: (item) => (
      <Badge variant="secondary">{item.category_name || 'Uncategorized'}</Badge>
    )},
    { label: 'In Stock', key: 'stock', render: (item) => (
      <div className="flex items-center gap-2">
        {item.stock > 0 ? (
          <>
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-green-600">{item.stock} available</span>
          </>
        ) : (
          <>
            <Minus className="h-4 w-4 text-red-500" />
            <span className="text-red-600">Out of stock</span>
          </>
        )}
      </div>
    )},
    { label: 'Variants', key: 'variants', render: (item) => (
      item.has_variants ? (
        <Badge>Multiple options</Badge>
      ) : (
        <span className="text-muted-foreground">Single option</span>
      )
    )},
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border py-4 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            to="/products" 
            className="text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Products
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearCompare}
            className="text-muted-foreground"
          >
            Clear All
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-8">
          Compare Products ({compareItems.length})
        </h1>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" data-testid="compare-table">
            {/* Product Images & Names */}
            <thead>
              <tr>
                <th className="w-40 p-4 text-left text-sm font-medium text-muted-foreground bg-muted/50 rounded-tl-xl">
                  Product
                </th>
                {compareItems.map((item) => (
                  <th key={item.id} className="p-4 min-w-[200px] bg-muted/50">
                    <div className="relative">
                      <button
                        onClick={() => removeFromCompare(item.id)}
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90 transition-colors"
                        data-testid={`remove-${item.id}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <Link to={`/products/${item.id}`} className="block group">
                        <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden bg-background mb-3">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1567696154083-9547fd0c8e1d?w=200'}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {item.name}
                        </h3>
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Comparison Rows */}
            <tbody>
              {comparisonRows.map((row, idx) => (
                <tr key={row.key} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                  <td className="p-4 font-medium text-foreground border-r border-border">
                    {row.label}
                  </td>
                  {compareItems.map((item) => (
                    <td key={item.id} className="p-4 text-center">
                      {row.render(item)}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Description Row */}
              <tr className="bg-card">
                <td className="p-4 font-medium text-foreground border-r border-border align-top">
                  Description
                </td>
                {compareItems.map((item) => (
                  <td key={item.id} className="p-4 text-left">
                    <p className="text-sm text-muted-foreground line-clamp-4">
                      {item.description || 'No description available'}
                    </p>
                  </td>
                ))}
              </tr>

              {/* Add to Cart Row */}
              <tr className="bg-muted/50">
                <td className="p-4 font-medium text-foreground border-r border-border rounded-bl-xl">
                  Actions
                </td>
                {compareItems.map((item) => (
                  <td key={item.id} className="p-4">
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleAddToCart(item.id)}
                        className="rounded-full"
                        disabled={item.stock <= 0}
                        data-testid={`add-cart-${item.id}`}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="rounded-full"
                      >
                        <Link to={`/products/${item.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComparePage;
