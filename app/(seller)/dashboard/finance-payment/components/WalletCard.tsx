"use client";

import { formatAmount } from "@/utils/formatCurrency";
import React, { useState } from "react";
import { withdrawRequest } from "@/lib/api/seller/earnings";
import toast from "react-hot-toast";
import ConfirmationModal from "../../components/commons/ConfirmationModal";

export interface Wallet {
  total_earning: string | number;
  available_to_withdraw: string | number;
  pending: string | number;
}

interface WalletCardProps {
  wallet?: Wallet;
  loading?: boolean;
}

export default function WalletCard({
  wallet,
  loading = false,
}: WalletCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Parse balance to number for clean logic
  const availableBalance = Number(wallet?.available_to_withdraw) || 0;
  const canWithdraw = availableBalance > 0;

  const onRequestWithdraw = () => {
    if (!canWithdraw) return;
    setIsModalOpen(true);
  };

  const handleWithdraw = async () => {
    const numericAmount = Number(amount);

    // --- Validation Logic ---
    if (!amount || numericAmount <= 0) {
      return toast.error("Please enter a valid amount");
    }

    if (numericAmount > availableBalance) {
      return toast.error("Amount exceeds available balance");
    }

    setSubmitting(true);
    try {
      await withdrawRequest(numericAmount);
      toast.success("Withdrawal request submitted successfully");
      setIsModalOpen(false);
      setAmount("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="card p-5 bg-white shadow-sm border rounded-xl">
        {/* Mobile-first: Column layout on small screens, row on medium */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="order-2 md:order-1">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Wallet Balance
            </h3>
            {!loading ? (
              <div className="mt-1">
                <p className="text-3xl font-extrabold text-gray-900 leading-none">
                  {formatAmount(wallet?.total_earning)}
                </p>
                <div className="mt-3 flex flex-wrap gap-y-1 items-center text-sm">
                  <span className="text-gray-500">Available:</span>
                  <span className="ml-1 font-bold text-green-600">
                    {formatAmount(wallet?.available_to_withdraw)}
                  </span>
                  <span className="mx-2 text-gray-300 hidden sm:inline space-x-2">
                    •
                  </span>
                  <span className="text-gray-500 ml-2 sm:ml-0">Pending:</span>
                  <span className="ml-1 font-bold text-green-600">
                    {formatAmount(wallet?.pending)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="animate-pulse space-y-3 mt-2">
                <div className="h-8 bg-gray-100 rounded w-32"></div>
                <div className="h-4 bg-gray-100 rounded w-48"></div>
              </div>
            )}
          </div>

          <button
            onClick={onRequestWithdraw}
            disabled={!canWithdraw || loading}
            className={`order-1 md:order-2 w-full md:w-auto px-6 py-3 md:py-2 rounded-lg font-bold text-sm transition-all
              ${
                canWithdraw
                  ? "bg-slate-900 text-white hover:bg-black active:scale-95"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
          >
            {canWithdraw ? "Request Withdrawal" : "Insufficient Balance"}
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title="Withdraw Funds"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">
              Enter Amount (Max: {formatAmount(availableBalance)})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                $
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:border-green-500 outline-none text-lg font-semibold transition-colors"
                min={0}
                max={availableBalance}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
            <button
              className="w-full sm:w-auto px-6 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="w-full sm:w-auto px-8 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 disabled:bg-gray-300 transition-all"
              onClick={handleWithdraw}
              disabled={
                submitting || !amount || Number(amount) > availableBalance
              }
            >
              {submitting ? "Processing..." : "Confirm Withdrawal"}
            </button>
          </div>
        </div>
      </ConfirmationModal>
    </>
  );
}
