import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Package, Calendar, Clock, MapPin, CheckCircle, Circle, ChevronRight, ArrowLeft, Loader2, CreditCard, Truck } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Tracking List Page
const TrackingPage = () => {
  const { isAuthenticated } = useAuth();
  const [trackingItems, setTrackingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const response = await axios.get(`${API}/tracking`);
        setTrackingItems(response.data);
      } catch (error) {
        console.error('Failed to fetch tracking:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchTracking();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const filteredItems = filter === 'all' 
    ? trackingItems 
    : trackingItems.filter(item => item.type === filter);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      shipped: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-background py-8 md:py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
            Track Orders & Bookings
          </h1>
          <p className="text-muted-foreground">
            View the status of all your orders and service bookings
          </p>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList className="bg-muted/50 rounded-full p-1">
            <TabsTrigger value="all" className="rounded-full" data-testid="filter-all">
              All ({trackingItems.length})
            </TabsTrigger>
            <TabsTrigger value="order" className="rounded-full" data-testid="filter-orders">
              <Package className="h-4 w-4 mr-2" />
              Orders ({trackingItems.filter(i => i.type === 'order').length})
            </TabsTrigger>
            <TabsTrigger value="booking" className="rounded-full" data-testid="filter-bookings">
              <Calendar className="h-4 w-4 mr-2" />
              Bookings ({trackingItems.filter(i => i.type === 'booking').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tracking List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                to={`/tracking/${item.type}/${item.id}`}
                className="block bg-card rounded-xl border border-border hover:border-primary/30 transition-all p-6"
                data-testid={`tracking-item-${item.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {item.type === 'order' ? (
                        <Package className="h-5 w-5 text-primary" />
                      ) : (
                        <Calendar className="h-5 w-5 text-primary" />
                      )}
                      <span className="font-mono text-sm text-muted-foreground">
                        #{item.id.slice(0, 8)}
                      </span>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                      {item.type === 'booking' && item.delivery_confirmed && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Delivered
                        </Badge>
                      )}
                    </div>

                    {item.type === 'booking' && (
                      <div className="mb-2">
                        <p className="font-semibold">{item.service_name}</p>
                        <p className="text-sm text-muted-foreground">by {item.vendor_name}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {new Date(item.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      {item.type === 'booking' && item.booking_date && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {item.booking_date} at {item.booking_time}
                        </span>
                      )}
                      {item.type === 'order' && (
                        <span>{item.items_count} item(s)</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-heading font-bold text-lg">${item.total.toFixed(2)}</p>
                    <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto mt-2" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-heading font-semibold text-lg mb-2">No items to track</h3>
            <p className="text-muted-foreground mb-6">
              {filter === 'order' 
                ? "You haven't placed any orders yet." 
                : filter === 'booking' 
                ? "You haven't made any service bookings yet."
                : "Start shopping or book a service to track your orders."}
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild className="rounded-full">
                <Link to="/products">Browse Products</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/services">Browse Services</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Tracking Detail Page
const TrackingDetailPage = () => {
  const { itemType, itemId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await axios.get(`${API}/tracking/${itemType}/${itemId}`);
        setItem(response.data);
      } catch (error) {
        console.error('Failed to fetch tracking detail:', error);
        navigate('/tracking');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchDetail();
    }
  }, [itemType, itemId, isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) return null;

  const getStatusIcon = (completed) => {
    return completed ? (
      <CheckCircle className="h-6 w-6 text-green-600" />
    ) : (
      <Circle className="h-6 w-6 text-muted-foreground/30" />
    );
  };

  return (
    <div className="min-h-screen bg-background py-8 md:py-12 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/tracking')}
          data-testid="back-to-tracking"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tracking
        </Button>

        {/* Header Card */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {item.type === 'order' ? (
                  <Package className="h-6 w-6 text-primary" />
                ) : (
                  <Calendar className="h-6 w-6 text-primary" />
                )}
                <span className="text-sm text-muted-foreground">
                  {item.type === 'order' ? 'Order' : 'Booking'} #{item.id.slice(0, 8)}
                </span>
              </div>

              {item.type === 'booking' && (
                <>
                  <h1 className="font-heading text-2xl font-bold mb-1">{item.service_name}</h1>
                  <p className="text-muted-foreground">by {item.vendor_name}</p>
                </>
              )}

              {item.type === 'order' && (
                <h1 className="font-heading text-2xl font-bold">
                  {item.items?.length || 0} Item(s)
                </h1>
              )}
            </div>

            <div className="text-right">
              <p className="font-heading text-3xl font-bold text-primary">
                ${(item.total || item.price || 0).toFixed(2)}
              </p>
              <Badge className="mt-2">
                {item.payment_status}
              </Badge>
            </div>
          </div>

          {/* Booking Details */}
          {item.type === 'booking' && (
            <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{item.booking_date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{item.booking_time} ({item.duration_minutes} min)</p>
                </div>
              </div>
              {item.customer_address && (
                <div className="col-span-2 flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Service Location</p>
                    <p className="font-medium">{item.customer_address}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Order Items */}
          {item.type === 'order' && item.items && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="font-semibold mb-4">Order Items</h3>
              <div className="space-y-3">
                {item.items.map((orderItem, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{orderItem.name || `Item ${idx + 1}`}</p>
                      <p className="text-sm text-muted-foreground">Qty: {orderItem.quantity}</p>
                    </div>
                    <p className="font-semibold">${(orderItem.price * orderItem.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-heading text-lg font-semibold mb-6">Tracking Timeline</h2>
          
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
            
            {/* Timeline Items */}
            <div className="space-y-6">
              {item.timeline?.map((step, idx) => (
                <div key={idx} className="relative flex gap-4 items-start">
                  <div className="relative z-10 bg-background">
                    {getStatusIcon(step.completed)}
                  </div>
                  <div className={`flex-1 pb-6 ${idx === item.timeline.length - 1 ? '' : 'border-b border-border'}`}>
                    <h4 className={`font-semibold ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.title}
                    </h4>
                    {step.timestamp && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(step.timestamp).toLocaleString()}
                      </p>
                    )}
                    {!step.completed && (
                      <p className="text-sm text-muted-foreground mt-1">Pending</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          {item.type === 'booking' && (
            <Button asChild className="flex-1 rounded-full">
              <Link to={`/bookings/${item.id}`}>View Booking Details</Link>
            </Button>
          )}
          <Button variant="outline" className="rounded-full" asChild>
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export { TrackingPage, TrackingDetailPage };
