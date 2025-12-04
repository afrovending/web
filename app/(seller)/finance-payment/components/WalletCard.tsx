"use client";

import { formatAmount } from "@/utils/formatCurrency";
import React, { useState } from "react";
import { withdrawRequest } from "@/lib/api/seller/earnings";
import ConfirmationModal from "../../dashboard/components/commons/ConfirmationModal";
import toast from "react-hot-toast";

interface Wallet {
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

  const onRequestWithdraw = () => {
    setIsModalOpen(true);
  };

  const handleWithdraw = async () => {
    if (!amount) return;
    setSubmitting(true);
    try {
      await withdrawRequest(Number(amount));
      toast.success("Withdrawal request submitted successfully");
      setIsModalOpen(false);
      setAmount("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit withdrawal request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="card p-4 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            Wallet Balance
          </h3>
          <button
            onClick={onRequestWithdraw}
            className="btn btn-primary text-xs"
          >
            Request withdraw
          </button>
        </div>

        {!loading ? (
          <div className="mt-2">
            <p className="text-2xl font-bold text-gray-900">
              {formatAmount(wallet?.total_earning)}
            </p>

            <p className="text-xs text-gray-600">
              Available:
              <span className="font-semibold text-green-700">
                {" "}
                {formatAmount(wallet?.available_to_withdraw)}
              </span>
              &nbsp;•&nbsp; Pending:
              <span className="font-semibold text-red-800">
                {" "}
                {formatAmount(wallet?.pending)}
              </span>
            </p>
          </div>
        ) : (
          <div className="animate-pulse space-y-2 mt-2">
            <div className="h-5 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request Withdrawal"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Enter the amount you want to withdraw:
          </p>

          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="input w-full border rounded px-2 py-1"
            min={0}
            max={Number(wallet?.available_to_withdraw) || undefined}
          />

          <div className="mt-4 flex justify-end gap-3">
            <button
              className="btn btn-gray"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleWithdraw}
              disabled={submitting || !amount}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </ConfirmationModal>
    </>
  );
}
