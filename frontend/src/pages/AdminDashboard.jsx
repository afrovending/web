import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Users, Store, Package, DollarSign, ShoppingBag, Clock, Check, X, Tag } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';
import CouponManagement from '../components/admin/CouponManagement';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usersRes, vendorsRes, ordersRes] = await Promise.all([
          axios.get(`${API}/admin/stats`),
          axios.get(`${API}/admin/users`),
          axios.get(`${API}/vendors`),
          axios.get(`${API}/admin/orders`)
        ]);
        
        setStats(statsRes.data);
        setUsers(usersRes.data);
        setVendors(vendorsRes.data);
        setOrders(ordersRes.data);
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
        toast.error('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated && isAdmin) {
      fetchData();
    }
  }, [isAuthenticated, isAdmin]);

  const handleApproveVendor = async (vendorId) => {
    try {
      await axios.put(`${API}/vendors/${vendorId}/approve`);
      setVendors(vendors.map(v => v.id === vendorId ? { ...v, is_approved: true } : v));
      toast.success('Vendor approved');
    } catch (error) {
      toast.error('Failed to approve vendor');
    }
  };

  const handleUpdateUserRole = async (userId, role) => {
    try {
      await axios.put(`${API}/admin/users/${userId}/role?role=${role}`);
      setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
      toast.success('User role updated');
    } catch (error) {
      toast.error('Failed to update user role');
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

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-6xl mx-auto animate-pulse space-y-6">
          <div className="h-10 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 md:py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Manage your marketplace</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-card rounded-xl p-5 border border-border">
            <Users className="h-6 w-6 text-primary mb-2" />
            <p className="text-2xl font-bold font-accent">{stats?.total_users || 0}</p>
            <p className="text-sm text-muted-foreground">Users</p>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border">
            <Store className="h-6 w-6 text-secondary mb-2" />
            <p className="text-2xl font-bold font-accent">{stats?.total_vendors || 0}</p>
            <p className="text-sm text-muted-foreground">Vendors</p>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border">
            <Package className="h-6 w-6 text-accent mb-2" />
            <p className="text-2xl font-bold font-accent">{stats?.total_products || 0}</p>
            <p className="text-sm text-muted-foreground">Products</p>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border">
            <ShoppingBag className="h-6 w-6 text-primary mb-2" />
            <p className="text-2xl font-bold font-accent">{stats?.total_orders || 0}</p>
            <p className="text-sm text-muted-foreground">Orders</p>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border">
            <Clock className="h-6 w-6 text-accent mb-2" />
            <p className="text-2xl font-bold font-accent">{stats?.pending_vendors || 0}</p>
            <p className="text-sm text-muted-foreground">Pending Vendors</p>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border">
            <DollarSign className="h-6 w-6 text-secondary mb-2" />
            <p className="text-2xl font-bold font-accent">${(stats?.total_revenue || 0).toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Revenue</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="vendors" className="space-y-6">
          <TabsList className="bg-muted/50 rounded-full p-1">
            <TabsTrigger value="vendors" className="rounded-full" data-testid="admin-tab-vendors">
              Vendors
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-full" data-testid="admin-tab-users">
              Users
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-full" data-testid="admin-tab-orders">
              Orders
            </TabsTrigger>
            <TabsTrigger value="coupons" className="rounded-full" data-testid="admin-tab-coupons">
              <Tag className="h-4 w-4 mr-1" />
              Coupons
            </TabsTrigger>
          </TabsList>

          {/* Vendors Tab */}
          <TabsContent value="vendors">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-6 py-4 font-medium">Store</th>
                      <th className="text-left px-6 py-4 font-medium">Location</th>
                      <th className="text-left px-6 py-4 font-medium">Products</th>
                      <th className="text-left px-6 py-4 font-medium">Status</th>
                      <th className="text-left px-6 py-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {vendors.map((vendor) => (
                      <tr key={vendor.id} data-testid={`admin-vendor-${vendor.id}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
                              {vendor.logo_url ? (
                                <img src={vendor.logo_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                  <Store className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <span className="font-medium">{vendor.store_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {vendor.city}, {vendor.country}
                        </td>
                        <td className="px-6 py-4">{vendor.product_count}</td>
                        <td className="px-6 py-4">
                          <Badge className={vendor.is_approved ? 'bg-secondary/20 text-secondary' : 'bg-accent/20 text-accent-foreground'}>
                            {vendor.is_approved ? 'Approved' : 'Pending'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {!vendor.is_approved && (
                            <Button
                              size="sm"
                              onClick={() => handleApproveVendor(vendor.id)}
                              data-testid={`approve-vendor-${vendor.id}`}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-6 py-4 font-medium">User</th>
                      <th className="text-left px-6 py-4 font-medium">Email</th>
                      <th className="text-left px-6 py-4 font-medium">Role</th>
                      <th className="text-left px-6 py-4 font-medium">Joined</th>
                      <th className="text-left px-6 py-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((user) => (
                      <tr key={user.id} data-testid={`admin-user-${user.id}`}>
                        <td className="px-6 py-4 font-medium">
                          {user.first_name} {user.last_name}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                        <td className="px-6 py-4">
                          <Badge>{user.role}</Badge>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <Select
                            value={user.role}
                            onValueChange={(v) => handleUpdateUserRole(user.id, v)}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="customer">Customer</SelectItem>
                              <SelectItem value="vendor">Vendor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-6 py-4 font-medium">Order ID</th>
                      <th className="text-left px-6 py-4 font-medium">Items</th>
                      <th className="text-left px-6 py-4 font-medium">Total</th>
                      <th className="text-left px-6 py-4 font-medium">Payment</th>
                      <th className="text-left px-6 py-4 font-medium">Status</th>
                      <th className="text-left px-6 py-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.map((order) => (
                      <tr key={order.id} data-testid={`admin-order-${order.id}`}>
                        <td className="px-6 py-4 font-mono text-sm">#{order.id.slice(0, 8)}</td>
                        <td className="px-6 py-4">{order.items.length} items</td>
                        <td className="px-6 py-4 font-accent font-semibold">
                          ${order.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline">{order.payment_status}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Select
                            value={order.status}
                            onValueChange={(v) => handleUpdateOrderStatus(order.id, v)}
                          >
                            <SelectTrigger className="w-[130px]">
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
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
