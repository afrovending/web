import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  TruckIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import React from "react";

interface StatusBadgeProps {
  status: string;
  type?: "payment" | "shipping";
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type }) => {
  const normalizedStatus = status.toLowerCase();

  const getColorClasses = () => {
    if (type === "payment") {
      switch (normalizedStatus) {
        case "paid":
        case "approved":
        case "completed":
          return "bg-green-100 text-green-600";
        case "unpaid":
        case "pending":
          return "bg-green-100 text-hub-secondary";
        case "cancelled":
          return "bg-red-100 text-red-600";
        case "refunded":
        case "refund":
          return "bg-green-100 text-hub-secondary";
        default:
          return "bg-gray-100 text-gray-600";
      }
    }

    // shipping or general statuses
    switch (normalizedStatus) {
      case "processing":
        return "bg-green-100 text-green-600";
      case "ongoing":
        return "bg-green-100 text-hub-secondary";
      case "active":
      case "approved":
      case "delivered":
        return "bg-green-100 text-green-600";
      case "returned":
        return "bg-green-100 text-hub-secondary";
      case "cancelled":
      case "declined":
      case "inactive":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getIcon = () => {
    // Payment-specific icons
    if (type === "payment") {
      switch (normalizedStatus) {
        case "paid":
        case "approved":
        case "completed":
          return <CheckCircleIcon className="w-4 h-4" />;
        case "pending":
        case "unpaid":
          return <ClockIcon className="w-4 h-4" />;
        case "declined":
        case "cancelled":
          return <XCircleIcon className="w-4 h-4" />;
        case "refunded":
        case "refund":
          return <ArrowPathIcon className="w-4 h-4" />;
        default:
          return null;
      }
    }

    // Shipping/general status icons
    switch (normalizedStatus) {
      case "processing":
        return <ClockIcon className="w-4 h-4" />;
      case "ongoing":
        return <TruckIcon className="w-4 h-4" />;
      case "active":
      case "approved":
      case "delivered":
        return <CheckCircleIcon className="w-4 h-4" />;
      case "returned":
        return <ArrowPathIcon className="w-4 h-4" />;
      case "declined":
      case "cancelled":
      case "inactive":
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ExclamationCircleIcon className="w-4 h-4" />;
    }
  };

  return (
    <span
      className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit font-medium text-sm ${getColorClasses()}`}
    >
      {getIcon()}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default StatusBadge;
