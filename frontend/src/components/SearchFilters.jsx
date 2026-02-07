import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

const SearchFilters = ({
  type = 'products', // 'products' or 'services'
  categories = [],
  vendors = [],
  onFilterChange,
  initialFilters = {},
  showMobileToggle = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    categoryIds: [],
    vendorId: '',
    minPrice: 0,
    maxPrice: 1000,
    minRating: 0,
    locationType: '',
    inStock: false,
    sortBy: 'created_at',
    sortOrder: 'desc',
    ...initialFilters
  });

  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    rating: false,
    location: false,
    vendor: false
  });

  useEffect(() => {
    // Debounce filter changes
    const timer = setTimeout(() => {
      onFilterChange(filters);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, onFilterChange]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (categoryId) => {
    setFilters(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      categoryIds: [],
      vendorId: '',
      minPrice: 0,
      maxPrice: 1000,
      minRating: 0,
      locationType: '',
      inStock: false,
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
  };

  const activeFiltersCount = [
    filters.categoryIds.length > 0,
    filters.vendorId,
    filters.minPrice > 0,
    filters.maxPrice < 1000,
    filters.minRating > 0,
    filters.locationType,
    filters.inStock
  ].filter(Boolean).length;

  const sortOptions = [
    { value: 'created_at-desc', label: 'Newest First' },
    { value: 'created_at-asc', label: 'Oldest First' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'average_rating-desc', label: 'Highest Rated' },
    { value: 'name-asc', label: 'Name: A-Z' },
    { value: 'name-desc', label: 'Name: Z-A' }
  ];

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={`Search ${type}...`}
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9"
            data-testid="filter-search-input"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Sort By</Label>
        <Select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onValueChange={(value) => {
            const [sortBy, sortOrder] = value.split('-');
            updateFilter('sortBy', sortBy);
            updateFilter('sortOrder', sortOrder);
          }}
        >
          <SelectTrigger data-testid="filter-sort-select">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Categories */}
      <Collapsible
        open={expandedSections.categories}
        onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, categories: open }))}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
          <Label className="text-sm font-medium cursor-pointer">Categories</Label>
          {expandedSections.categories ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {categories.map(category => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`cat-${category.id}`}
                  checked={filters.categoryIds.includes(category.id)}
                  onCheckedChange={() => toggleCategory(category.id)}
                  data-testid={`filter-category-${category.id}`}
                />
                <label
                  htmlFor={`cat-${category.id}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {category.name}
                </label>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Price Range */}
      <Collapsible
        open={expandedSections.price}
        onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, price: open }))}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
          <Label className="text-sm font-medium cursor-pointer">Price Range</Label>
          {expandedSections.price ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-4">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) => updateFilter('minPrice', parseFloat(e.target.value) || 0)}
              className="w-24"
              data-testid="filter-min-price"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) => updateFilter('maxPrice', parseFloat(e.target.value) || 1000)}
              className="w-24"
              data-testid="filter-max-price"
            />
          </div>
          <Slider
            value={[filters.minPrice, filters.maxPrice]}
            onValueChange={([min, max]) => {
              updateFilter('minPrice', min);
              updateFilter('maxPrice', max);
            }}
            max={1000}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${filters.minPrice}</span>
            <span>${filters.maxPrice}</span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Rating */}
      <Collapsible
        open={expandedSections.rating}
        onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, rating: open }))}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
          <Label className="text-sm font-medium cursor-pointer">Minimum Rating</Label>
          {expandedSections.rating ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="space-y-2">
            {[4, 3, 2, 1].map(rating => (
              <div key={rating} className="flex items-center space-x-2">
                <Checkbox
                  id={`rating-${rating}`}
                  checked={filters.minRating === rating}
                  onCheckedChange={(checked) => updateFilter('minRating', checked ? rating : 0)}
                  data-testid={`filter-rating-${rating}`}
                />
                <label htmlFor={`rating-${rating}`} className="flex items-center gap-1 cursor-pointer">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-1">& up</span>
                </label>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Location Type (Services only) */}
      {type === 'services' && (
        <Collapsible
          open={expandedSections.location}
          onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, location: open }))}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
            <Label className="text-sm font-medium cursor-pointer">Location Type</Label>
            {expandedSections.location ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="space-y-2">
              {['in_person', 'remote', 'both'].map(loc => (
                <div key={loc} className="flex items-center space-x-2">
                  <Checkbox
                    id={`loc-${loc}`}
                    checked={filters.locationType === loc}
                    onCheckedChange={(checked) => updateFilter('locationType', checked ? loc : '')}
                    data-testid={`filter-location-${loc}`}
                  />
                  <label htmlFor={`loc-${loc}`} className="text-sm cursor-pointer capitalize">
                    {loc.replace('_', ' ')}
                  </label>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* In Stock (Products only) */}
      {type === 'products' && (
        <div className="flex items-center space-x-2 py-2">
          <Checkbox
            id="in-stock"
            checked={filters.inStock}
            onCheckedChange={(checked) => updateFilter('inStock', checked)}
            data-testid="filter-in-stock"
          />
          <label htmlFor="in-stock" className="text-sm cursor-pointer">
            In Stock Only
          </label>
        </div>
      )}

      {/* Vendor Filter */}
      {vendors.length > 0 && (
        <Collapsible
          open={expandedSections.vendor}
          onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, vendor: open }))}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
            <Label className="text-sm font-medium cursor-pointer">Vendor</Label>
            {expandedSections.vendor ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <Select
              value={filters.vendorId}
              onValueChange={(value) => updateFilter('vendorId', value)}
            >
              <SelectTrigger data-testid="filter-vendor-select">
                <SelectValue placeholder="All Vendors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Vendors</SelectItem>
                {vendors.map(vendor => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.store_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={clearFilters}
          data-testid="clear-filters-btn"
        >
          <X className="h-4 w-4 mr-2" />
          Clear All Filters ({activeFiltersCount})
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      {showMobileToggle && (
        <div className="lg:hidden mb-4">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setIsOpen(!isOpen)}
            data-testid="mobile-filter-toggle"
          >
            <span className="flex items-center">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-primary">{activeFiltersCount}</Badge>
              )}
            </span>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          {isOpen && (
            <div className="mt-4 p-4 bg-card rounded-xl border border-border">
              <FilterContent />
            </div>
          )}
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <div className="sticky top-24 bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold">Filters</h3>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount} active</Badge>
            )}
          </div>
          <FilterContent />
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 lg:hidden">
          {filters.categoryIds.map(catId => {
            const cat = categories.find(c => c.id === catId);
            return cat ? (
              <Badge key={catId} variant="secondary" className="gap-1">
                {cat.name}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => toggleCategory(catId)}
                />
              </Badge>
            ) : null;
          })}
          {filters.minPrice > 0 && (
            <Badge variant="secondary" className="gap-1">
              Min: ${filters.minPrice}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('minPrice', 0)}
              />
            </Badge>
          )}
          {filters.maxPrice < 1000 && (
            <Badge variant="secondary" className="gap-1">
              Max: ${filters.maxPrice}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('maxPrice', 1000)}
              />
            </Badge>
          )}
          {filters.minRating > 0 && (
            <Badge variant="secondary" className="gap-1">
              {filters.minRating}+ Stars
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('minRating', 0)}
              />
            </Badge>
          )}
        </div>
      )}
    </>
  );
};

export default SearchFilters;
