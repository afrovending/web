import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, SlidersHorizontal, Grid, List, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import ProductCard from '../components/ProductCard';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');

  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category') || '';
  const sortBy = searchParams.get('sort') || 'created_at';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (categoryId) params.append('category_id', categoryId);
        if (minPrice) params.append('min_price', minPrice);
        if (maxPrice) params.append('max_price', maxPrice);
        
        const [sortField, sortOrder] = sortBy.split('-');
        params.append('sort_by', sortField || 'created_at');
        params.append('sort_order', sortOrder || 'desc');
        params.append('limit', '50');

        const [productsRes, categoriesRes] = await Promise.all([
          axios.get(`${API}/products?${params.toString()}`),
          axios.get(`${API}/categories`)
        ]);
        
        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [search, categoryId, sortBy, minPrice, maxPrice]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasFilters = search || categoryId || minPrice || maxPrice;

  const FilterSidebar = ({ isMobile = false }) => (
    <div className={isMobile ? '' : 'sticky top-24'}>
      <div className="space-y-6">
        {/* Categories */}
        <div>
          <h3 className="font-heading font-semibold text-foreground mb-4">Categories</h3>
          <div className="space-y-2">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors"
              >
                <Checkbox
                  checked={categoryId === cat.id}
                  onCheckedChange={(checked) => updateFilter('category', checked ? cat.id : '')}
                  data-testid={`filter-category-${cat.id}`}
                />
                <span className="text-sm">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h3 className="font-heading font-semibold text-foreground mb-4">Price Range</h3>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => updateFilter('min_price', e.target.value)}
              className="h-10"
              data-testid="filter-min-price"
            />
            <Input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => updateFilter('max_price', e.target.value)}
              className="h-10"
              data-testid="filter-max-price"
            />
          </div>
        </div>

        {hasFilters && (
          <Button
            variant="outline"
            className="w-full"
            onClick={clearFilters}
            data-testid="clear-filters-btn"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
            {search ? `Search: "${search}"` : categoryId ? categories.find(c => c.id === categoryId)?.name || 'Products' : 'All Products'}
          </h1>
          <p className="text-muted-foreground">
            {products.length} products found
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterSidebar />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-4">
              {/* Mobile Filter */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden" data-testid="mobile-filter-btn">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterSidebar isMobile />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort */}
              <div className="flex items-center gap-4 ml-auto">
                <Select value={sortBy} onValueChange={(v) => updateFilter('sort', v)}>
                  <SelectTrigger className="w-[180px]" data-testid="sort-select">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at-desc">Newest First</SelectItem>
                    <SelectItem value="created_at-asc">Oldest First</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="average_rating-desc">Top Rated</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="hidden sm:flex border border-border rounded-lg">
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
                      className="flex gap-4 bg-card rounded-xl p-4 border border-border hover:border-primary/30 transition-all"
                      data-testid={`product-list-${product.id}`}
                    >
                      <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={product.images?.[0] || 'https://images.unsplash.com/photo-1567696154083-9547fd0c8e1d?w=200'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">{product.vendor_name}</p>
                        <h3 className="font-heading font-semibold text-foreground mb-2">{product.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{product.description}</p>
                        <span className="font-accent font-semibold text-lg">${product.price.toFixed(2)}</span>
                      </div>
                    </Link>
                  )
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg mb-4">No products found</p>
                {hasFilters && (
                  <Button variant="outline" onClick={clearFilters} data-testid="no-results-clear-btn">
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
