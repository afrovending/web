import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingBag, Store, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COLORS = ['#DC2626', '#1F2937', '#059669', '#D97706', '#7C3AED', '#EC4899'];

const MetricCard = ({ title, value, change, icon: Icon, prefix = '', suffix = '' }) => {
  const isPositive = change >= 0;
  return (
    <div className="bg-card rounded-xl p-5 border border-border">
      <div className="flex items-center justify-between mb-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        {change !== undefined && (
          <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold font-accent">{prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}</p>
      <p className="text-sm text-muted-foreground mt-1">{title}</p>
    </div>
  );
};

const AdminAnalytics = () => {
  const [period, setPeriod] = useState('30d');
  const [overview, setOverview] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [topVendors, setTopVendors] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [overviewRes, revenueRes, userRes, vendorsRes, productsRes, categoryRes] = await Promise.all([
        axios.get(`${API}/admin/analytics/overview?period=${period}`),
        axios.get(`${API}/admin/analytics/revenue-chart?period=${period}`),
        axios.get(`${API}/admin/analytics/user-growth?period=${period}`),
        axios.get(`${API}/admin/analytics/top-vendors?period=${period}&limit=5`),
        axios.get(`${API}/admin/analytics/top-products?period=${period}&limit=5`),
        axios.get(`${API}/admin/analytics/category-breakdown`)
      ]);
      
      setOverview(overviewRes.data);
      setRevenueChart(revenueRes.data);
      setUserGrowth(userRes.data);
      setTopVendors(vendorsRes.data);
      setTopProducts(productsRes.data);
      setCategoryBreakdown(categoryRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl" />)}
        </div>
        <div className="h-80 bg-muted rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-64 bg-muted rounded-xl" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Platform Analytics</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40" data-testid="analytics-period-select">
            <Calendar className="h-4 w-4 mr-2" />
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Revenue" 
          value={overview?.revenue?.total || 0}
          change={overview?.revenue?.change}
          icon={DollarSign}
          prefix="$"
        />
        <MetricCard 
          title="Transactions" 
          value={overview?.transactions?.total || 0}
          change={overview?.transactions?.change}
          icon={ShoppingBag}
        />
        <MetricCard 
          title="New Users" 
          value={overview?.users?.new || 0}
          change={overview?.users?.change}
          icon={Users}
        />
        <MetricCard 
          title="New Vendors" 
          value={overview?.vendors?.new || 0}
          change={overview?.vendors?.change}
          icon={Store}
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-4">Revenue Over Time</h3>
        {revenueChart.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip 
                formatter={(value) => [`$${value.toFixed(2)}`, '']}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
              />
              <Legend />
              <Area type="monotone" dataKey="orders" stackId="1" stroke="#DC2626" fill="#DC2626" fillOpacity={0.6} name="Product Sales" />
              <Area type="monotone" dataKey="bookings" stackId="1" stroke="#1F2937" fill="#1F2937" fillOpacity={0.6} name="Service Bookings" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No revenue data for this period
          </div>
        )}
      </div>

      {/* User Growth & Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-4">User Growth</h3>
          {userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="customers" fill="#DC2626" name="Customers" radius={[4, 4, 0, 0]} />
                <Bar dataKey="vendors" fill="#1F2937" name="Vendors" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No user growth data for this period
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-4">Sales by Category</h3>
          {categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                  nameKey="name"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No category data available
            </div>
          )}
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Vendors */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-4">Top Vendors</h3>
          {topVendors.length > 0 ? (
            <div className="space-y-3">
              {topVendors.map((vendor, index) => (
                <div key={vendor.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{vendor.store_name}</p>
                      <p className="text-xs text-muted-foreground">{vendor.orders + vendor.bookings} sales</p>
                    </div>
                  </div>
                  <span className="font-semibold text-sm">${vendor.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              No vendor data for this period
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold mb-4">Top Products</h3>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-secondary/10 text-secondary text-sm flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      {product.image && (
                        <img src={product.image} alt="" className="w-8 h-8 rounded object-cover" />
                      )}
                      <div>
                        <p className="font-medium text-sm truncate max-w-[150px]">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.quantity_sold} sold</p>
                      </div>
                    </div>
                  </div>
                  <span className="font-semibold text-sm">${product.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              No product data for this period
            </div>
          )}
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-4">Revenue Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold text-primary">${(overview?.revenue?.orders || 0).toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Product Sales</p>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold text-secondary">${(overview?.revenue?.bookings || 0).toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Service Bookings</p>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold">{overview?.transactions?.orders || 0}</p>
            <p className="text-sm text-muted-foreground">Orders</p>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold">{overview?.transactions?.bookings || 0}</p>
            <p className="text-sm text-muted-foreground">Bookings</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
