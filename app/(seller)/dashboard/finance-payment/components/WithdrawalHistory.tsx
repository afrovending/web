"use client";

import { useEffect, useState } from "react";
import { getWithdrawalHistory } from "@/lib/api/seller/earnings";
import { formatAmount } from "@/utils/formatCurrency";
import { formatHumanReadableDate } from "@/utils/formatDate";
import { FiClock } from "react-icons/fi";

interface SettlementAccount {
  name: string;
  account_name: string;
  account_number: string;
}

interface Withdrawal {
  id: number;
  amount: string;
  status: string;
  settlement_account: SettlementAccount;
  created_at: string;
}

interface ApiResponse {
  status: "success" | "error";
  total: number;
  offset: number;
  limit: number;
  data: Withdrawal[];
}

export default function WithdrawalHistory() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [offset, setOffset] = useState<number>(0);
  const [limit] = useState<number>(3);
  const [total, setTotal] = useState<number>(0);

  async function fetchWithdrawals(loadMore = false) {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setOffset(0);
      }

      const currentOffset = loadMore ? offset : 0;
      const response: ApiResponse = await getWithdrawalHistory(
        currentOffset,
        limit
      );

      if (response.status === "success") {
        setTotal(response.total);
        if (loadMore) {
          setWithdrawals((prev) => [...prev, ...response.data]);
        } else {
          setWithdrawals(response.data);
        }
        setOffset(currentOffset + limit);
      }
    } catch (err) {
      console.error("Failed to fetch withdrawal history:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const hasMore = withdrawals.length < total;

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-semibold mb-2">Withdrawal History</h3>

      {loading ? (
        <>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse h-24 bg-gray-100 rounded-lg p-4"
            />
          ))}
        </>
      ) : withdrawals.length === 0 ? (
        <div className="card text-center text-black py-10">
          No withdrawals yet.
        </div>
      ) : (
        withdrawals.map((w) => (
          <div
            key={w.id}
            className="flex justify-between items-center p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition cursor-pointer"
          >
            <div>
              <p className="font-semibold text-gray-800">
                {formatAmount(w.amount)}
              </p>
              <p className="text-sm text-gray-600">
                Status:{" "}
                <span
                  className={`font-bold ${
                    w.status === "approved"
                      ? "text-green-600"
                      : w.status === "declined"
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {w.status}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                <b>Settlement Account:</b> {w.settlement_account.account_name} |{" "}
                {w.settlement_account.account_number} (
                {w.settlement_account.name})
              </p>
            </div>
            <div className="text-xs text-green-800 flex items-center">
              <FiClock /> {formatHumanReadableDate(w.created_at)}
            </div>
          </div>
        ))
      )}

      {hasMore && !loading && (
        <div className="flex justify-center mt-4">
          <button
            className="btn btn-primary"
            onClick={() => fetchWithdrawals(true)}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
