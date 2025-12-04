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
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-sm w-full max-w-lg p-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900">Track Your Order</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter your email to view your latest order status.
          </p>

          <form onSubmit={handleSearch} className="flex mt-5 gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@mail.com"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-800 transition text-gray-700"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer px-6 py-2 bg-[#1B412C] text-white font-semibold rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-800 disabled:bg-red-300 disabled:cursor-not-allowed transition"
            >
              {loading ? "Searching..." : "Track"}
            </button>
          </form>
        </div>
        {order && <OrderStatusTracker order={order} />}
        {!order && !loading && (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-gray-500">Your order status will appear here.</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default TrackOrderPage;
