import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Zap, Crown, Building2, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PricingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [subscribing, setSubscribing] = useState(null);

  useEffect(() => {
    fetchPlans();
    if (isAuthenticated && user?.role === 'vendor') {
      fetchCurrentSubscription();
    }
  }, [isAuthenticated, user]);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API}/subscriptions/plans`);
      setPlans(response.data);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const response = await axios.get(`${API}/subscriptions/current`);
      setCurrentSubscription(response.data);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  };

  const handleSubscribe = async (planId) => {
    if (!isAuthenticated) {
      toast.error('Please login to subscribe');
      navigate('/login');
      return;
    }

    if (user?.role !== 'vendor') {
      toast.error('Only vendors can subscribe to plans');
      navigate('/become-vendor');
      return;
    }

    if (planId === 'starter') {
      toast.info('You are already on the free Starter plan');
      return;
    }

    if (planId === 'enterprise') {
      toast.info('Please contact us for Enterprise pricing');
      return;
    }

    setSubscribing(planId);
    try {
      const response = await axios.post(`${API}/subscriptions/checkout`, {
        plan_id: planId,
        billing_cycle: billingCycle,
        origin_url: window.location.origin
      });
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start checkout');
      setSubscribing(null);
    }
  };

  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'starter': return <Star className="h-6 w-6" />;
      case 'growth': return <Zap className="h-6 w-6" />;
      case 'pro': return <Crown className="h-6 w-6" />;
      case 'enterprise': return <Building2 className="h-6 w-6" />;
      default: return <Star className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planId) => {
    switch (planId) {
      case 'starter': return 'bg-gray-100 text-gray-600';
      case 'growth': return 'bg-blue-100 text-blue-600';
      case 'pro': return 'bg-primary/10 text-primary';
      case 'enterprise': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPrice = (plan) => {
    if (plan.is_custom) return 'Custom';
    const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
    if (price === 0) return 'Free';
    return `$${price}`;
  };

  const getPeriod = (plan) => {
    if (plan.is_custom || plan.price_monthly === 0) return '';
    return billingCycle === 'yearly' ? '/year' : '/month';
  };

  const getYearlySavings = (plan) => {
    if (plan.is_custom || plan.price_monthly === 0) return null;
    const monthlyCost = plan.price_monthly * 12;
    const savings = monthlyCost - plan.price_yearly;
    if (savings > 0) {
      return Math.round((savings / monthlyCost) * 100);
    }
    return null;
  };

  const isCurrentPlan = (planId) => {
    if (!currentSubscription?.subscription) {
      return planId === 'starter';
    }
    return currentSubscription.subscription.plan_id === planId;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-16 px-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 md:py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Start free. Upgrade only when you're ready to grow. No hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <Label htmlFor="billing-toggle" className={billingCycle === 'monthly' ? 'font-semibold' : 'text-muted-foreground'}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={billingCycle === 'yearly'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
              data-testid="billing-toggle"
            />
            <Label htmlFor="billing-toggle" className={billingCycle === 'yearly' ? 'font-semibold' : 'text-muted-foreground'}>
              Yearly
              <Badge className="ml-2 bg-green-100 text-green-700 hover:bg-green-100">Save ~17%</Badge>
            </Label>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isCurrent = isCurrentPlan(plan.id);
            const savings = billingCycle === 'yearly' ? getYearlySavings(plan) : null;
            
            return (
              <div
                key={plan.id}
                className={`relative bg-card rounded-2xl border-2 p-6 flex flex-col ${
                  plan.id === 'growth' ? 'border-primary shadow-lg' : 'border-border'
                } ${isCurrent ? 'ring-2 ring-green-500' : ''}`}
                data-testid={`plan-card-${plan.id}`}
              >
                {/* Popular Badge */}
                {plan.id === 'growth' && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}

                {/* Current Plan Badge */}
                {isCurrent && (
                  <Badge className="absolute -top-3 right-4 bg-green-500 text-white">
                    Current Plan
                  </Badge>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <div className={`inline-flex p-3 rounded-xl ${getPlanColor(plan.id)} mb-4`}>
                    {getPlanIcon(plan.id)}
                  </div>
                  <h3 className="font-heading text-xl font-bold">{plan.name}</h3>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold font-accent">{getPrice(plan)}</span>
                    <span className="text-muted-foreground">{getPeriod(plan)}</span>
                  </div>
                  {savings && (
                    <p className="text-sm text-green-600 mt-1">Save {savings}% with yearly billing</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.commission_rate}% commission on each sale
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  className={`w-full ${plan.id === 'growth' ? '' : 'variant-outline'}`}
                  variant={plan.id === 'growth' ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrent || subscribing === plan.id}
                  data-testid={`subscribe-btn-${plan.id}`}
                >
                  {subscribing === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : plan.is_custom ? (
                    'Contact Sales'
                  ) : plan.price_monthly === 0 ? (
                    'Get Started Free'
                  ) : (
                    'Subscribe Now'
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <h4 className="font-semibold mb-2">No Long-term Contracts</h4>
              <p className="text-sm text-muted-foreground">Cancel or upgrade anytime. We believe in earning your business.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Lower Fees as You Grow</h4>
              <p className="text-sm text-muted-foreground">As your business scales, your platform fees decrease.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Sell Globally</h4>
              <p className="text-sm text-muted-foreground">Without upfront risk. Start free and pay only when you're ready.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
