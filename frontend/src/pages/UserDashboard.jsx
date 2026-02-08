import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Heart, Clock, User, Settings, Store, ChevronRight, Calendar, CheckCircle, Loader2, MapPin, Plus, Trash2, Edit2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const UserDashboard = () => {
  const { user, isAuthenticated, isVendor } = useAuth();
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingDelivery, setConfirmingDelivery] = useState(null);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: '',
    recipient_name: '',
    street_address: '',
    apartment: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    phone: '',
    is_default: false
  });
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, bookingsRes, addressesRes] = await Promise.all([
          axios.get(`${API}/orders`),
          axios.get(`${API}/bookings`),
          axios.get(`${API}/user/addresses`)
        ]);
        setOrders(ordersRes.data);
        setBookings(bookingsRes.data);
        setAddresses(addressesRes.data);
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

  // Address management functions
  const resetAddressForm = () => {
    setAddressForm({
      label: '',
      recipient_name: '',
      street_address: '',
      apartment: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      phone: '',
      is_default: false
    });
    setEditingAddress(null);
  };

  const handleOpenAddressDialog = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        label: address.label || '',
        recipient_name: address.recipient_name || '',
        street_address: address.street_address || '',
        apartment: address.apartment || '',
        city: address.city || '',
        state: address.state || '',
        postal_code: address.postal_code || '',
        country: address.country || '',
        phone: address.phone || '',
        is_default: address.is_default || false
      });
    } else {
      resetAddressForm();
    }
    setAddressDialogOpen(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      if (editingAddress) {
        await axios.put(`${API}/user/addresses/${editingAddress.id}`, addressForm);
        toast.success('Address updated successfully');
      } else {
        await axios.post(`${API}/user/addresses`, addressForm);
        toast.success('Address added successfully');
      }
      const response = await axios.get(`${API}/user/addresses`);
      setAddresses(response.data);
      setAddressDialogOpen(false);
      resetAddressForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await axios.delete(`${API}/user/addresses/${addressId}`);
      toast.success('Address deleted');
      setAddresses(addresses.filter(a => a.id !== addressId));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete address');
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      await axios.put(`${API}/user/addresses/${addressId}/default`);
      toast.success('Default address updated');
      const response = await axios.get(`${API}/user/addresses`);
      setAddresses(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to set default address');
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
          <TabsList className="bg-muted/50 rounded-full p-1 flex-wrap">
            <TabsTrigger value="orders" className="rounded-full" data-testid="tab-orders">
              <Package className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-full" data-testid="tab-bookings">
              <Calendar className="h-4 w-4 mr-2" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="addresses" className="rounded-full" data-testid="tab-addresses">
              <MapPin className="h-4 w-4 mr-2" />
              Addresses
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

          <TabsContent value="addresses">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold text-lg">Saved Addresses</h3>
                <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="rounded-full" 
                      onClick={() => handleOpenAddressDialog()}
                      data-testid="add-address-btn"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Address
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveAddress} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="label">Address Label</Label>
                        <Input
                          id="label"
                          placeholder="e.g., Home, Work, Mom's House"
                          value={addressForm.label}
                          onChange={(e) => setAddressForm({...addressForm, label: e.target.value})}
                          required
                          data-testid="address-label"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recipient_name">Recipient Name</Label>
                        <Input
                          id="recipient_name"
                          placeholder="Full name"
                          value={addressForm.recipient_name}
                          onChange={(e) => setAddressForm({...addressForm, recipient_name: e.target.value})}
                          required
                          data-testid="address-recipient"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="street_address">Street Address</Label>
                        <Input
                          id="street_address"
                          placeholder="123 Main Street"
                          value={addressForm.street_address}
                          onChange={(e) => setAddressForm({...addressForm, street_address: e.target.value})}
                          required
                          data-testid="address-street"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apartment">Apartment/Suite (optional)</Label>
                        <Input
                          id="apartment"
                          placeholder="Apt 4B"
                          value={addressForm.apartment}
                          onChange={(e) => setAddressForm({...addressForm, apartment: e.target.value})}
                          data-testid="address-apartment"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            placeholder="Lagos"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                            required
                            data-testid="address-city"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State/Province</Label>
                          <Input
                            id="state"
                            placeholder="Lagos"
                            value={addressForm.state}
                            onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                            required
                            data-testid="address-state"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="postal_code">Postal Code</Label>
                          <Input
                            id="postal_code"
                            placeholder="100001"
                            value={addressForm.postal_code}
                            onChange={(e) => setAddressForm({...addressForm, postal_code: e.target.value})}
                            required
                            data-testid="address-postal"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            placeholder="Nigeria"
                            value={addressForm.country}
                            onChange={(e) => setAddressForm({...addressForm, country: e.target.value})}
                            required
                            data-testid="address-country"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number (optional)</Label>
                        <Input
                          id="phone"
                          placeholder="+234 123 456 7890"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                          data-testid="address-phone"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full rounded-full" 
                        disabled={savingAddress}
                        data-testid="save-address-btn"
                      >
                        {savingAddress ? 'Saving...' : (editingAddress ? 'Update Address' : 'Save Address')}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {addresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((address) => (
                    <div 
                      key={address.id} 
                      className={`bg-card rounded-xl p-5 border ${address.is_default ? 'border-primary' : 'border-border'} relative`}
                      data-testid={`address-card-${address.id}`}
                    >
                      {address.is_default && (
                        <Badge className="absolute -top-2 -right-2 bg-primary">Default</Badge>
                      )}
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            {address.label}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">{address.recipient_name}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleOpenAddressDialog(address)}
                            data-testid={`edit-address-${address.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteAddress(address.id)}
                            data-testid={`delete-address-${address.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-muted-foreground">
                        <p>{address.street_address}</p>
                        {address.apartment && <p>{address.apartment}</p>}
                        <p>{address.city}, {address.state} {address.postal_code}</p>
                        <p>{address.country}</p>
                        {address.phone && <p className="mt-1">{address.phone}</p>}
                      </div>
                      {!address.is_default && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 rounded-full"
                          onClick={() => handleSetDefaultAddress(address.id)}
                          data-testid={`set-default-${address.id}`}
                        >
                          Set as Default
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-card rounded-xl border border-border">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="font-heading font-semibold text-lg mb-2">No saved addresses</h3>
                  <p className="text-muted-foreground mb-4">Add your shipping addresses for faster checkout</p>
                </div>
              )}
            </div>
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
