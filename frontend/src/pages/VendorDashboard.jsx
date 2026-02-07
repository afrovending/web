import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Package, DollarSign, TrendingUp, Plus, Edit, Trash2, Eye, Store, Calendar, Clock, Briefcase } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const VendorDashboard = () => {
  const { user, isAuthenticated, isVendor } = useAuth();
  const navigate = useNavigate();
  
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Product form
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    compare_price: '',
    category_id: '',
    stock: '',
    images: '',
    tags: ''
  });
  
  // Service form
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: '',
    price_type: 'fixed',
    duration_minutes: '60',
    location_type: 'both',
    location_address: '',
    category_id: '',
    images: '',
    tags: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch vendor profile
        const vendorsRes = await axios.get(`${API}/vendors`);
        const myVendor = vendorsRes.data.find(v => v.user_id === user?.id);
        
        if (myVendor) {
          setVendor(myVendor);
          
          // Fetch vendor's products
          const productsRes = await axios.get(`${API}/products?vendor_id=${myVendor.id}&limit=100`);
          setProducts(productsRes.data);
          
          // Fetch vendor's orders
          const ordersRes = await axios.get(`${API}/vendor/orders`);
          setOrders(ordersRes.data);
        }
        
        // Fetch categories
        const categoriesRes = await axios.get(`${API}/categories`);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated && isVendor) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, isVendor, user?.id]);

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    const productData = {
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price),
      compare_price: productForm.compare_price ? parseFloat(productForm.compare_price) : null,
      category_id: productForm.category_id,
      stock: parseInt(productForm.stock) || 0,
      images: productForm.images.split(',').map(s => s.trim()).filter(Boolean),
      tags: productForm.tags.split(',').map(s => s.trim()).filter(Boolean)
    };
    
    try {
      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, productData);
        toast.success('Product updated!');
      } else {
        await axios.post(`${API}/products`, productData);
        toast.success('Product created!');
      }
      
      // Refresh products
      const productsRes = await axios.get(`${API}/products?vendor_id=${vendor.id}&limit=100`);
      setProducts(productsRes.data);
      
      setProductDialogOpen(false);
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: '',
        compare_price: '',
        category_id: '',
        stock: '',
        images: '',
        tags: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save product');
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      compare_price: product.compare_price?.toString() || '',
      category_id: product.category_id,
      stock: product.stock.toString(),
      images: product.images?.join(', ') || '',
      tags: product.tags?.join(', ') || ''
    });
    setProductDialogOpen(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await axios.delete(`${API}/products/${productId}`);
      setProducts(products.filter(p => p.id !== productId));
      toast.success('Product deleted');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status?status=${status}`);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
      toast.success('Order status updated');
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isVendor && !loading) {
    return <Navigate to="/vendor/setup" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-6xl mx-auto animate-pulse space-y-6">
          <div className="h-10 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background py-16 px-4">
        <div className="max-w-md mx-auto text-center">
          <Store className="h-16 w-16 mx-auto text-muted-foreground/30 mb-6" />
          <h1 className="font-heading text-2xl font-bold mb-4">Vendor Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">Please set up your vendor profile first.</p>
          <Button asChild className="rounded-full">
            <Link to="/vendor/setup">Set Up Vendor Profile</Link>
          </Button>
        </div>
      </div>
    );
  }

  const totalRevenue = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="min-h-screen bg-background py-8 md:py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
              {vendor.store_name}
            </h1>
            <p className="text-muted-foreground">Vendor Dashboard</p>
            {!vendor.is_approved && (
              <Badge className="mt-2 bg-accent/20 text-accent-foreground">
                Pending Approval
              </Badge>
            )}
          </div>
          
          <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="rounded-full"
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({
                    name: '',
                    description: '',
                    price: '',
                    compare_price: '',
                    category_id: '',
                    stock: '',
                    images: '',
                    tags: ''
                  });
                }}
                data-testid="add-product-btn"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleProductSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Product Name</Label>
                    <Input
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      required
                      data-testid="product-name-input"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      rows={3}
                      required
                      data-testid="product-description-input"
                    />
                  </div>
                  <div>
                    <Label>Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      required
                      data-testid="product-price-input"
                    />
                  </div>
                  <div>
                    <Label>Compare Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={productForm.compare_price}
                      onChange={(e) => setProductForm({ ...productForm, compare_price: e.target.value })}
                      data-testid="product-compare-price-input"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={productForm.category_id}
                      onValueChange={(v) => setProductForm({ ...productForm, category_id: v })}
                    >
                      <SelectTrigger data-testid="product-category-select">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Stock</Label>
                    <Input
                      type="number"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      data-testid="product-stock-input"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Image URLs (comma-separated)</Label>
                    <Input
                      value={productForm.images}
                      onChange={(e) => setProductForm({ ...productForm, images: e.target.value })}
                      placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                      data-testid="product-images-input"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Tags (comma-separated)</Label>
                    <Input
                      value={productForm.tags}
                      onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
                      placeholder="handmade, african, traditional"
                      data-testid="product-tags-input"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" data-testid="product-submit-btn">
                    {editingProduct ? 'Update' : 'Create'} Product
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-xl p-5 border border-border">
            <Package className="h-6 w-6 text-primary mb-2" />
            <p className="text-2xl font-bold font-accent">{products.length}</p>
            <p className="text-sm text-muted-foreground">Products</p>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border">
            <DollarSign className="h-6 w-6 text-secondary mb-2" />
            <p className="text-2xl font-bold font-accent">${totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Revenue</p>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border">
            <TrendingUp className="h-6 w-6 text-accent mb-2" />
            <p className="text-2xl font-bold font-accent">{orders.length}</p>
            <p className="text-sm text-muted-foreground">Orders</p>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border">
            <Package className="h-6 w-6 text-primary mb-2" />
            <p className="text-2xl font-bold font-accent">
              {orders.filter(o => o.status === 'pending').length}
            </p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-muted/50 rounded-full p-1">
            <TabsTrigger value="products" className="rounded-full" data-testid="vendor-tab-products">
              Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-full" data-testid="vendor-tab-orders">
              Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-card rounded-xl border border-border overflow-hidden"
                    data-testid={`vendor-product-${product.id}`}
                  >
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1567696154083-9547fd0c8e1d?w=400'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-heading font-semibold line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Stock: {product.stock} | ${product.price.toFixed(2)}
                      </p>
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                          data-testid={`edit-product-${product.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link to={`/products/${product.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteProduct(product.id)}
                          data-testid={`delete-product-${product.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="font-heading font-semibold text-lg mb-2">No products yet</h3>
                <p className="text-muted-foreground mb-4">Start adding products to your store</p>
                <Button onClick={() => setProductDialogOpen(true)} className="rounded-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders">
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-card rounded-xl p-6 border border-border"
                    data-testid={`vendor-order-${order.id}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm">#{order.id.slice(0, 8)}</span>
                          <Badge>{order.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm mt-1">{order.items.length} item(s)</p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Select
                          value={order.status}
                          onValueChange={(v) => handleUpdateOrderStatus(order.id, v)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="font-accent font-bold text-xl">
                          ${order.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="font-heading font-semibold text-lg mb-2">No orders yet</h3>
                <p className="text-muted-foreground">Orders will appear here when customers purchase your products</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Vendor Setup Page
const VendorSetupPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    store_name: '',
    description: '',
    country: '',
    city: '',
    logo_url: '',
    banner_url: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${API}/vendors`, formData);
      toast.success('Vendor profile created! Pending approval.');
      navigate('/vendor/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create vendor profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <Store className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
            Become a Vendor
          </h1>
          <p className="text-muted-foreground">
            Set up your store and start selling African products globally
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-xl border border-border">
          <div>
            <Label>Store Name *</Label>
            <Input
              value={formData.store_name}
              onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
              placeholder="My African Store"
              required
              data-testid="vendor-store-name"
            />
          </div>
          
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell customers about your store and products..."
              rows={4}
              data-testid="vendor-description"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Country</Label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Nigeria"
                data-testid="vendor-country"
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Lagos"
                data-testid="vendor-city"
              />
            </div>
          </div>
          
          <div>
            <Label>Logo URL</Label>
            <Input
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://example.com/logo.jpg"
              data-testid="vendor-logo"
            />
          </div>
          
          <Button
            type="submit"
            className="w-full rounded-full h-12 text-lg"
            disabled={loading}
            data-testid="vendor-submit"
          >
            {loading ? 'Creating...' : 'Create Vendor Profile'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export { VendorDashboard, VendorSetupPage };
