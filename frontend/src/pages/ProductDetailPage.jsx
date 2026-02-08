import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Minus, Plus, ChevronLeft, Store, Truck, Shield, RotateCcw, BadgeCheck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import ProductCard from '../components/ProductCard';
import VariantSelector from '../components/VariantSelector';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  
  // Variant selection
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  
  // Review form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const productRes = await axios.get(`${API}/products/${productId}`);
        setProduct(productRes.data);
        
        // Fetch vendor
        if (productRes.data.vendor_id) {
          try {
            const vendorRes = await axios.get(`${API}/vendors/${productRes.data.vendor_id}`);
            setVendor(vendorRes.data);
          } catch (e) {
            console.log('Vendor not found');
          }
        }
        
        // Fetch reviews
        const reviewsRes = await axios.get(`${API}/products/${productId}/reviews`);
        setReviews(reviewsRes.data);
        
        // Fetch related products
        if (productRes.data.category_id) {
          const relatedRes = await axios.get(`${API}/products?category_id=${productRes.data.category_id}&limit=4`);
          setRelatedProducts(relatedRes.data.filter(p => p.id !== productId));
        }
        
        // Track product view for analytics
        try {
          const sessionId = sessionStorage.getItem('session_id') || (() => {
            const id = Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('session_id', id);
            return id;
          })();
          await axios.post(`${API}/analytics/track-view?product_id=${productId}&source=direct&session_id=${sessionId}`);
        } catch (e) {
          // Silently fail - analytics tracking shouldn't break the page
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
        toast.error('Product not found');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [productId, navigate]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }
    
    // Check if product has variants and user hasn't selected one
    if (product.has_variants && product.variants?.length > 0 && !selectedVariant) {
      toast.error('Please select product options');
      return;
    }
    
    try {
      await addToCart(product.id, quantity, selectedVariant?.id, selectedOptions);
      toast.success(`Added ${quantity} item(s) to cart`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add to cart');
    }
  };

  const handleVariantSelect = useCallback((variant, options) => {
    setSelectedVariant(variant);
    setSelectedOptions(options);
    
    // If variant has a specific image, show it
    if (variant?.image && product?.images) {
      const variantImageIndex = product.images.indexOf(variant.image);
      if (variantImageIndex >= 0) {
        setSelectedImage(variantImageIndex);
      }
    }
  }, [product?.images]);

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }
    
    try {
      await axios.post(`${API}/wishlist/${product.id}`);
      toast.success('Added to wishlist!');
    } catch (error) {
      toast.error('Failed to add to wishlist');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to submit a review');
      return;
    }
    
    setSubmittingReview(true);
    try {
      const response = await axios.post(`${API}/products/${productId}/reviews`, {
        product_id: productId,
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment
      });
      
      setReviews([response.data, ...reviews]);
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      toast.success('Review submitted!');
      
      // Update product rating
      setProduct(prev => ({
        ...prev,
        average_rating: ((prev.average_rating * prev.review_count) + reviewRating) / (prev.review_count + 1),
        review_count: prev.review_count + 1
      }));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
            <div className="aspect-square bg-muted rounded-xl" />
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded w-1/4" />
              <div className="h-10 bg-muted rounded w-3/4" />
              <div className="h-24 bg-muted rounded" />
              <div className="h-12 bg-muted rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const images = product.images?.length > 0 
    ? product.images 
    : ['https://images.unsplash.com/photo-1567696154083-9547fd0c8e1d?w=800'];

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-card border-b border-border py-4 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
          <Link to="/products" className="text-muted-foreground hover:text-primary flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-xl overflow-hidden bg-muted">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      selectedImage === idx ? 'border-primary' : 'border-transparent'
                    }`}
                    data-testid={`image-thumb-${idx}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Vendor */}
            {vendor && (
              <Link 
                to={`/vendors/${vendor.id}`}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="product-vendor-link"
              >
                <Store className="h-4 w-4" />
                {vendor.store_name}
              </Link>
            )}

            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground" data-testid="product-title">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(product.average_rating)
                        ? 'fill-accent text-accent'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.average_rating.toFixed(1)} ({product.review_count} reviews)
              </span>
            </div>

            {/* Price - Show base price if no variants or no variant selected */}
            {(!product.has_variants || !selectedVariant) && (
              <div className="flex items-center gap-4">
                <span className="font-accent text-4xl font-bold text-foreground" data-testid="product-price">
                  ${product.price.toFixed(2)}
                </span>
                {product.compare_price && (
                  <span className="text-xl text-muted-foreground line-through">
                    ${product.compare_price.toFixed(2)}
                  </span>
                )}
                {product.compare_price && product.compare_price > product.price && (
                  <Badge className="bg-primary">
                    {Math.round((1 - product.price / product.compare_price) * 100)}% OFF
                  </Badge>
                )}
              </div>
            )}

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>

            {/* Variant Selector */}
            {product.has_variants && product.variant_options?.length > 0 && (
              <VariantSelector
                product={product}
                onVariantSelect={handleVariantSelect}
                selectedOptions={selectedOptions}
                className="py-4 border-y border-border"
              />
            )}

            {/* Stock - Show based on variant or product */}
            {!product.has_variants && (
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-secondary' : 'bg-destructive'}`} />
                <span className="text-sm">
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center border border-border rounded-full">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  data-testid="qty-decrease"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium" data-testid="qty-value">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => {
                    const maxStock = selectedVariant?.stock ?? product.stock;
                    setQuantity(Math.min(maxStock, quantity + 1));
                  }}
                  disabled={quantity >= (selectedVariant?.stock ?? product.stock)}
                  data-testid="qty-increase"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                size="lg"
                className="rounded-full flex-1 sm:flex-initial px-8"
                onClick={handleAddToCart}
                disabled={
                  (product.has_variants && product.variants?.length > 0 && !selectedVariant) ||
                  (selectedVariant ? selectedVariant.stock === 0 : product.stock === 0)
                }
                data-testid="add-to-cart-btn"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {product.has_variants && !selectedVariant ? 'Select Options' : 'Add to Cart'}
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="rounded-full"
                onClick={handleAddToWishlist}
                data-testid="add-to-wishlist-btn"
              >
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border">
              {[
                { icon: Truck, text: 'Free Shipping' },
                { icon: Shield, text: 'Secure Payment' },
                { icon: RotateCcw, text: 'Easy Returns' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className="h-4 w-4 text-primary" />
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="reviews" className="mb-16">
          <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0">
            <TabsTrigger
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              data-testid="tab-reviews"
            >
              Reviews ({reviews.length})
            </TabsTrigger>
            <TabsTrigger
              value="description"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              data-testid="tab-description"
            >
              Details
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="reviews" className="pt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Review Form */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-xl p-6 border border-border">
                  <h3 className="font-heading font-semibold text-lg mb-4">Write a Review</h3>
                  {isAuthenticated ? (
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Rating</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="focus:outline-none"
                              data-testid={`rating-star-${star}`}
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  star <= reviewRating ? 'fill-accent text-accent' : 'text-muted-foreground/30'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Title</label>
                        <Input
                          value={reviewTitle}
                          onChange={(e) => setReviewTitle(e.target.value)}
                          placeholder="Review title"
                          data-testid="review-title-input"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Comment</label>
                        <Textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Share your experience..."
                          rows={4}
                          data-testid="review-comment-input"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full rounded-full"
                        disabled={submittingReview}
                        data-testid="submit-review-btn"
                      >
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </Button>
                    </form>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-4">Please login to write a review</p>
                      <Button asChild variant="outline" className="rounded-full">
                        <Link to="/login">Login</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Reviews List */}
              <div className="lg:col-span-2 space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="bg-card rounded-xl p-6 border border-border" data-testid={`review-${review.id}`}>
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>{review.user_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{review.user_name}</h4>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'fill-accent text-accent' : 'text-muted-foreground/30'
                                }`}
                              />
                            ))}
                          </div>
                          {review.title && (
                            <h5 className="font-medium mb-1">{review.title}</h5>
                          )}
                          {review.comment && (
                            <p className="text-muted-foreground">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No reviews yet. Be the first to review this product!
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="description" className="pt-8">
            <div className="prose max-w-none">
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              {product.tags?.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, i) => (
                      <span key={i} className="bg-muted px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-8">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
