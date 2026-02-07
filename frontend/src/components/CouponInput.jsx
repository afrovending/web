import React, { useState } from 'react';
import { Tag, X, Loader2, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CouponInput = ({ onCouponApplied, appliedCode = null, onCouponRemoved }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/cart/apply-coupon`, { code: code.trim() });
      toast.success(response.data.message);
      setCode('');
      onCouponApplied(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid coupon code');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await axios.delete(`${API}/cart/coupon`);
      toast.success('Coupon removed');
      onCouponRemoved();
    } catch (error) {
      toast.error('Failed to remove coupon');
    } finally {
      setRemoving(false);
    }
  };

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-green-100 rounded-full">
            <Check className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">Coupon Applied</p>
            <p className="text-xs text-green-600 font-mono">{appliedCode}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={removing}
          className="text-green-700 hover:text-red-600 hover:bg-red-50"
          data-testid="remove-coupon-btn"
        >
          {removing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter coupon code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            className="pl-9 uppercase"
            data-testid="coupon-input"
          />
        </div>
        <Button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="px-6"
          data-testid="apply-coupon-btn"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Apply'
          )}
        </Button>
      </div>
    </div>
  );
};

export default CouponInput;
