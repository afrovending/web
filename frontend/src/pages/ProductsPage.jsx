import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Grid, List, Star, Heart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import SearchFilters from '../components/SearchFilters';
import ProductCard from '../components/ProductCard';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState('grid');

  // Parse initial filters from URL
  const getInitialFilters = () => ({
    search: searchParams.get('search') || '',
    categoryIds: searchParams.get('categories')?.split(',').filter(Boolean) || [],
    vendorId: searchParams.get('vendor') || '',
    minPrice: parseFloat(searchParams.get('min_price')) || 0,
    maxPrice: parseFloat(searchParams.get('max_price')) || 1000,
    minRating: parseFloat(searchParams.get('min_rating')) || 0,
    inStock: searchParams.get('in_stock') === 'true',
    sortBy: searchParams.get('sort_by') || 'created_at',
    sortOrder: searchParams.get('sort_order') || 'desc'
  });

  const [filters, setFilters] = useState(getInitialFilters);

  // Fetch categories and vendors on mount
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [categoriesRes, vendorsRes] = await Promise.all([
          axios.get(`${API}/categories`),
          axios.get(`${API}/vendors?is_approved=true`)
        ]);
        // Filter to product categories (exclude service categories)
        const productCategories = categoriesRes.data.filter(c => 
          !c.parent_id || !['services', 'beauty-services', 'culinary-services', 'logistics-services', 
            'event-services', 'professional-services', 'home-services', 'wellness-services', 
            'education-services', 'creative-services'].includes(c.id)
        );
        setCategories(productCategories);
        setVendors(vendorsRes.data);
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
      }
    };
    fetchMeta();
  }, []);

  // Fetch products when filters change
  const fetchProducts = useCallback(async (currentFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (currentFilters.search) params.append('search', currentFilters.search);
      if (currentFilters.categoryIds.length > 0) params.append('category_ids', currentFilters.categoryIds.join(','));
      if (currentFilters.vendorId) params.append('vendor_id', currentFilters.vendorId);
      if (currentFilters.minPrice > 0) params.append('min_price', currentFilters.minPrice.toString());
      if (currentFilters.maxPrice < 1000) params.append('max_price', currentFilters.maxPrice.toString());
      if (currentFilters.minRating > 0) params.append('min_rating', currentFilters.minRating.toString());
      if (currentFilters.inStock) params.append('in_stock', 'true');
      params.append('sort_by', currentFilters.sortBy);
      params.append('sort_order', currentFilters.sortOrder);
      params.append('limit', '50');

      const response = await axios.get(`${API}/products?${params.toString()}`);
      setProducts(response.data);
      setTotalCount(response.data.length);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(filters);
  }, [filters, fetchProducts]);

  // Update URL when filters change
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.categoryIds.length > 0) params.set('categories', newFilters.categoryIds.join(','));
    if (newFilters.vendorId) params.set('vendor', newFilters.vendorId);
    if (newFilters.minPrice > 0) params.set('min_price', newFilters.minPrice.toString());
    if (newFilters.maxPrice < 1000) params.set('max_price', newFilters.maxPrice.toString());
    if (newFilters.minRating > 0) params.set('min_rating', newFilters.minRating.toString());
    if (newFilters.inStock) params.set('in_stock', 'true');
    if (newFilters.sortBy !== 'created_at') params.set('sort_by', newFilters.sortBy);
    if (newFilters.sortOrder !== 'desc') params.set('sort_order', newFilters.sortOrder);
    
    setSearchParams(params);
  }, [setSearchParams]);

  const getPageTitle = () => {
    if (filters.search) return `Search: "${filters.search}"`;
    if (filters.categoryIds.length === 1) {
      const cat = categories.find(c => c.id === filters.categoryIds[0]);
      return cat?.name || 'Products';
    }
    return 'All Products';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
            {getPageTitle()}
          </h1>
          <p className="text-muted-foreground">
            {totalCount} products found
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="w-72 flex-shrink-0">
            <SearchFilters
              type="products"
              categories={categories}
              vendors={vendors}
              onFilterChange={handleFilterChange}
              initialFilters={filters}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                Showing {products.length} of {totalCount} products
              </p>
              
              {/* View Toggle */}
              <div className="flex border border-border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  className="rounded-r-none"
                  onClick={() => setViewMode('grid')}
                  data-testid="view-grid-btn"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className="rounded-l-none"
                  onClick={() => setViewMode('list')}
                  data-testid="view-list-btn"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
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
            ) : products.length > 0 ? (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'space-y-4'
              }>
                {products.map((product) => (
                  viewMode === 'grid' ? (
                    <ProductCard key={product.id} product={product} />
                  ) : (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      className="flex gap-4 bg-card rounded-xl p-4 border border-border hover:border-primary/30 transition-all group"
                      data-testid={`product-list-${product.id}`}
                    >
                      <div className="w-40 h-40 rounded-lg overflow-hidden flex-shrink-0 relative">
                        <img
                          src={product.images?.[0] || 'https://images.unsplash.com/photo-1567696154083-9547fd0c8e1d?w=200'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {product.compare_price && product.compare_price > product.price && (
                          <Badge className="absolute top-2 left-2 bg-primary">
                            {Math.round((1 - product.price / product.compare_price) * 100)}% OFF
                          </Badge>
                        )}
                      </div>
                      <div className="flex-1 py-2">
                        <p className="text-xs text-muted-foreground mb-1">{product.vendor_name}</p>
                        <h3 className="font-heading font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
                        
                        {/* Rating */}
                        {product.average_rating > 0 && (
                          <div className="flex items-center gap-1 mb-3">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < Math.round(product.average_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
                              />
                            ))}
                            <span className="text-sm text-muted-foreground ml-1">
                              ({product.review_count || 0})
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-2">
                            <span className="font-accent font-bold text-xl text-primary">
                              ${product.price.toFixed(2)}
                            </span>
                            {product.compare_price && product.compare_price > product.price && (
                              <span className="text-sm text-muted-foreground line-through">
                                ${product.compare_price.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {product.stock <= 5 && product.stock > 0 && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              Only {product.stock} left
                            </Badge>
                          )}
                          {product.stock === 0 && (
                            <Badge variant="outline" className="text-red-600 border-red-600">
                              Out of Stock
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-xl border border-border">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Grid className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => handleFilterChange({
                    search: '',
                    categoryIds: [],
                    vendorId: '',
                    minPrice: 0,
                    maxPrice: 1000,
                    minRating: 0,
                    inStock: false,
                    sortBy: 'created_at',
                    sortOrder: 'desc'
                  })}
                  data-testid="no-results-clear-btn"
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
