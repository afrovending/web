import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, Clock, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import ProductCard from '../components/ProductCard';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes, vendorsRes] = await Promise.all([
          axios.get(`${API}/products/featured?limit=8`),
          axios.get(`${API}/categories`),
          axios.get(`${API}/vendors/featured?limit=4`)
        ]);
        setFeaturedProducts(productsRes.data);
        setCategories(categoriesRes.data);
        setVendors(vendorsRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1734255026082-82fdc81991f0?w=1920"
            alt="African market"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-32">
          <div className="max-w-2xl">
            <span className="inline-block bg-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              Africa's Global Marketplace
            </span>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-background leading-tight mb-6">
              Discover Authentic African Treasures
            </h1>
            <p className="text-background/80 text-lg md:text-xl leading-relaxed mb-8">
              Connect with African artisans and vendors. Shop unique handcrafted products from across the continent, delivered to your doorstep.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="rounded-full px-8 py-6 text-lg font-semibold bg-primary hover:bg-primary/90"
                data-testid="hero-shop-btn"
              >
                <Link to="/products">
                  Start Shopping
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full px-8 py-6 text-lg font-semibold border-2 border-background text-background hover:bg-background/10"
                data-testid="hero-vendor-btn"
              >
                <Link to="/register?vendor=true">Become a Vendor</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: Truck, title: 'Global Shipping', desc: 'Worldwide delivery' },
              { icon: Shield, title: 'Secure Payment', desc: 'Stripe & PayPal' },
              { icon: Clock, title: 'Fast Processing', desc: '24-48h handling' },
              { icon: Users, title: 'Verified Vendors', desc: 'Trusted sellers' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
                Shop by Category
              </h2>
              <p className="text-muted-foreground">Explore our diverse collection</p>
            </div>
            <Link to="/products" className="text-primary font-medium hover:underline hidden sm:flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="group relative aspect-square rounded-xl overflow-hidden"
                data-testid={`category-${category.id}`}
              >
                <img
                  src={category.image_url || 'https://images.unsplash.com/photo-1567696154083-9547fd0c8e1d?w=400'}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="font-heading font-semibold text-background text-lg">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
                Featured Products
              </h2>
              <p className="text-muted-foreground">Handpicked items from our best vendors</p>
            </div>
            <Link to="/products" className="text-primary font-medium hover:underline hidden sm:flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
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
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No products available yet</p>
              <Button asChild className="rounded-full">
                <Link to="/register?vendor=true">Become a vendor and add products</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Featured Vendors */}
      {vendors.length > 0 && (
        <section className="py-16 md:py-24 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">
                  Top Vendors
                </h2>
                <p className="text-muted-foreground">Meet our trusted African artisans</p>
              </div>
              <Link to="/vendors" className="text-primary font-medium hover:underline hidden sm:flex items-center gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {vendors.map((vendor) => (
                <Link
                  key={vendor.id}
                  to={`/vendors/${vendor.id}`}
                  className="group bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-all hover:shadow-lg"
                  data-testid={`vendor-card-${vendor.id}`}
                >
                  <div className="w-20 h-20 rounded-full bg-muted overflow-hidden mx-auto mb-4">
                    <img
                      src={vendor.logo_url || 'https://images.unsplash.com/photo-1687422808565-929533931584?w=200'}
                      alt={vendor.store_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground text-center group-hover:text-primary transition-colors">
                    {vendor.store_name}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mt-1">
                    {vendor.country || 'Africa'}
                  </p>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {vendor.product_count} products
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 md:px-8 bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Start Selling Your African Products Today
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of African artisans and vendors reaching global customers. 
            Set up your store in minutes and start earning.
          </p>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="rounded-full px-8 py-6 text-lg font-semibold bg-background text-foreground hover:bg-background/90"
            data-testid="cta-vendor-btn"
          >
            <Link to="/register?vendor=true">
              Become a Vendor
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
