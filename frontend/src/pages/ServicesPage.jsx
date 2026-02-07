import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, MapPin, Clock, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
import { Badge } from '../components/ui/badge';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ServicesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category') || '';
  const locationType = searchParams.get('location') || '';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (categoryId) params.append('category_id', categoryId);
        if (locationType) params.append('location_type', locationType);
        params.append('limit', '50');

        const [servicesRes, categoriesRes] = await Promise.all([
          axios.get(`${API}/services?${params.toString()}`),
          axios.get(`${API}/categories`)
        ]);
        
        setServices(servicesRes.data);
        // Get only service subcategories
        const servicesCategory = categoriesRes.data.find(c => c.name === 'Services');
        if (servicesCategory) {
          const serviceSubcategories = categoriesRes.data.filter(c => c.parent_id === servicesCategory.id);
          setCategories(serviceSubcategories);
        }
      } catch (error) {
        console.error('Failed to fetch services:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [search, categoryId, locationType]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
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
          {service.location_type === 'remote' ? 'Remote' : service.location_type === 'onsite' ? 'On-site' : 'Flexible'}
        </Badge>
      </div>
      <div className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{service.vendor_name}</p>
        <h3 className="font-heading font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {service.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{service.description}</p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {service.duration_minutes} min
          </span>
          {service.review_count > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-primary text-primary" />
              {service.average_rating.toFixed(1)}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="font-heading font-bold text-lg text-foreground">
            ${service.price.toFixed(2)}
            {service.price_type === 'hourly' && <span className="text-sm font-normal">/hr</span>}
            {service.price_type === 'starting_from' && <span className="text-sm font-normal">+</span>}
          </span>
          <Button size="sm" className="rounded-full">Book Now</Button>
        </div>
      </div>
    </Link>
  );

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Service Categories */}
      <div>
        <h3 className="font-heading font-semibold text-foreground mb-4">Service Type</h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors"
            >
              <Checkbox
                checked={categoryId === cat.id}
                onCheckedChange={(checked) => updateFilter('category', checked ? cat.id : '')}
                data-testid={`filter-service-${cat.id}`}
              />
              <span className="text-sm">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Location Type */}
      <div>
        <h3 className="font-heading font-semibold text-foreground mb-4">Location</h3>
        <div className="space-y-2">
          {[
            { value: 'onsite', label: 'On-site' },
            { value: 'remote', label: 'Remote' },
            { value: 'both', label: 'Flexible' },
          ].map((loc) => (
            <label
              key={loc.value}
              className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors"
            >
              <Checkbox
                checked={locationType === loc.value}
                onCheckedChange={(checked) => updateFilter('location', checked ? loc.value : '')}
              />
              <span className="text-sm">{loc.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-secondary text-white py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">
            African Services
          </h1>
          <p className="text-white/80">
            Book professional services from trusted African providers
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
                  <Button variant="outline" className="lg:hidden">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterSidebar />
                  </div>
                </SheetContent>
              </Sheet>

              <p className="text-muted-foreground">
                {services.length} services found
              </p>
            </div>

            {/* Services Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-card rounded-xl overflow-hidden animate-pulse">
                    <div className="aspect-video bg-muted" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-5 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-6 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg mb-4">No services found</p>
                <p className="text-sm text-muted-foreground">Be the first to offer services in this category!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
