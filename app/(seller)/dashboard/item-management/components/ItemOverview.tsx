"use client";

import React, { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import {
  FaTruck,
  FaShoppingCart,
  FaTimesCircle,
  FaUndo,
  FaHourglassHalf,
  FaEye,
} from "react-icons/fa";
import { IconType } from "react-icons";
import { getItemStatictics } from "@/lib/api/items";

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
  <div className="card border-b-4 border-green-400 p-4 cursor-pointer hover:bg-green-50 transition duration-300 ease-in-out hover:shadow-xl transform hover:-translate-y-1 rounded-lg min-w-45">
    <div className="flex items-center justify-between mb-0">
      <div className="text-sm font-medium text-gray-500">{title}</div>

      <Icon className="text-xl text-green-600" />
    </div>
    {/* Value section */}
    <div className="flex items-baseline gap-2 mt-2">
      <div className="text-4xl font-extrabold text-gray-900">
        {loading ? (
          <Skeleton
            width={80}
            height={32}
            baseColor="#fed7aa"
            highlightColor="#fff7ed"
          />
        ) : typeof value === "number" ? (
          value.toLocaleString()
        ) : (
          value
        )}
      </div>
    </div>
  </div>
);

interface Stats {
  total_products: number;
  active_products: number;
  inactive_products: number;
  reviewed_products: number;
  ordered_products: number;
  views: string;
}

const ItemOverview: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response: Stats = await getItemStatictics();
        setStats(response);
      } catch (err) {
        console.error("Failed to fetch item stats:", err);
        setError("⚠️ Failed to load item statistics. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (error) {
    return (
      <div className="card p-6 border-l-4 border-red-500 bg-red-50 text-red-700 font-medium">
        {error}
      </div>
    );
  }

  const statCards = [
    { title: "Total Items", value: stats?.total_products, icon: FaTruck },
    // {
    //   title: "Active Items",
    //   value: stats?.active_products,
    //   icon: FaHourglassHalf,
    // },
    {
      title: "Inactive Items",
      value: stats?.inactive_products,
      icon: FaTimesCircle,
    },
    {
      title: "Items Ordered",
      value: stats?.ordered_products,
      icon: FaShoppingCart,
    },
    {
      title: "Items Reviewed",
      value: stats?.reviewed_products,
      icon: FaUndo,
    },
    { title: "Total Views", value: stats?.views, icon: FaEye },
  ];

  return (
    <div className="p-0">
      <div
        className="
      flex gap-8 
      overflow-x-auto pb-2 
      flex-nowrap 
      sm:flex-wrap sm:overflow-visible
    "
      >
        {" "}
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
    </div>
  );
};

export default ItemOverview;
