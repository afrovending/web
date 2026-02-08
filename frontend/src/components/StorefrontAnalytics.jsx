import React, { useState, useEffect } from 'react';
import { 
  Eye, Users, TrendingUp, Calendar, Clock, Monitor, Smartphone, Tablet,
  Globe, MousePointerClick, RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEVICE_COLORS = {
  desktop: '#3b82f6',
  mobile: '#10b981',
  tablet: '#f59e0b',
  unknown: '#6b7280'
};

const StorefrontAnalytics = ({ vendorId }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState('30');

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(
        `${API}/vendors/${vendorId}/storefront/analytics?days=${dateRange}`
      );
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (vendorId) {
      fetchAnalytics();
    }
  }, [vendorId, dateRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="h-80 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 bg-card rounded-xl border border-border">
        <Eye className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="font-heading font-semibold text-lg mb-2">No Analytics Data</h3>
        <p className="text-muted-foreground">Start promoting your storefront to see visitor analytics</p>
      </div>
    );
  }

  // Prepare device data for pie chart
  const deviceData = Object.entries(analytics.device_breakdown || {})
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: DEVICE_COLORS[name] || '#6b7280'
    }));

  // Format views by day for chart
  const viewsChartData = (analytics.views_by_day || []).map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold">Storefront Analytics</h2>
          <p className="text-sm text-muted-foreground">Track visitor activity on your store page</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            disabled={refreshing}
            data-testid="refresh-analytics"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-5 border border-border" data-testid="stat-today">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
              <Eye className="h-5 w-5" />
            </div>
            <span className="text-sm text-muted-foreground">Today</span>
          </div>
          <p className="text-3xl font-bold font-heading">{analytics.views_today}</p>
          <p className="text-xs text-muted-foreground mt-1">page views</p>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border" data-testid="stat-week">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-green-100 text-green-600">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="text-sm text-muted-foreground">This Week</span>
          </div>
          <p className="text-3xl font-bold font-heading">{analytics.views_this_week}</p>
          <p className="text-xs text-muted-foreground mt-1">page views</p>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border" data-testid="stat-month">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-purple-100 text-purple-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-sm text-muted-foreground">This Month</span>
          </div>
          <p className="text-3xl font-bold font-heading">{analytics.views_this_month}</p>
          <p className="text-xs text-muted-foreground mt-1">page views</p>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border" data-testid="stat-unique">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-orange-100 text-orange-600">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-sm text-muted-foreground">Unique Visitors</span>
          </div>
          <p className="text-3xl font-bold font-heading">{analytics.unique_visitors}</p>
          <p className="text-xs text-muted-foreground mt-1">in selected period</p>
        </div>
      </div>

      {/* Views Chart */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h3 className="font-semibold mb-4">Page Views Over Time</h3>
        {viewsChartData.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={viewsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#dc2626" 
                  strokeWidth={2}
                  dot={{ fill: '#dc2626', strokeWidth: 2 }}
                  name="Views"
                />
                <Line 
                  type="monotone" 
                  dataKey="unique" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                  name="Unique"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 flex items-center justify-center text-muted-foreground">
            No data available for the selected period
          </div>
        )}
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Device Breakdown */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Device Breakdown
          </h3>
          {deviceData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {deviceData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1 text-xs">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              No device data
            </div>
          )}
        </div>

        {/* Top Referrers */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Top Referrers
          </h3>
          {analytics.top_referrers?.length > 0 ? (
            <div className="space-y-3">
              {analytics.top_referrers.slice(0, 5).map((ref, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm truncate max-w-[150px]" title={ref.referrer}>
                    {ref.referrer}
                  </span>
                  <Badge variant="secondary">{ref.count}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
              No referrer data
            </div>
          )}
        </div>

        {/* Peak Hours */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Peak Hours
          </h3>
          {analytics.peak_hours?.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.peak_hours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="hour" 
                    tick={{ fontSize: 10 }}
                    stroke="#9ca3af"
                    tickFormatter={(h) => `${h}:00`}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    stroke="#9ca3af"
                  />
                  <Tooltip 
                    labelFormatter={(h) => `${h}:00 - ${h}:59`}
                  />
                  <Bar dataKey="views" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              No timing data
            </div>
          )}
        </div>
      </div>

      {/* Product Clicks */}
      {analytics.product_clicks?.length > 0 && (
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MousePointerClick className="h-4 w-4" />
            Top Product Clicks
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {analytics.product_clicks.slice(0, 5).map((product, idx) => (
              <div 
                key={product.product_id}
                className="bg-muted/50 rounded-lg p-3 text-center"
              >
                <p className="font-medium text-sm truncate" title={product.product_name}>
                  {product.product_name}
                </p>
                <p className="text-2xl font-bold text-primary mt-1">{product.clicks}</p>
                <p className="text-xs text-muted-foreground">clicks</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StorefrontAnalytics;
