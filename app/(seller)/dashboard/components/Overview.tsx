"use client";

import { getOverview } from "@/lib/api/seller/overview";
import { formatAmount } from "@/utils/formatCurrency";
import React, { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  FaChevronDown,
  FaWallet,
  FaRegFileAlt,
  FaShoppingBag,
} from "react-icons/fa";
import { getVendorEarnings } from "@/lib/api/seller/earnings";
import { Wallet } from "../finance-payment/components/WalletCard";

interface Stats {
  total_orders: number;
  new_orders: number;
  ongoing_orders: number;
  shipped_orders: number;
  cancelled_orders: number;
  returned_orders: number;
}

interface OverviewProps {
  period: string;
}

const StatGroup = ({
  children,
  icon: Icon,
  filterLabel = "This Week",
  gridClassName = "grid-cols-2", // Default to 2 columns for mobile
}: {
  children: React.ReactNode;
  icon: any;
  filterLabel?: string;
  gridClassName?: string; // New prop
}) => (
  <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col gap-6 relative overflow-hidden">
    <div className="flex justify-between items-start">
      <div className="p-3 bg-green-50 rounded-xl">
        <Icon className="text-green-400 text-xl" />
      </div>
      <button className="flex items-center gap-2 text-[10px] font-bold text-gray-400 border border-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors uppercase tracking-wider">
        {filterLabel} <FaChevronDown className="text-[8px]" />
      </button>
    </div>
    {/* Use the dynamic gridClassName here */}
    <div
      className={`grid ${gridClassName} sm:flex sm:flex-row items-end gap-8`}
    >
      {children}
    </div>
  </div>
);

const StatItem = ({
  label,
  value,
  loading,
}: {
  label: string;
  value?: string | number;
  loading: boolean;
}) => (
  <div className="flex flex-col gap-1 min-w-25">
    <span className="text-sm font-medium text-gray-400 whitespace-nowrap">
      {label}
    </span>
    <span className="text-2xl font-bold text-gray-900">
      {loading ? <Skeleton width={60} /> : value ?? 0}
    </span>
  </div>
);

const Overview: React.FC<OverviewProps> = ({ period }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<Wallet | undefined>(undefined);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getOverview(period);
        setStats(response.data);
        const earnings = await getVendorEarnings();
        setWallet(earnings?.data || null);
      } catch (err) {
        setError("Failed to load statistics.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [period]);

  if (error)
    return <div className="p-6 text-red-500 bg-red-50 rounded-xl">{error}</div>;

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <StatGroup
          icon={FaWallet}
          filterLabel={period}
          gridClassName="grid-cols-1"
        >
          <StatItem
            label="Total Earnings"
            value={formatAmount(wallet?.total_earning || 0)}
            loading={isLoading}
          />
          <StatItem
            label="Available Balance"
            value={formatAmount(wallet?.available_to_withdraw || 0)}
            loading={isLoading}
          />
        </StatGroup>

        {/* Section 2: Feedback (Example based on UI) */}
        <StatGroup icon={FaRegFileAlt} filterLabel={period}>
          <StatItem label="Reviews" value={0} loading={isLoading} />
          <StatItem
            label="Returns"
            value={stats?.returned_orders}
            loading={isLoading}
          />
          <StatItem
            label="Cancelled"
            value={stats?.cancelled_orders}
            loading={isLoading}
          />
        </StatGroup>

        {/* Section 3: Orders (Using your actual new API data) */}
        <StatGroup icon={FaShoppingBag} filterLabel={period}>
          <StatItem
            label="All Orders"
            value={stats?.total_orders}
            loading={isLoading}
          />
          <StatItem label="New" value={stats?.new_orders} loading={isLoading} />
          <StatItem
            label="Ongoing"
            value={stats?.ongoing_orders}
            loading={isLoading}
          />
        </StatGroup>
      </div>
    </div>
  );
};

export default Overview;
