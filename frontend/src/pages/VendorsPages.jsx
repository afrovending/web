import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, Package, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import ProductCard from '../components/ProductCard';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Vendors List Page
const VendorsPage = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await axios.get(`${API}/vendors?is_approved=true`);
        setVendors(response.data);
      } catch (error) {
        console.error('Failed to fetch vendors:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
            Our Vendors
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Meet the talented African artisans and entrepreneurs bringing authentic products to the world.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-6 animate-pulse">
                <div className="w-24 h-24 rounded-full bg-muted mx-auto mb-4" />
                <div className="h-5 bg-muted rounded w-3/4 mx-auto mb-2" />
                <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : vendors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vendors.map((vendor) => (
              <Link
                key={vendor.id}
                to={`/vendors/${vendor.id}`}
                className="group bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-all hover:shadow-lg text-center"
                data-testid={`vendor-${vendor.id}`}
              >
                <div className="w-24 h-24 rounded-full bg-muted overflow-hidden mx-auto mb-4">
                  <img
                    src={vendor.logo_url || 'https://images.unsplash.com/photo-1687422808565-929533931584?w=200'}
                    alt={vendor.store_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-heading font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                  {vendor.store_name}
                </h3>
                {(vendor.city || vendor.country) && (
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-2">
                    <MapPin className="h-4 w-4" />
                    {[vendor.city, vendor.country].filter(Boolean).join(', ')}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-2 flex items-center justify-center gap-1">
                  <Package className="h-4 w-4" />
                  {vendor.product_count} products
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No vendors available yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Single Vendor Page
const VendorPage = () => {
  const { vendorId } = useParams();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendorRes, productsRes] = await Promise.all([
          axios.get(`${API}/vendors/${vendorId}`),
          axios.get(`${API}/products?vendor_id=${vendorId}&limit=50`)
        ]);
        setVendor(vendorRes.data);
        setProducts(productsRes.data);
      } catch (error) {
        console.error('Failed to fetch vendor:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [vendorId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 animate-pulse">
        <div className="max-w-7xl mx-auto">
          <div className="h-64 bg-muted rounded-xl mb-8" />
          <div className="grid grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-72 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background py-16 px-4 text-center">
        <h1 className="font-heading text-2xl font-bold">Vendor not found</h1>
        <Button asChild className="mt-4 rounded-full">
          <Link to="/vendors">Back to Vendors</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <div className="relative h-64 md:h-80 bg-muted">
        {vendor.banner_url ? (
          <img
            src={vendor.banner_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20" />
        )}
        <div className="absolute inset-0 bg-foreground/40" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Vendor Info */}
        <div className="relative -mt-16 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-32 h-32 rounded-2xl bg-card border-4 border-background overflow-hidden shadow-lg">
              <img
                src={vendor.logo_url || 'https://images.unsplash.com/photo-1687422808565-929533931584?w=300'}
                alt={vendor.store_name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 pt-4">
              <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
                <Link to="/vendors">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  All Vendors
                </Link>
              </Button>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground" data-testid="vendor-name">
                {vendor.store_name}
              </h1>
              {(vendor.city || vendor.country) && (
                <p className="text-muted-foreground flex items-center gap-1 mt-2">
                  <MapPin className="h-4 w-4" />
                  {[vendor.city, vendor.country].filter(Boolean).join(', ')}
                </p>
              )}
              {vendor.description && (
                <p className="text-muted-foreground mt-4 max-w-2xl">
                  {vendor.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="py-8">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
            Products ({products.length})
          </h2>
          
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No products available yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { VendorsPage, VendorPage };
