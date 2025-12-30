"use client";

import {
  Order,
  OrderStatusTracker,
} from "@/app/track-order/components/OrderStatusTracker";
import { trackOrder } from "@/lib/api/trackOrder";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { FiMapPin } from "react-icons/fi";

interface OrderResponse {
  status: string;
  order?: Order;
  message?: string;
}

const TrackOrderPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }

    setLoading(true);
    setOrder(null);

    try {
      const data: OrderResponse = await trackOrder(email);
      if (data.status === "success" && data.order) {
        setOrder(data.order);
        toast.success("Order found!");
      } else {
        toast.error(data.message || "Customer not found");
      }
    } catch {
      toast.error("Customer not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="card mb-6">
        <h2 className="text-lg font-semibold flex items-center">
          <FiMapPin className="text-green-800 text-xl mr-2" size={24} />
          Track Order
        </h2>
        <p className="text-sm mt-1 text-gray-600">
          Enter your email to view and manage delivery expectation of your
          <span className="text-green-800"> Order </span>
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="w-full mt-5 mb-8 space-y-3 md:space-y-0 md:flex md:items-end md:gap-3"
      >
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Enter your tracking number
          </label>

          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="TRA1238"
            className="input"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full md:w-auto"
        >
          {loading ? "Searching..." : "Track"}
        </button>
      </form>

      {order && <OrderStatusTracker order={order} />}

      {!order && !loading && (
        <div className="text-center py-10 border-2 border-dashed border-green-200 rounded-lg">
          <p className="text-gray-500">Your order status will appear here.</p>
        </div>
      )}
    </>
  );
};

export default TrackOrderPage;
