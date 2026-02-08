import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MapPin, Package, ArrowLeft, BadgeCheck, Star, Instagram, Facebook, Twitter, Youtube, Globe, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../contexts/AuthContext';
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
                <div className="relative w-24 h-24 rounded-full bg-muted overflow-hidden mx-auto mb-4">
                  <img
                    src={vendor.logo_url || 'https://images.unsplash.com/photo-1687422808565-929533931584?w=200'}
                    alt={vendor.store_name}
                    className="w-full h-full object-cover"
                  />
                  {vendor.is_verified_seller && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1.5 rounded-full" title="Verified Seller">
                      <BadgeCheck className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-1">
                  <h3 className="font-heading font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                    {vendor.store_name}
                  </h3>
                  {vendor.is_verified_seller && (
                    <BadgeCheck className="h-4 w-4 text-blue-500" />
                  )}
                </div>
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

// Single Vendor Page with Custom Storefront
const VendorPage = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [storefront, setStorefront] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendorRes, productsRes, storefrontRes] = await Promise.all([
          axios.get(`${API}/vendors/${vendorId}`),
          axios.get(`${API}/products?vendor_id=${vendorId}&limit=50`),
          axios.get(`${API}/vendors/${vendorId}/storefront`)
        ]);
        setVendor(vendorRes.data);
        setProducts(productsRes.data);
        setStorefront(storefrontRes.data);
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

  const theme = storefront?.theme || {};
  const socialLinks = storefront?.social_links || {};
  const featuredProducts = storefront?.featured_products || [];
  const primaryColor = theme.primary_color || '#dc2626';
  const accentColor = theme.accent_color || '#1a1a1a';

  // Generate layout class based on storefront settings
  const layoutClass = theme.layout_style === 'list' 
    ? 'grid-cols-1 md:grid-cols-2' 
    : theme.layout_style === 'masonry'
    ? 'columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  const hasSocialLinks = Object.values(socialLinks).some(v => v);

  return (
    <div className="min-h-screen bg-background">
      {/* Custom CSS Variables */}
      <style>{`
        .storefront-primary { color: ${primaryColor}; }
        .storefront-bg-primary { background-color: ${primaryColor}; }
        .storefront-border-primary { border-color: ${primaryColor}; }
        .storefront-accent { color: ${accentColor}; }
        .storefront-bg-accent { background-color: ${accentColor}; }
      `}</style>

      {/* Banner */}
      <div className="relative h-64 md:h-80 bg-muted overflow-hidden">
        {storefront?.banner_url ? (
          <img
            src={storefront.banner_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="absolute inset-0" 
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor}40 0%, ${accentColor}40 100%)` 
            }}
          />
        )}
        <div className="absolute inset-0 bg-foreground/30" />
        
        {/* Tagline Overlay */}
        {storefront?.tagline && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white text-2xl md:text-4xl font-heading font-bold text-center px-4 drop-shadow-lg">
              {storefront.tagline}
            </p>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Vendor Info Card */}
        <div className="relative -mt-16 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Logo */}
            <div 
              className="relative w-32 h-32 rounded-2xl bg-card border-4 overflow-hidden shadow-lg"
              style={{ borderColor: primaryColor }}
            >
              <img
                src={storefront?.logo_url || vendor.logo_url || 'https://images.unsplash.com/photo-1687422808565-929533931584?w=300'}
                alt={vendor.store_name}
                className="w-full h-full object-cover"
              />
              {vendor.is_verified_seller && (
                <div 
                  className="absolute -bottom-2 -right-2 text-white p-2 rounded-full shadow-lg" 
                  style={{ backgroundColor: '#3b82f6' }}
                  title="Verified Seller"
                >
                  <BadgeCheck className="h-5 w-5" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 pt-4">
              <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
                <Link to="/vendors">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  All Vendors
                </Link>
              </Button>
              
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground" data-testid="vendor-name">
                  {vendor.store_name}
                </h1>
                {vendor.is_verified_seller && (
                  <span 
                    className="inline-flex items-center gap-1.5 text-white text-sm font-medium px-3 py-1 rounded-full"
                    style={{ backgroundColor: '#3b82f6' }}
                    data-testid="vendor-verified-badge"
                  >
                    <BadgeCheck className="h-4 w-4" />
                    Verified Seller
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                {(vendor.city || vendor.country) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {[vendor.city, vendor.country].filter(Boolean).join(', ')}
                  </span>
                )}
                {storefront?.show_product_count !== false && (
                  <span className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {products.length} products
                  </span>
                )}
                {storefront?.show_member_since !== false && vendor.created_at && (
                  <span>
                    Member since {new Date(vendor.created_at).getFullYear()}
                  </span>
                )}
              </div>

              {/* Social Links */}
              {hasSocialLinks && (
                <div className="flex items-center gap-2 mt-4">
                  {socialLinks.instagram && (
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors">
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {socialLinks.facebook && (
                    <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors">
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors">
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                  {socialLinks.youtube && (
                    <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors">
                      <Youtube className="h-5 w-5" />
                    </a>
                  )}
                  {socialLinks.website && (
                    <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors">
                      <Globe className="h-5 w-5" />
                    </a>
                  )}
                </div>
              )}

              {/* Message Vendor Button */}
              {isAuthenticated && (
                <Button 
                  className="mt-4 rounded-full"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => navigate(`/messages?vendor=${vendorId}`)}
                  data-testid="message-vendor-btn"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message Vendor
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* About Section */}
        {storefront?.about_text && (
          <div className="bg-card rounded-xl p-6 border border-border mb-8">
            <h2 className="font-heading text-xl font-bold mb-3" style={{ color: primaryColor }}>
              About {vendor.store_name}
            </h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{storefront.about_text}</p>
          </div>
        )}

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <div className="py-8">
            <h2 className="font-heading text-2xl font-bold mb-6 flex items-center gap-2">
              <Star className="h-6 w-6" style={{ color: primaryColor }} />
              Featured Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* All Products */}
        <div className="py-8">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
            All Products ({products.length})
          </h2>
          
          {products.length > 0 ? (
            <div className={`grid gap-6 ${layoutClass}`}>
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
