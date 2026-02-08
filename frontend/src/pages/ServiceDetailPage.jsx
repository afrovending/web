import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Clock, MapPin, ChevronLeft, Calendar, User, ThumbsUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Calendar as CalendarComponent } from '../components/ui/calendar';
import { Progress } from '../components/ui/progress';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ServiceDetailPage = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [service, setService] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  
  // Booking state
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      setLoading(true);
      try {
        const serviceRes = await axios.get(`${API}/services/${serviceId}`);
        setService(serviceRes.data);
        
        if (serviceRes.data.vendor_id) {
          try {
            const vendorRes = await axios.get(`${API}/vendors/${serviceRes.data.vendor_id}`);
            setVendor(vendorRes.data);
          } catch (e) {
            console.log('Vendor not found');
          }
        }
        
        const reviewsRes = await axios.get(`${API}/services/${serviceId}/reviews`);
        setReviews(reviewsRes.data);
      } catch (error) {
        console.error('Failed to fetch service:', error);
        toast.error('Service not found');
        navigate('/services');
      } finally {
        setLoading(false);
      }
    };
    
    fetchService();
  }, [serviceId, navigate]);

  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchTimeSlots = async (date) => {
    setLoadingSlots(true);
    setSelectedTime(null);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await axios.get(`${API}/services/${serviceId}/timeslots?date=${dateStr}`);
      setTimeSlots(response.data);
    } catch (error) {
      console.error('Failed to fetch time slots:', error);
      setTimeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookService = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to book this service');
      navigate('/login');
      return;
    }
    
    if (!selectedDate || !selectedTime) {
      toast.error('Please select a date and time');
      return;
    }
    
    setSubmittingBooking(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await axios.post(`${API}/bookings`, {
        service_id: service.id,
        booking_date: dateStr,
        booking_time: selectedTime,
        notes: bookingNotes,
        customer_address: customerAddress
      });
      
      toast.success('Booking created! Proceed to payment.');
      navigate(`/bookings/${response.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create booking');
    } finally {
      setSubmittingBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
            <div className="aspect-video bg-muted rounded-xl" />
            <div className="space-y-4">
              <div className="h-6 bg-muted rounded w-1/4" />
              <div className="h-10 bg-muted rounded w-3/4" />
              <div className="h-24 bg-muted rounded" />
              <div className="h-12 bg-muted rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!service) return null;

  const images = service.images?.length > 0 
    ? service.images 
    : ['https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800'];

  // Disable past dates and weekends (if not available)
  const disabledDays = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-card border-b border-border py-4 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
          <Link to="/services" className="text-muted-foreground hover:text-primary flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Back to Services
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-video rounded-xl overflow-hidden bg-muted">
              <img
                src={images[selectedImage]}
                alt={service.name}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      selectedImage === idx ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {vendor && (
              <Link 
                to={`/vendors/${vendor.id}`}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <User className="h-4 w-4" />
                {vendor.store_name}
              </Link>
            )}

            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
              {service.name}
            </h1>

            {/* Rating & Meta */}
            <div className="flex flex-wrap items-center gap-4">
              {service.review_count > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-primary text-primary" />
                  <span className="font-medium">{service.average_rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({service.review_count} reviews)</span>
                </div>
              )}
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {service.duration_minutes} minutes
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {service.location_type === 'remote' ? 'Remote' : service.location_type === 'onsite' ? 'On-site' : 'Flexible'}
              </Badge>
            </div>

            {/* Price */}
            <div className="flex items-center gap-2">
              <span className="font-heading text-4xl font-bold text-foreground">
                ${service.price.toFixed(2)}
              </span>
              {service.price_type === 'hourly' && <span className="text-muted-foreground">/hour</span>}
              {service.price_type === 'starting_from' && <span className="text-muted-foreground">starting price</span>}
            </div>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed">{service.description}</p>

            {/* Tags */}
            {service.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {service.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booking Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <Tabs defaultValue="booking">
              <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0">
                <TabsTrigger
                  value="booking"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Service
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  Reviews ({reviews.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="booking" className="pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Calendar */}
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-4">Select Date</h3>
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={disabledDays}
                      className="rounded-md border"
                      data-testid="booking-calendar"
                    />
                  </div>

                  {/* Time Slots */}
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-4">Select Time</h3>
                    {!selectedDate ? (
                      <p className="text-muted-foreground">Please select a date first</p>
                    ) : loadingSlots ? (
                      <div className="grid grid-cols-3 gap-2">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="h-10 bg-muted rounded animate-pulse" />
                        ))}
                      </div>
                    ) : timeSlots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map((slot) => (
                          <Button
                            key={slot.time}
                            variant={selectedTime === slot.time ? 'default' : 'outline'}
                            disabled={!slot.is_available}
                            onClick={() => setSelectedTime(slot.time)}
                            className="h-10"
                            data-testid={`time-slot-${slot.time}`}
                          >
                            {slot.time}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No available slots for this date</p>
                    )}

                    {/* Additional Info */}
                    {selectedTime && (
                      <div className="mt-6 space-y-4">
                        {service.location_type !== 'remote' && (
                          <div>
                            <Label>Your Address (for on-site service)</Label>
                            <Input
                              value={customerAddress}
                              onChange={(e) => setCustomerAddress(e.target.value)}
                              placeholder="Enter your address"
                              className="mt-1"
                              data-testid="customer-address"
                            />
                          </div>
                        )}
                        <div>
                          <Label>Notes for the provider (optional)</Label>
                          <Textarea
                            value={bookingNotes}
                            onChange={(e) => setBookingNotes(e.target.value)}
                            placeholder="Any special requests or information..."
                            className="mt-1"
                            rows={3}
                            data-testid="booking-notes"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="pt-8">
                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-card rounded-xl p-6 border border-border">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarFallback>{review.user_name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{review.user_name}</h4>
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'
                                  }`}
                                />
                              ))}
                            </div>
                            {review.title && <h5 className="font-medium mb-1">{review.title}</h5>}
                            {review.comment && <p className="text-muted-foreground">{review.comment}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No reviews yet for this service.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl p-6 border border-border sticky top-24">
              <h3 className="font-heading font-semibold text-lg mb-4">Booking Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{service.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span>{service.duration_minutes} min</span>
                </div>
                {selectedDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date</span>
                    <span>{selectedDate.toLocaleDateString()}</span>
                  </div>
                )}
                {selectedTime && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Time</span>
                    <span>{selectedTime}</span>
                  </div>
                )}
              </div>
              
              <div className="border-t border-border pt-4 mb-6">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="font-heading">${service.price.toFixed(2)}</span>
                </div>
              </div>
              
              <Button
                className="w-full rounded-full h-12 text-lg font-semibold"
                onClick={handleBookService}
                disabled={!selectedDate || !selectedTime || submittingBooking}
                data-testid="book-service-btn"
              >
                {submittingBooking ? 'Creating Booking...' : 'Book Now'}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center mt-4">
                Payment will be held until you confirm service delivery
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailPage;
