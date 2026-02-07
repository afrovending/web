import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Heart, Clock, User, Settings, Store, ChevronRight, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const UserDashboard = () => {
  const { user, isAuthenticated, isVendor } = useAuth();
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingDelivery, setConfirmingDelivery] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, bookingsRes] = await Promise.all([
          axios.get(`${API}/orders`),
          axios.get(`${API}/bookings`)
        ]);
        setOrders(ordersRes.data);
        setBookings(bookingsRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const handleConfirmDelivery = async (bookingId) => {
    if (!window.confirm('Are you sure the service was completed satisfactorily? This will release payment to the vendor.')) {
      return;
    }
    
    setConfirmingDelivery(bookingId);
    try {
      await axios.put(`${API}/bookings/${bookingId}/confirm-delivery`);
      toast.success('Service delivery confirmed! Payment released to vendor.');
      // Refresh bookings
      const response = await axios.get(`${API}/bookings`);
      setBookings(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to confirm delivery');
    } finally {
      setConfirmingDelivery(null);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-accent/20 text-accent-foreground',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-secondary/20 text-secondary',
      cancelled: 'bg-destructive/20 text-destructive',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-blue-100 text-blue-800',
      released: 'bg-green-100 text-green-800',
      refunded: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-background py-8 md:py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                Welcome, {user?.first_name}!
              </h1>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            {isVendor && (
              <Button asChild variant="outline" className="rounded-full" data-testid="go-to-vendor-dash">
                <Link to="/vendor/dashboard">
                  <Store className="h-4 w-4 mr-2" />
                  Vendor Dashboard
                </Link>
              </Button>
            )}
            {!isVendor && (
              <Button asChild className="rounded-full" data-testid="become-vendor-btn">
                <Link to="/vendor/setup">
                  <Store className="h-4 w-4 mr-2" />
                  Become a Vendor
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { icon: Package, label: 'Total Orders', value: orders.length },
            { icon: Calendar, label: 'Bookings', value: bookings.length },
            { icon: Clock, label: 'Pending', value: orders.filter(o => o.status === 'pending').length + bookings.filter(b => b.status === 'pending').length },
            { icon: Package, label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length + bookings.filter(b => b.delivery_confirmed).length },
          ].map((stat, i) => (
            <div key={i} className="bg-card rounded-xl p-5 border border-border">
              <stat.icon className="h-6 w-6 text-primary mb-2" />
              <p className="text-2xl font-bold font-accent">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
          <Link 
            to="/wishlist"
            className="bg-card rounded-xl p-5 border border-border hover:border-primary/30 transition-colors"
            data-testid="dash-wishlist-link"
          >
            <Heart className="h-6 w-6 text-primary mb-2" />
            <p className="text-2xl font-bold font-accent">View</p>
            <p className="text-sm text-muted-foreground">Wishlist</p>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="bg-muted/50 rounded-full p-1">
            <TabsTrigger value="orders" className="rounded-full" data-testid="tab-orders">
              <Package className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-full" data-testid="tab-bookings">
              <Calendar className="h-4 w-4 mr-2" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-full" data-testid="tab-profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-card rounded-xl p-6 animate-pulse">
                    <div className="flex gap-4">
                      <div className="h-6 bg-muted rounded w-32" />
                      <div className="h-6 bg-muted rounded w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-card rounded-xl p-6 border border-border"
                    data-testid={`order-${order.id}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm text-muted-foreground">
                            #{order.id.slice(0, 8)}
                          </span>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <Badge variant="outline">
                            {order.payment_status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-sm mt-1">
                          {order.items.length} item(s)
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="font-accent font-bold text-xl">
                          ${order.total.toFixed(2)}
                        </span>
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/orders/${order.id}`}>
                            <ChevronRight className="h-5 w-5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Order items preview */}
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                      {order.items.slice(0, 4).map((item, idx) => (
                        <div
                          key={idx}
                          className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center text-xs text-muted-foreground"
                        >
                          {item.quantity}x
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center text-sm font-medium">
                          +{order.items.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="font-heading font-semibold text-lg mb-2">No orders yet</h3>
                <p className="text-muted-foreground mb-4">Start shopping to see your orders here</p>
                <Button asChild className="rounded-full">
                  <Link to="/products">Browse Products</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookings">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-card rounded-xl p-6 animate-pulse">
                    <div className="flex gap-4">
                      <div className="h-20 w-20 bg-muted rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-muted rounded w-1/3" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const canConfirmDelivery = booking.payment_status === 'paid' && !booking.delivery_confirmed && booking.status !== 'cancelled';
                  
                  return (
                    <div
                      key={booking.id}
                      className="bg-card rounded-xl p-6 border border-border"
                      data-testid={`booking-${booking.id}`}
                    >
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Service Image */}
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={booking.service_image || 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=200'}
                            alt={booking.service_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Booking Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <Link 
                                to={`/bookings/${booking.id}`}
                                className="font-heading font-semibold text-lg hover:text-primary transition-colors"
                              >
                                {booking.service_name}
                              </Link>
                              <p className="text-sm text-muted-foreground">by {booking.vendor_name}</p>
                            </div>
                            <span className="font-accent font-bold text-xl">
                              ${booking.price.toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                            <Badge className={getPaymentStatusColor(booking.payment_status)}>
                              {booking.payment_status}
                            </Badge>
                            {booking.delivery_confirmed && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Delivered
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(booking.booking_date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {booking.booking_time} ({booking.duration_minutes} min)
                            </span>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-3 mt-4">
                            {canConfirmDelivery && (
                              <Button
                                size="sm"
                                className="rounded-full bg-green-600 hover:bg-green-700"
                                onClick={() => handleConfirmDelivery(booking.id)}
                                disabled={confirmingDelivery === booking.id}
                                data-testid={`confirm-delivery-${booking.id}`}
                              >
                                {confirmingDelivery === booking.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    Confirming...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Confirm Delivery
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full"
                              asChild
                            >
                              <Link to={`/bookings/${booking.id}`}>
                                View Details
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Escrow Info Box */}
                      {booking.payment_status === 'paid' && !booking.delivery_confirmed && (
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-700">
                            <strong>Payment held securely.</strong> Click "Confirm Delivery" after the service is completed to release payment to the vendor.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="font-heading font-semibold text-lg mb-2">No bookings yet</h3>
                <p className="text-muted-foreground mb-4">Book services from African providers</p>
                <Button asChild className="rounded-full">
                  <Link to="/services">Browse Services</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile">
            <div className="bg-card rounded-xl p-6 border border-border">
              <h3 className="font-heading font-semibold text-lg mb-6">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-muted-foreground">First Name</label>
                  <p className="font-medium">{user?.first_name}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Last Name</label>
                  <p className="font-medium">{user?.last_name}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Account Type</label>
                  <p className="font-medium capitalize">{user?.role}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserDashboard;
