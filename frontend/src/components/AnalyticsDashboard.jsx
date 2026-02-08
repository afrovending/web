import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Eye, Users,
  Package, ArrowUpRight, Lock, Loader2, BarChart3, PieChart
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Simple chart component using CSS
const SimpleLineChart = ({ data, color = 'primary', height = 100 }) => {
  if (!data || data.length === 0) return null;
  
  const values = data.map(d => d.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  
  return (
    <div className="relative w-full" style={{ height }}>
      <svg className="w-full h-full" viewBox={`0 0 ${data.length * 10} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" className={`text-${color}`} style={{ stopColor: 'currentColor', stopOpacity: 0.3 }} />
            <stop offset="100%" className={`text-${color}`} style={{ stopColor: 'currentColor', stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <path
          d={`M 0 ${height} ${data.map((d, i) => `L ${i * 10} ${height - ((d.value - min) / range) * (height - 10)}`).join(' ')} L ${(data.length - 1) * 10} ${height} Z`}
          fill={`url(#gradient-${color})`}
        />
        <path
          d={data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${i * 10} ${height - ((d.value - min) / range) * (height - 10)}`).join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-${color}`}
        />
      </svg>
    </div>
  );
};

// Simple bar chart
const SimpleBarChart = ({ data, height = 150 }) => {
  if (!data || data.length === 0) return null;
  
  const max = Math.max(...data.map(d => d.count), 1);
  
  return (
    <div className="flex items-end gap-2 justify-around" style={{ height }}>
      {data.map((item, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div 
            className="w-full bg-primary rounded-t transition-all"
            style={{ height: `${(item.count / max) * (height - 30)}px`, minHeight: 4 }}
          />
          <span className="text-xs text-muted-foreground truncate w-full text-center">
            {item.stage || item.source || item.location}
          </span>
        </div>
      ))}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, change, icon: Icon, trend, prefix = '', suffix = '' }) => {
  const isPositive = change >= 0;
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold font-accent mt-1">
              {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
            </p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 mt-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{isPositive ? '+' : ''}{change}%</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-xl">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        {trend && trend.length > 0 && (
          <div className="mt-4">
            <SimpleLineChart data={trend} height={50} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/analytics/vendor?period=${period}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      if (error.response?.status === 403) {
        toast.error('Upgrade to Growth+ to access analytics');
      } else {
        toast.error('Failed to load analytics');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No access - show upgrade prompt
  if (analytics && !analytics.has_access) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <div className="inline-flex p-4 bg-muted rounded-full mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Analytics Locked</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Advanced analytics including sales trends, traffic data, and conversion funnels
            are available for Growth, Pro, and Enterprise subscribers.
          </p>
          <Button onClick={() => navigate('/pricing')} data-testid="upgrade-for-analytics">
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Upgrade to Unlock Analytics
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { sales, top_products, traffic, conversions, customers } = analytics || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Dashboard
          </h3>
          <p className="text-sm text-muted-foreground">Track your store's performance</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px]" data-testid="analytics-period-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={sales?.total_revenue || 0}
          prefix="$"
          icon={DollarSign}
          trend={sales?.revenue_trend}
        />
        <StatCard
          title="Total Orders"
          value={sales?.total_orders || 0}
          icon={ShoppingCart}
          trend={sales?.orders_trend}
        />
        <StatCard
          title="Total Views"
          value={traffic?.total_views || 0}
          icon={Eye}
          trend={traffic?.views_trend}
        />
        <StatCard
          title="Conversion Rate"
          value={conversions?.overall_conversion_rate || 0}
          suffix="%"
          icon={TrendingUp}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Trend</CardTitle>
            <CardDescription>Daily revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            {sales?.revenue_trend && sales.revenue_trend.length > 0 ? (
              <SimpleLineChart data={sales.revenue_trend} height={200} color="green-500" />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No revenue data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversion Funnel</CardTitle>
            <CardDescription>From views to purchases</CardDescription>
          </CardHeader>
          <CardContent>
            {conversions?.funnel_data && conversions.funnel_data.length > 0 ? (
              <div className="space-y-4">
                {conversions.funnel_data.map((stage, i) => {
                  const maxCount = conversions.funnel_data[0]?.count || 1;
                  const percentage = (stage.count / maxCount) * 100;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{stage.stage}</span>
                        <span className="font-medium">{stage.count.toLocaleString()}</span>
                      </div>
                      <Progress value={percentage} className="h-3" />
                    </div>
                  );
                })}
                <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{conversions.view_to_cart_rate}%</p>
                    <p className="text-xs text-muted-foreground">View → Cart</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{conversions.cart_to_purchase_rate}%</p>
                    <p className="text-xs text-muted-foreground">Cart → Purchase</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{conversions.overall_conversion_rate}%</p>
                    <p className="text-xs text-muted-foreground">Overall</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No conversion data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products & Traffic Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Top Products
            </CardTitle>
            <CardDescription>Best performing products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {top_products && top_products.length > 0 ? (
              <div className="space-y-3">
                {top_products.slice(0, 5).map((product, i) => (
                  <div key={product.product_id} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-6">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.product_name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{product.views} views</span>
                        <span>{product.purchases} sales</span>
                        <span>{product.conversion_rate}% conv.</span>
                      </div>
                    </div>
                    <span className="font-semibold text-green-600">${product.revenue}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No product data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Traffic Sources
            </CardTitle>
            <CardDescription>Where your visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            {traffic?.top_sources && traffic.top_sources.length > 0 ? (
              <div className="space-y-3">
                {traffic.top_sources.map((source, i) => {
                  const total = traffic.top_sources.reduce((sum, s) => sum + s.count, 0);
                  const percentage = ((source.count / total) * 100).toFixed(1);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize">{source.source}</span>
                          <span className="text-muted-foreground">{percentage}%</span>
                        </div>
                        <Progress value={parseFloat(percentage)} className="h-2" />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">{source.count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No traffic data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customer Insights
          </CardTitle>
          <CardDescription>Understanding your customer base</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Customer Counts */}
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Total Customers</span>
                <span className="text-xl font-bold">{customers?.total_customers || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-green-700">New Customers</span>
                <span className="text-xl font-bold text-green-700">{customers?.new_customers || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700">Returning</span>
                <span className="text-xl font-bold text-blue-700">{customers?.returning_customers || 0}</span>
              </div>
            </div>

            {/* Customer Distribution */}
            <div className="md:col-span-2">
              <h4 className="text-sm font-medium mb-3">Top Locations</h4>
              {customers?.top_locations && customers.top_locations.length > 0 ? (
                <div className="space-y-2">
                  {customers.top_locations.map((loc, i) => {
                    const total = customers.top_locations.reduce((sum, l) => sum + l.count, 0);
                    const percentage = ((loc.count / total) * 100).toFixed(1);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-24 text-sm truncate">{loc.location}</span>
                        <Progress value={parseFloat(percentage)} className="flex-1 h-2" />
                        <span className="text-sm text-muted-foreground w-12 text-right">{loc.count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No location data yet
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">${sales?.average_order_value || 0}</p>
            <p className="text-xs text-muted-foreground">Avg. Order Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{traffic?.unique_visitors || 0}</p>
            <p className="text-xs text-muted-foreground">Unique Visitors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{top_products?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Active Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{customers?.total_customers || 0}</p>
            <p className="text-xs text-muted-foreground">Total Customers</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
