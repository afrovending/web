import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  CreditCard, Package, TrendingUp, Calendar, AlertCircle, 
  Check, ExternalLink, Loader2, RefreshCw, ArrowUpRight, Mail, Bell 
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from './ui/alert';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SubscriptionManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [emailPreferences, setEmailPreferences] = useState(null);
  const [updatingPrefs, setUpdatingPrefs] = useState(false);

  useEffect(() => {
    fetchSubscription();
    fetchEmailPreferences();
    
    // Check for success callback
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      handleSubscriptionSuccess(sessionId);
    }
  }, [searchParams]);

  const fetchEmailPreferences = async () => {
    try {
      const response = await axios.get(`${API}/vendor/email-preferences`);
      setEmailPreferences(response.data);
    } catch (error) {
      console.error('Failed to fetch email preferences:', error);
    }
  };

  const updateEmailPreference = async (key, value) => {
    setUpdatingPrefs(true);
    try {
      const response = await axios.put(`${API}/vendor/email-preferences`, {
        [key]: value
      });
      setEmailPreferences(response.data);
      toast.success('Email preferences updated');
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setUpdatingPrefs(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await axios.get(`${API}/subscriptions/current`);
      setSubscriptionData(response.data);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionSuccess = async (sessionId) => {
    try {
      const response = await axios.get(`${API}/subscriptions/success?session_id=${sessionId}`);
      toast.success(response.data.message);
      // Clear the URL params
      navigate('/vendor/dashboard', { replace: true });
      fetchSubscription();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to activate subscription');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return;
    }

    setCancelling(true);
    try {
      const response = await axios.post(`${API}/subscriptions/cancel`);
      toast.success(response.data.message);
      fetchSubscription();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      const response = await axios.post(`${API}/subscriptions/reactivate`);
      toast.success(response.data.message);
      fetchSubscription();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reactivate subscription');
    } finally {
      setReactivating(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const response = await axios.get(`${API}/subscriptions/portal?origin_url=${window.location.origin}`);
      window.location.href = response.data.portal_url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to open billing portal');
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { subscription, plan, product_count, products_remaining } = subscriptionData || {};
  const isFreePlan = !subscription || subscription.plan_id === 'starter';
  const isCancelled = subscription?.status === 'cancelled';
  const isPastDue = subscription?.status === 'past_due';

  const productUsage = plan?.product_limit === -1 
    ? 0 
    : Math.min(100, (product_count / plan?.product_limit) * 100);

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {isPastDue && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Payment Failed</AlertTitle>
          <AlertDescription>
            Your last payment failed. Please update your payment method to avoid service interruption.
            <Button variant="link" className="p-0 h-auto ml-2" onClick={handleManageBilling}>
              Update Payment Method
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isCancelled && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Subscription Cancelled</AlertTitle>
          <AlertDescription>
            Your subscription will end on {new Date(subscription.current_period_end).toLocaleDateString()}.
            You can reactivate anytime before then.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
              <CardDescription>
                {isFreePlan 
                  ? 'You are on the free Starter plan' 
                  : `Billed ${subscription?.billing_cycle || 'monthly'}`}
              </CardDescription>
            </div>
            <Badge 
              className={
                isPastDue 
                  ? 'bg-red-100 text-red-700' 
                  : isCancelled 
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
              }
            >
              {isPastDue ? 'Past Due' : isCancelled ? 'Cancelling' : subscription ? 'Active' : 'Free'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Name & Price */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div>
              <h3 className="text-2xl font-bold font-heading">{plan?.name || 'Starter'}</h3>
              <p className="text-muted-foreground">{plan?.commission_rate}% commission rate</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold font-accent">
                {isFreePlan ? 'Free' : `$${subscription?.billing_cycle === 'yearly' ? plan?.price_yearly : plan?.price_monthly}`}
              </p>
              {!isFreePlan && (
                <p className="text-sm text-muted-foreground">
                  per {subscription?.billing_cycle === 'yearly' ? 'year' : 'month'}
                </p>
              )}
            </div>
          </div>

          {/* Product Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                Product Usage
              </span>
              <span className="text-sm text-muted-foreground">
                {product_count} / {plan?.product_limit === -1 ? '∞' : plan?.product_limit} products
              </span>
            </div>
            <Progress value={productUsage} className="h-2" />
            {products_remaining !== -1 && products_remaining <= 2 && products_remaining > 0 && (
              <p className="text-xs text-yellow-600 mt-1">
                Only {products_remaining} product slot(s) remaining
              </p>
            )}
            {products_remaining === 0 && (
              <p className="text-xs text-red-600 mt-1">
                Product limit reached. Upgrade to add more products.
              </p>
            )}
          </div>

          {/* Billing Period */}
          {subscription && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Current period:</span>
              </div>
              <span>
                {new Date(subscription.current_period_start).toLocaleDateString()} - {new Date(subscription.current_period_end).toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Plan Features */}
          <div>
            <h4 className="text-sm font-medium mb-3">Plan Features</h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {plan?.features?.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          {isFreePlan ? (
            <Button onClick={() => navigate('/pricing')} data-testid="upgrade-plan-btn">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => navigate('/pricing')} data-testid="change-plan-btn">
                <TrendingUp className="h-4 w-4 mr-2" />
                Change Plan
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleManageBilling}
                disabled={portalLoading}
                data-testid="manage-billing-btn"
              >
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Manage Billing
              </Button>

              {isCancelled ? (
                <Button 
                  onClick={handleReactivate}
                  disabled={reactivating}
                  data-testid="reactivate-btn"
                >
                  {reactivating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Reactivate
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  className="text-destructive hover:text-destructive"
                  onClick={handleCancel}
                  disabled={cancelling}
                  data-testid="cancel-subscription-btn"
                >
                  {cancelling ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Cancel Subscription
                </Button>
              )}
            </>
          )}
        </CardFooter>
      </Card>

      {/* Upgrade Prompt for Free Users */}
      {isFreePlan && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Ready to Grow Your Business?</CardTitle>
            <CardDescription>
              Upgrade to unlock more products, lower commission rates, and premium features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">More Products</p>
                  <p className="text-muted-foreground">List up to 50 or unlimited products</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Lower Fees</p>
                  <p className="text-muted-foreground">Commission as low as 10%</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Premium Features</p>
                  <p className="text-muted-foreground">Analytics, badges & promotions</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/pricing')} data-testid="view-plans-btn">
              View All Plans
              <ArrowUpRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Email Preferences */}
      {emailPreferences && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Preferences
            </CardTitle>
            <CardDescription>
              Manage your email notification settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Weekly Analytics Report - only show for Growth+ */}
            {!isFreePlan && (
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Label htmlFor="weekly-report" className="text-base font-medium">
                      Weekly Analytics Report
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a detailed performance summary every Friday
                    </p>
                  </div>
                </div>
                <Switch
                  id="weekly-report"
                  checked={emailPreferences.weekly_analytics_report}
                  onCheckedChange={(checked) => updateEmailPreference('weekly_analytics_report', checked)}
                  disabled={updatingPrefs}
                  data-testid="weekly-report-toggle"
                />
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <Label htmlFor="order-notifications" className="text-base font-medium">
                    Order Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when you receive new orders
                  </p>
                </div>
              </div>
              <Switch
                id="order-notifications"
                checked={emailPreferences.order_notifications}
                onCheckedChange={(checked) => updateEmailPreference('order_notifications', checked)}
                disabled={updatingPrefs}
                data-testid="order-notifications-toggle"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <Label htmlFor="booking-notifications" className="text-base font-medium">
                    Booking Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when customers book your services
                  </p>
                </div>
              </div>
              <Switch
                id="booking-notifications"
                checked={emailPreferences.booking_notifications}
                onCheckedChange={(checked) => updateEmailPreference('booking_notifications', checked)}
                disabled={updatingPrefs}
                data-testid="booking-notifications-toggle"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <Label htmlFor="marketing-emails" className="text-base font-medium">
                    Marketing & Tips
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive tips to grow your business and platform updates
                  </p>
                </div>
              </div>
              <Switch
                id="marketing-emails"
                checked={emailPreferences.marketing_emails}
                onCheckedChange={(checked) => updateEmailPreference('marketing_emails', checked)}
                disabled={updatingPrefs}
                data-testid="marketing-emails-toggle"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubscriptionManagement;
