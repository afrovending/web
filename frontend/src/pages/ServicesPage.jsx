import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapPin, Clock, Star, Grid, List, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import SearchFilters from '../components/SearchFilters';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ServicesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
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
    locationType: searchParams.get('location') || '',
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
        
        // Get only service subcategories
        const servicesCategory = categoriesRes.data.find(c => c.name === 'Services');
        if (servicesCategory) {
          const serviceSubcategories = categoriesRes.data.filter(c => c.parent_id === servicesCategory.id);
          setCategories(serviceSubcategories);
        }
        setVendors(vendorsRes.data);
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
      }
    };
    fetchMeta();
  }, []);

  // Fetch services when filters change
  const fetchServices = useCallback(async (currentFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (currentFilters.search) params.append('search', currentFilters.search);
      if (currentFilters.categoryIds.length > 0) params.append('category_ids', currentFilters.categoryIds.join(','));
      if (currentFilters.vendorId) params.append('vendor_id', currentFilters.vendorId);
      if (currentFilters.minPrice > 0) params.append('min_price', currentFilters.minPrice.toString());
      if (currentFilters.maxPrice < 1000) params.append('max_price', currentFilters.maxPrice.toString());
      if (currentFilters.minRating > 0) params.append('min_rating', currentFilters.minRating.toString());
      if (currentFilters.locationType) params.append('location_type', currentFilters.locationType);
      params.append('sort_by', currentFilters.sortBy);
      params.append('sort_order', currentFilters.sortOrder);
      params.append('limit', '50');

      const response = await axios.get(`${API}/services?${params.toString()}`);
      setServices(response.data);
      setTotalCount(response.data.length);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices(filters);
  }, [filters, fetchServices]);

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
    if (newFilters.locationType) params.set('location', newFilters.locationType);
    if (newFilters.sortBy !== 'created_at') params.set('sort_by', newFilters.sortBy);
    if (newFilters.sortOrder !== 'desc') params.set('sort_order', newFilters.sortOrder);
    
    setSearchParams(params);
  }, [setSearchParams]);

  const getPageTitle = () => {
    if (filters.search) return `Search: "${filters.search}"`;
    if (filters.categoryIds.length === 1) {
      const cat = categories.find(c => c.id === filters.categoryIds[0]);
      return cat?.name || 'Services';
    }
    return 'All Services';
  };

  const ServiceCard = ({ service }) => (
    <Link
      to={`/services/${service.id}`}
      className="group bg-card rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-all hover:shadow-lg"
      data-testid={`service-card-${service.id}`}
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img
          src={service.images?.[0] || 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400'}
          alt={service.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
          {service.location_type === 'remote' ? 'Remote' : service.location_type === 'in_person' ? 'In Person' : 'Flexible'}
        </Badge>
      </div>
      <div className="p-5">
        <p className="text-xs text-muted-foreground mb-1">{service.vendor_name}</p>
        <h3 className="font-heading font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
          {service.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[2.5rem]">
          {service.description}
        </p>
        
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {service.duration_minutes} min
          </span>
          {service.average_rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {service.average_rating.toFixed(1)}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="font-accent font-bold text-xl text-primary">
            ${service.price.toFixed(2)}
            {service.price_type === 'hourly' && <span className="text-sm font-normal">/hr</span>}
          </span>
          <Button size="sm" className="rounded-full" data-testid={`book-service-${service.id}`}>
            Book Now
          </Button>
        </div>
      </div>
    </Link>
  );

  const ServiceListItem = ({ service }) => (
    <Link
      to={`/services/${service.id}`}
      className="flex gap-4 bg-card rounded-xl p-4 border border-border hover:border-primary/30 transition-all group"
      data-testid={`service-list-${service.id}`}
    >
      <div className="w-48 h-32 rounded-lg overflow-hidden flex-shrink-0 relative">
        <img
          src={service.images?.[0] || 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400'}
          alt={service.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <Badge className="absolute top-2 left-2 bg-primary text-xs">
          {service.location_type === 'remote' ? 'Remote' : service.location_type === 'in_person' ? 'In Person' : 'Flexible'}
        </Badge>
      </div>
      <div className="flex-1 py-1">
        <p className="text-xs text-muted-foreground mb-1">{service.vendor_name}</p>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
          {service.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{service.description}</p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {service.duration_minutes} min
          </span>
          {service.location_type !== 'remote' && service.location_address && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {service.location_address}
            </span>
          )}
          {service.average_rating > 0 && (
            <span className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < Math.round(service.average_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
                />
              ))}
              <span className="ml-1">({service.review_count || 0})</span>
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end justify-between py-1">
        <span className="font-accent font-bold text-2xl text-primary">
          ${service.price.toFixed(2)}
          {service.price_type === 'hourly' && <span className="text-sm font-normal">/hr</span>}
        </span>
        <Button className="rounded-full">
          <Calendar className="h-4 w-4 mr-2" />
          Book Now
        </Button>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
            {getPageTitle()}
          </h1>
          <p className="text-muted-foreground">
            {totalCount} services found
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="w-72 flex-shrink-0">
            <SearchFilters
              type="services"
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
                Showing {services.length} of {totalCount} services
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

            {/* Services Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="bg-card rounded-xl overflow-hidden animate-pulse">
                    <div className="aspect-video bg-muted" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-5 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-6 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : services.length > 0 ? (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'space-y-4'
              }>
                {services.map((service) => (
                  viewMode === 'grid' ? (
                    <ServiceCard key={service.id} service={service} />
                  ) : (
                    <ServiceListItem key={service.id} service={service} />
                  )
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-xl border border-border">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">No services found</h3>
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
                    locationType: '',
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

export default ServicesPage;
