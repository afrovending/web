import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Tag, Percent, DollarSign, Calendar, Users, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    max_discount: '',
    max_uses: '',
    max_uses_per_user: '1',
    start_date: '',
    expiry_date: '',
    is_active: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await axios.get(`${API}/coupons?include_inactive=true`);
      setCoupons(response.data);
    } catch (error) {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '',
      max_discount: '',
      max_uses: '',
      max_uses_per_user: '1',
      start_date: '',
      expiry_date: '',
      is_active: true
    });
    setEditingCoupon(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_order_amount: coupon.min_order_amount?.toString() || '',
      max_discount: coupon.max_discount?.toString() || '',
      max_uses: coupon.max_uses?.toString() || '',
      max_uses_per_user: coupon.max_uses_per_user?.toString() || '1',
      start_date: coupon.start_date ? coupon.start_date.split('T')[0] : '',
      expiry_date: coupon.expiry_date ? coupon.expiry_date.split('T')[0] : '',
      is_active: coupon.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }
    
    if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    setSubmitting(true);
    
    const payload = {
      code: formData.code.toUpperCase().trim(),
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
      max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      max_uses_per_user: formData.max_uses_per_user ? parseInt(formData.max_uses_per_user) : 1,
      start_date: formData.start_date ? `${formData.start_date}T00:00:00Z` : null,
      expiry_date: formData.expiry_date ? `${formData.expiry_date}T23:59:59Z` : null,
      is_active: formData.is_active
    };

    try {
      if (editingCoupon) {
        await axios.put(`${API}/coupons/${editingCoupon.id}`, payload);
        toast.success('Coupon updated successfully');
      } else {
        await axios.post(`${API}/coupons`, payload);
        toast.success('Coupon created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchCoupons();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    
    setDeletingId(couponId);
    try {
      await axios.delete(`${API}/coupons/${couponId}`);
      toast.success('Coupon deleted');
      setCoupons(coupons.filter(c => c.id !== couponId));
    } catch (error) {
      toast.error('Failed to delete coupon');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleActive = async (coupon) => {
    try {
      await axios.put(`${API}/coupons/${coupon.id}`, { is_active: !coupon.is_active });
      setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
      toast.success(coupon.is_active ? 'Coupon deactivated' : 'Coupon activated');
    } catch (error) {
      toast.error('Failed to update coupon');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  const isExpired = (coupon) => {
    if (!coupon.expiry_date) return false;
    return new Date(coupon.expiry_date) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">Coupons & Discounts</h3>
          <p className="text-sm text-muted-foreground">Manage promotional codes for your marketplace</p>
        </div>
        <Button onClick={openCreateModal} data-testid="create-coupon-btn">
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Coupons List */}
      {coupons.length === 0 ? (
        <div className="bg-muted/30 rounded-xl p-12 text-center">
          <Tag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h4 className="font-medium text-lg mb-2">No Coupons Yet</h4>
          <p className="text-muted-foreground mb-4">Create your first coupon to start offering discounts</p>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Create Coupon
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-6 py-4 font-medium">Code</th>
                  <th className="text-left px-6 py-4 font-medium">Discount</th>
                  <th className="text-left px-6 py-4 font-medium">Usage</th>
                  <th className="text-left px-6 py-4 font-medium">Valid Until</th>
                  <th className="text-left px-6 py-4 font-medium">Status</th>
                  <th className="text-left px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} data-testid={`coupon-row-${coupon.id}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />
                        <span className="font-mono font-semibold">{coupon.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {coupon.discount_type === 'percentage' ? (
                          <>
                            <Percent className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-600">{coupon.discount_value}%</span>
                            {coupon.max_discount && (
                              <span className="text-xs text-muted-foreground ml-1">
                                (max ${coupon.max_discount})
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-600">${coupon.discount_value}</span>
                          </>
                        )}
                      </div>
                      {coupon.min_order_amount > 0 && (
                        <p className="text-xs text-muted-foreground">Min. order: ${coupon.min_order_amount}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{coupon.used_count || 0}</span>
                        {coupon.max_uses && (
                          <span className="text-muted-foreground">/ {coupon.max_uses}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className={isExpired(coupon) ? 'text-red-500' : ''}>
                          {formatDate(coupon.expiry_date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isExpired(coupon) ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : coupon.is_active ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleActive(coupon)}
                          title={coupon.is_active ? 'Deactivate' : 'Activate'}
                          data-testid={`toggle-coupon-${coupon.id}`}
                        >
                          <Switch checked={coupon.is_active} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(coupon)}
                          data-testid={`edit-coupon-${coupon.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(coupon.id)}
                          disabled={deletingId === coupon.id}
                          className="text-destructive hover:text-destructive"
                          data-testid={`delete-coupon-${coupon.id}`}
                        >
                          {deletingId === coupon.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
            <DialogDescription>
              {editingCoupon 
                ? 'Update the coupon details below' 
                : 'Set up a new promotional code for your customers'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Coupon Code */}
            <div className="space-y-2">
              <Label htmlFor="code">Coupon Code *</Label>
              <Input
                id="code"
                placeholder="e.g., SAVE20"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="uppercase font-mono"
                disabled={!!editingCoupon}
                data-testid="coupon-code-input"
              />
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type *</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(v) => setFormData({ ...formData, discount_type: v })}
                >
                  <SelectTrigger data-testid="discount-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_value">
                  Value * {formData.discount_type === 'percentage' ? '(%)' : '($)'}
                </Label>
                <Input
                  id="discount_value"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={formData.discount_type === 'percentage' ? '20' : '10.00'}
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  data-testid="discount-value-input"
                />
              </div>
            </div>

            {/* Min Order & Max Discount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_order">Min. Order ($)</Label>
                <Input
                  id="min_order"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                  data-testid="min-order-input"
                />
              </div>
              {formData.discount_type === 'percentage' && (
                <div className="space-y-2">
                  <Label htmlFor="max_discount">Max Discount ($)</Label>
                  <Input
                    id="max_discount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="No limit"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                    data-testid="max-discount-input"
                  />
                </div>
              )}
            </div>

            {/* Usage Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_uses">Total Uses</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="0"
                  placeholder="Unlimited"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  data-testid="max-uses-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_uses_per_user">Per Customer</Label>
                <Input
                  id="max_uses_per_user"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={formData.max_uses_per_user}
                  onChange={(e) => setFormData({ ...formData, max_uses_per_user: e.target.value })}
                  data-testid="max-uses-per-user-input"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  data-testid="start-date-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  data-testid="expiry-date-input"
                />
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <Label htmlFor="is_active" className="text-base">Active</Label>
                <p className="text-sm text-muted-foreground">Enable this coupon for immediate use</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                data-testid="is-active-switch"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} data-testid="save-coupon-btn">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingCoupon ? (
                  'Update Coupon'
                ) : (
                  'Create Coupon'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponManagement;
