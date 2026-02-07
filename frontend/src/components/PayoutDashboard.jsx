import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Clock, CreditCard, ExternalLink, ArrowUpRight, ArrowDownRight, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PayoutDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [stripeStatus, setStripeStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);

  useEffect(() => {
    fetchData();
    
    // Check URL params for Stripe redirect status
    const urlParams = new URLSearchParams(window.location.search);
    const stripeParam = urlParams.get('stripe');
    if (stripeParam === 'connected') {
      toast.success('Stripe account connected successfully!');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (stripeParam === 'error') {
      toast.error('Failed to connect Stripe account. Please try again.');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (stripeParam === 'refresh') {
      toast.info('Please complete your Stripe onboarding.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, transactionsRes, statusRes] = await Promise.all([
        axios.get(`${API}/vendor/payout/summary`),
        axios.get(`${API}/vendor/payout/transactions`),
        axios.get(`${API}/vendor/stripe/status`)
      ]);
      
      setSummary(summaryRes.data);
      setTransactions(transactionsRes.data);
      setStripeStatus(statusRes.data);
    } catch (error) {
      console.error('Failed to fetch payout data:', error);
      toast.error('Failed to load payout data');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    setConnectingStripe(true);
    try {
      const response = await axios.post(`${API}/vendor/stripe/connect`);
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to connect Stripe');
      setConnectingStripe(false);
    }
  };

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (amount > (summary?.available_balance || 0)) {
      toast.error(`Amount exceeds available balance of $${summary?.available_balance.toFixed(2)}`);
      return;
    }
    
    setRequestingPayout(true);
    try {
      await axios.post(`${API}/vendor/payout/request`, { amount });
      toast.success(`Payout of $${amount.toFixed(2)} initiated successfully!`);
      setPayoutDialogOpen(false);
      setPayoutAmount('');
      fetchData(); // Refresh data
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to request payout');
    } finally {
      setRequestingPayout(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stripe Connect Status */}
      {!stripeStatus?.connected && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-semibold text-lg mb-1">Connect Stripe to Receive Payouts</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Set up your Stripe account to receive automatic payouts when customers confirm service delivery.
              </p>
              <Button 
                onClick={handleConnectStripe} 
                disabled={connectingStripe}
                className="rounded-full"
                data-testid="connect-stripe-btn"
              >
                {connectingStripe ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Connect Stripe Account
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {stripeStatus?.connected && !stripeStatus?.payouts_enabled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Complete Your Stripe Setup</p>
              <p className="text-sm text-yellow-700">Your Stripe account is connected but payouts are not yet enabled. Please complete the verification process.</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleConnectStripe}
              className="ml-auto rounded-full border-yellow-400 text-yellow-700 hover:bg-yellow-100"
            >
              Complete Setup
            </Button>
          </div>
        </div>
      )}

      {stripeStatus?.connected && stripeStatus?.payouts_enabled && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Stripe Connected</p>
              <p className="text-sm text-green-700">Your account is ready to receive payouts.</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleConnectStripe}
              className="ml-auto rounded-full border-green-400 text-green-700 hover:bg-green-100"
            >
              Manage Account
            </Button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="text-sm text-muted-foreground">Total Sales</span>
          </div>
          <p className="font-heading text-2xl font-bold">${summary?.total_sales.toFixed(2) || '0.00'}</p>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Available</span>
          </div>
          <p className="font-heading text-2xl font-bold text-primary">${summary?.available_balance.toFixed(2) || '0.00'}</p>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
          <p className="font-heading text-2xl font-bold">${summary?.pending_payout.toFixed(2) || '0.00'}</p>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-muted-foreground">Paid Out</span>
          </div>
          <p className="font-heading text-2xl font-bold">${summary?.total_paid_out.toFixed(2) || '0.00'}</p>
        </div>
      </div>

      {/* Platform Fee Info */}
      <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Platform Fee (10%)</p>
          <p className="font-semibold">${summary?.platform_fees.toFixed(2) || '0.00'}</p>
        </div>
        {stripeStatus?.payouts_enabled && summary?.available_balance > 0 && (
          <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full" data-testid="request-payout-btn">
                <DollarSign className="h-4 w-4 mr-2" />
                Request Payout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Payout</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-2xl font-bold text-primary">${summary?.available_balance.toFixed(2)}</p>
                </div>
                <div>
                  <Label>Payout Amount ($)</Label>
                  <Input
                    type="number"
                    min="1"
                    max={summary?.available_balance}
                    step="0.01"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="mt-2"
                    data-testid="payout-amount-input"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleRequestPayout} 
                    disabled={requestingPayout || !payoutAmount}
                    data-testid="confirm-payout-btn"
                  >
                    {requestingPayout ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm Payout'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-lg">Transaction History</h3>
          <Button variant="ghost" size="sm" onClick={fetchData} data-testid="refresh-transactions">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        {transactions.length > 0 ? (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="p-4 flex items-center gap-4">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'earning' 
                      ? 'bg-green-100' 
                      : transaction.type === 'fee' 
                      ? 'bg-red-100' 
                      : 'bg-blue-100'
                  }`}>
                    {transaction.type === 'earning' ? (
                      <ArrowDownRight className="h-4 w-4 text-green-600" />
                    ) : transaction.type === 'fee' ? (
                      <ArrowUpRight className="h-4 w-4 text-red-600" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h4 className="font-heading font-semibold mb-2">No transactions yet</h4>
            <p className="text-sm text-muted-foreground">
              Your earnings will appear here when customers confirm service delivery.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayoutDashboard;
