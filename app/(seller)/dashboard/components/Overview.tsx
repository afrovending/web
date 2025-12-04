"use client";

import { getOverview } from "@/lib/api/seller/overview";
import React, { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import {
  FaTruck,
  FaTimesCircle,
  FaUndo,
  FaHourglassHalf,
  FaSpinner,
} from "react-icons/fa";
import { IconType } from "react-icons";

interface StatCardProps {
  title: string;
  value?: string | number;
  loading?: boolean;
  icon: IconType;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  loading,
  icon: Icon,
}) => (
  // Removed explicit width classes here. The parent grid handles the layout now.
  <div className="card border-b-4 border-red-300 p-4 cursor-pointer hover:bg-red-50 transition duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1 rounded-lg">
    <div className="flex items-center justify-between mb-0">
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <Icon className="text-xl text-red-500" />
    </div>
    {/* Value section */}
    <div className="flex items-baseline gap-2">
      <div className="text-4xl font-bold text-red-900">
        {loading ? (
          <Skeleton
            width={80}
            height={28}
            baseColor="#fdbb74"
            highlightColor="#fff7ed"
          />
        ) : (
          value
        )}
      </div>
    </div>
  </div>
);

// This interface strictly matches the provided API response structure:
interface Stats {
  total_processing: number;
  total_ongoing: number;
  total_delivered: number;
  total_cancelled: number;
  total_returned: number;
}

interface OverviewProps {
  period: string;
}

const Overview: React.FC<OverviewProps> = ({ period }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getOverview(period);
        console.log("here", response);
        setStats(response);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setError("Failed to load statistics. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (period) {
      fetchStats();
    }
  }, [period]);

  if (error) {
    return <div className="card p-6 text-red-400">{error}</div>;
  }

  const statCards = [
    {
      title: "Total Processing",
      value: stats?.total_processing,
      icon: FaSpinner,
    },
    {
      title: "Total Ongoing",
      value: stats?.total_ongoing,
      icon: FaHourglassHalf,
    },
    {
      title: "Total Delivered",
      value: stats?.total_delivered,
      icon: FaTruck,
    },
    {
      title: "Total Cancelled",
      value: stats?.total_cancelled,
      icon: FaTimesCircle,
    },
    { title: "Total Returned", value: stats?.total_returned, icon: FaUndo },
  ];

  return (
    // Replaced flex-wrap with a responsive grid layout
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {statCards.map((card) => (
        <StatCard
          key={card.title}
          title={card.title}
          value={card.value}
          loading={isLoading}
          icon={card.icon}
        />
      ))}
    </div>
  );
};

export default Overview;
