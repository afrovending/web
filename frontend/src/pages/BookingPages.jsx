import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, Loader2, CreditCard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BookingDetailPage = () => {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);

  // Check for payment return
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  useEffect(() => {
    if (sessionId && booking && booking.payment_status === 'pending') {
      checkPaymentStatus();
    }
  }, [sessionId, booking]);

  const fetchBooking = async () => {
    try {
      const response = await axios.get(`${API}/bookings/${bookingId}`);
      setBooking(response.data);
    } catch (error) {
      console.error('Failed to fetch booking:', error);
      toast.error('Booking not found');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const response = await axios.get(`${API}/bookings/${bookingId}/payment-status?session_id=${sessionId}`);
      if (response.data.payment_status === 'paid') {
        toast.success('Payment successful!');
        fetchBooking();
      }
    } catch (error) {
      console.error('Failed to check payment status:', error);
    }
  };

  const handlePayment = async () => {
    setProcessingPayment(true);
    try {
      const response = await axios.post(`${API}/bookings/${bookingId}/checkout`, {
        booking_id: bookingId,
        origin_url: window.location.origin
      });
      
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to initiate payment');
      setProcessingPayment(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!window.confirm('Are you sure the service was completed satisfactorily? This will release payment to the vendor.')) {
      return;
    }
    
    setConfirmingDelivery(true);
    try {
      await axios.put(`${API}/bookings/${bookingId}/confirm-delivery`);
      toast.success('Service delivery confirmed! Payment released to vendor.');
      fetchBooking();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to confirm delivery');
    } finally {
      setConfirmingDelivery(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }
    
    try {
      await axios.put(`${API}/bookings/${bookingId}/status`, { status: 'cancelled' });
      toast.success('Booking cancelled');
      fetchBooking();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to cancel booking');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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

  if (!isAuthenticated) {
    return navigate('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) return null;

  const isCustomer = booking.customer_id === user?.id;
  const canPay = isCustomer && booking.payment_status === 'pending' && booking.status !== 'cancelled';
  const canConfirmDelivery = isCustomer && booking.payment_status === 'paid' && !booking.delivery_confirmed && booking.status !== 'cancelled';
  const canCancel = isCustomer && booking.status === 'pending' && booking.payment_status === 'pending';

  return (
    <div className="min-h-screen bg-background py-8 md:py-12 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="text-muted-foreground hover:text-primary text-sm mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            Booking Details
          </h1>
          <p className="text-muted-foreground font-mono text-sm">#{booking.id.slice(0, 8)}</p>
        </div>

        {/* Status Banner */}
        {booking.delivery_confirmed && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">Service Completed</p>
              <p className="text-sm text-green-600">Payment has been released to the vendor.</p>
            </div>
          </div>
        )}

        {booking.status === 'cancelled' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <XCircle className="h-6 w-6 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">Booking Cancelled</p>
              <p className="text-sm text-red-600">This booking has been cancelled.</p>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-card rounded-xl border border-border overflow-hidden mb-6">
          {/* Service Info */}
          <div className="p-6 border-b border-border">
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={booking.service_image || 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=200'}
                  alt={booking.service_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <Link
                  to={`/services/${booking.service_id}`}
                  className="font-heading font-semibold text-lg hover:text-primary transition-colors"
                >
                  {booking.service_name}
                </Link>
                <p className="text-sm text-muted-foreground">by {booking.vendor_name}</p>
                <div className="flex gap-2 mt-2">
                  <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                  <Badge className={getPaymentStatusColor(booking.payment_status)}>
                    Payment: {booking.payment_status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(booking.booking_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{booking.booking_time} ({booking.duration_minutes} min)</p>
                </div>
              </div>
            </div>

            {booking.customer_address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Service Location</p>
                  <p className="font-medium">{booking.customer_address}</p>
                </div>
              </div>
            )}

            {booking.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm bg-muted p-3 rounded-lg">{booking.notes}</p>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="p-6 border-t border-border bg-muted/30">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total</span>
              <span className="font-heading text-2xl font-bold">${booking.price.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {canPay && (
            <Button
              className="w-full rounded-full h-12 text-lg"
              onClick={handlePayment}
              disabled={processingPayment}
              data-testid="pay-booking-btn"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay ${booking.price.toFixed(2)}
                </>
              )}
            </Button>
          )}

          {canConfirmDelivery && (
            <Button
              className="w-full rounded-full h-12 text-lg bg-green-600 hover:bg-green-700"
              onClick={handleConfirmDelivery}
              disabled={confirmingDelivery}
              data-testid="confirm-delivery-btn"
            >
              {confirmingDelivery ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Confirm Service Delivery
                </>
              )}
            </Button>
          )}

          {canCancel && (
            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={handleCancelBooking}
              data-testid="cancel-booking-btn"
            >
              Cancel Booking
            </Button>
          )}
        </div>

        {/* Info Box */}
        {booking.payment_status === 'paid' && !booking.delivery_confirmed && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-800 mb-1">Payment Held Securely</h4>
            <p className="text-sm text-blue-600">
              Your payment is being held securely. Once the service is completed and you confirm delivery, 
              the payment will be released to the vendor.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Booking Success Page
const BookingSuccessPage = () => {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (sessionId) {
      checkPaymentStatus();
    } else {
      setStatus('success');
    }
  }, [sessionId]);

  const checkPaymentStatus = async () => {
    try {
      const response = await axios.get(`${API}/bookings/${bookingId}/payment-status?session_id=${sessionId}`);
      if (response.data.payment_status === 'paid') {
        setStatus('success');
      } else {
        setStatus('pending');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-foreground mb-4">
          Booking Confirmed!
        </h1>
        <p className="text-muted-foreground mb-8">
          Your service has been booked and payment received. The vendor will be notified.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="rounded-full">
            <Link to={`/bookings/${bookingId}`}>View Booking</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/services">Browse Services</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export { BookingDetailPage, BookingSuccessPage };
