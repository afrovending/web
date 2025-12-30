"use client";

import { trackOrder } from "@/lib/api/trackOrder";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { Order, OrderStatusTracker } from "./components/OrderStatusTracker";
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-sm w-full max-w-lg p-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900">Track Your Order</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter your email to view your latest order status.
          </p>
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
              <p className="text-gray-500">
                Your order status will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackOrderPage;
