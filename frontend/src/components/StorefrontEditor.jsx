import React, { useState, useEffect } from 'react';
import { 
  Palette, Image, Type, Link2, Eye, Grid3X3, List, LayoutGrid,
  Instagram, Facebook, Twitter, Youtube, Globe, Save, RefreshCw,
  ChevronUp, ChevronDown, Trash2, Plus, Check, BarChart3
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { ImageUpload } from './ui/image-upload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import StorefrontAnalytics from './StorefrontAnalytics';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const THEME_PRESETS = {
  classic: { name: "Classic Red", primary: "#dc2626", accent: "#1a1a1a" },
  ocean: { name: "Ocean Blue", primary: "#0891b2", accent: "#164e63" },
  forest: { name: "Forest Green", primary: "#16a34a", accent: "#14532d" },
  sunset: { name: "Sunset Orange", primary: "#ea580c", accent: "#7c2d12" },
  royal: { name: "Royal Purple", primary: "#7c3aed", accent: "#4c1d95" },
  midnight: { name: "Midnight", primary: "#6366f1", accent: "#312e81" },
};

const StorefrontEditor = ({ vendorId, products = [] }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storefront, setStorefront] = useState({
    banner_url: '',
    logo_url: '',
    tagline: '',
    about_text: '',
    theme: {
      primary_color: '#dc2626',
      accent_color: '#1a1a1a',
      background_style: 'light',
      layout_style: 'grid',
      preset: 'classic'
    },
    social_links: {
      instagram: '',
      facebook: '',
      twitter: '',
      tiktok: '',
      youtube: '',
      website: ''
    },
    featured_product_ids: [],
    show_reviews: true,
    show_product_count: true,
    show_member_since: true
  });

  useEffect(() => {
    fetchStorefront();
  }, [vendorId]);

  const fetchStorefront = async () => {
    try {
      const response = await axios.get(`${API}/vendors/${vendorId}/storefront`);
      setStorefront(prev => ({
        ...prev,
        ...response.data,
        theme: { ...prev.theme, ...response.data.theme },
        social_links: { ...prev.social_links, ...response.data.social_links }
      }));
    } catch (error) {
      console.error('Failed to fetch storefront:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/vendors/${vendorId}/storefront`, storefront);
      toast.success('Storefront saved successfully!');
    } catch (error) {
      toast.error('Failed to save storefront');
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = async (presetName) => {
    try {
      const response = await axios.post(
        `${API}/vendors/${vendorId}/storefront/apply-preset?preset_name=${presetName}`
      );
      setStorefront(prev => ({
        ...prev,
        theme: response.data.theme
      }));
      toast.success(`Applied ${THEME_PRESETS[presetName].name} theme`);
    } catch (error) {
      toast.error('Failed to apply theme');
    }
  };

  const updateFeaturedProducts = async (productIds) => {
    try {
      await axios.put(`${API}/vendors/${vendorId}/storefront/featured-products`, productIds);
      setStorefront(prev => ({ ...prev, featured_product_ids: productIds }));
      toast.success('Featured products updated');
    } catch (error) {
      toast.error('Failed to update featured products');
    }
  };

  const toggleFeaturedProduct = (productId) => {
    const current = storefront.featured_product_ids || [];
    let updated;
    
    if (current.includes(productId)) {
      updated = current.filter(id => id !== productId);
    } else {
      if (current.length >= 6) {
        toast.error('Maximum 6 featured products allowed');
        return;
      }
      updated = [...current, productId];
    }
    
    updateFeaturedProducts(updated);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-40 bg-muted rounded-xl" />
        <div className="h-10 bg-muted rounded w-1/3" />
        <div className="h-32 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold">Storefront Customization</h2>
          <p className="text-sm text-muted-foreground">Customize how your store appears to customers</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.open(`/vendors/${vendorId}`, '_blank')}
            data-testid="preview-storefront"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saving} data-testid="save-storefront">
            {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="bg-muted/50 rounded-full p-1">
          <TabsTrigger value="branding" className="rounded-full">
            <Image className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="theme" className="rounded-full">
            <Palette className="h-4 w-4 mr-2" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="content" className="rounded-full">
            <Type className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="featured" className="rounded-full">
            <Grid3X3 className="h-4 w-4 mr-2" />
            Featured
          </TabsTrigger>
          <TabsTrigger value="social" className="rounded-full">
            <Link2 className="h-4 w-4 mr-2" />
            Social
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-full">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="font-semibold mb-4">Store Banner</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Recommended size: 1920x400 pixels. This appears at the top of your store page.
            </p>
            <ImageUpload
              value={storefront.banner_url ? [storefront.banner_url] : []}
              onChange={(urls) => setStorefront(prev => ({ ...prev, banner_url: urls[0] || '' }))}
              maxFiles={1}
            />
          </div>

          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="font-semibold mb-4">Store Logo</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Recommended size: 200x200 pixels. Square format works best.
            </p>
            <ImageUpload
              value={storefront.logo_url ? [storefront.logo_url] : []}
              onChange={(urls) => setStorefront(prev => ({ ...prev, logo_url: urls[0] || '' }))}
              maxFiles={1}
            />
          </div>

          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="font-semibold mb-4">Tagline</h3>
            <Input
              placeholder="A short catchy phrase about your store..."
              value={storefront.tagline || ''}
              onChange={(e) => setStorefront(prev => ({ ...prev, tagline: e.target.value }))}
              maxLength={100}
              data-testid="storefront-tagline"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {(storefront.tagline || '').length}/100 characters
            </p>
          </div>
        </TabsContent>

        {/* Theme Tab */}
        <TabsContent value="theme" className="space-y-6">
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="font-semibold mb-4">Theme Presets</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className={`
                    p-4 rounded-xl border-2 transition-all text-left
                    ${storefront.theme?.preset === key 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                  data-testid={`theme-preset-${key}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-6 h-6 rounded-full" 
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div 
                      className="w-6 h-6 rounded-full" 
                      style={{ backgroundColor: preset.accent }}
                    />
                    {storefront.theme?.preset === key && (
                      <Check className="h-4 w-4 text-primary ml-auto" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="font-semibold mb-4">Custom Colors</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Primary Color</Label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="color"
                    value={storefront.theme?.primary_color || '#dc2626'}
                    onChange={(e) => setStorefront(prev => ({
                      ...prev,
                      theme: { ...prev.theme, primary_color: e.target.value, preset: null }
                    }))}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={storefront.theme?.primary_color || '#dc2626'}
                    onChange={(e) => setStorefront(prev => ({
                      ...prev,
                      theme: { ...prev.theme, primary_color: e.target.value, preset: null }
                    }))}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label>Accent Color</Label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="color"
                    value={storefront.theme?.accent_color || '#1a1a1a'}
                    onChange={(e) => setStorefront(prev => ({
                      ...prev,
                      theme: { ...prev.theme, accent_color: e.target.value, preset: null }
                    }))}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={storefront.theme?.accent_color || '#1a1a1a'}
                    onChange={(e) => setStorefront(prev => ({
                      ...prev,
                      theme: { ...prev.theme, accent_color: e.target.value, preset: null }
                    }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="font-semibold mb-4">Layout Style</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'grid', label: 'Grid', icon: Grid3X3 },
                { value: 'list', label: 'List', icon: List },
                { value: 'masonry', label: 'Masonry', icon: LayoutGrid }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setStorefront(prev => ({
                    ...prev,
                    theme: { ...prev.theme, layout_style: value }
                  }))}
                  className={`
                    p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                    ${storefront.theme?.layout_style === value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="font-semibold mb-4">About Your Store</h3>
            <Textarea
              placeholder="Tell customers about your store, your story, and what makes your products special..."
              value={storefront.about_text || ''}
              onChange={(e) => setStorefront(prev => ({ ...prev, about_text: e.target.value }))}
              rows={6}
              data-testid="storefront-about"
            />
          </div>

          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="font-semibold mb-4">Display Options</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Customer Reviews</Label>
                  <p className="text-sm text-muted-foreground">Display reviews on your store page</p>
                </div>
                <Switch
                  checked={storefront.show_reviews}
                  onCheckedChange={(checked) => setStorefront(prev => ({ ...prev, show_reviews: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Product Count</Label>
                  <p className="text-sm text-muted-foreground">Display total number of products</p>
                </div>
                <Switch
                  checked={storefront.show_product_count}
                  onCheckedChange={(checked) => setStorefront(prev => ({ ...prev, show_product_count: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Member Since</Label>
                  <p className="text-sm text-muted-foreground">Display when you joined Afrovending</p>
                </div>
                <Switch
                  checked={storefront.show_member_since}
                  onCheckedChange={(checked) => setStorefront(prev => ({ ...prev, show_member_since: checked }))}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Featured Products Tab */}
        <TabsContent value="featured" className="space-y-6">
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="font-semibold mb-2">Featured Products</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select up to 6 products to highlight on your storefront. These appear at the top of your store page.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((product) => {
                const isFeatured = (storefront.featured_product_ids || []).includes(product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => toggleFeaturedProduct(product.id)}
                    className={`
                      relative p-3 rounded-xl border-2 transition-all text-left
                      ${isFeatured 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                    data-testid={`feature-product-${product.id}`}
                  >
                    {isFeatured && (
                      <Badge className="absolute -top-2 -right-2 bg-primary">Featured</Badge>
                    )}
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                      <img
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1567696154083-9547fd0c8e1d?w=200'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h4 className="font-medium text-sm truncate">{product.name}</h4>
                    <p className="text-primary text-sm font-bold">${product.price?.toFixed(2)}</p>
                  </button>
                );
              })}
            </div>

            {products.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No products yet. Add products to feature them on your storefront.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Social Links Tab */}
        <TabsContent value="social" className="space-y-6">
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="font-semibold mb-4">Social Media Links</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your social media profiles to help customers connect with you.
            </p>
            
            <div className="space-y-4">
              {[
                { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/yourhandle' },
                { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/yourpage' },
                { key: 'twitter', label: 'Twitter/X', icon: Twitter, placeholder: 'https://twitter.com/yourhandle' },
                { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/yourchannel' },
                { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://yourwebsite.com' }
              ].map(({ key, label, icon: Icon, placeholder }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <Label className="sr-only">{label}</Label>
                    <Input
                      placeholder={placeholder}
                      value={storefront.social_links?.[key] || ''}
                      onChange={(e) => setStorefront(prev => ({
                        ...prev,
                        social_links: { ...prev.social_links, [key]: e.target.value }
                      }))}
                      data-testid={`social-${key}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StorefrontEditor;
