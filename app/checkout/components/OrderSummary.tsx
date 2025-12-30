"use client";

import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { formatAmount } from "@/utils/formatCurrency";
import { formatHumanReadable } from "@/utils/formatDate";
import { CARRIER_ICONS } from "@/setting";
import { useAuthStore } from "@/store/useAuthStore";
import { CartItem, useCart } from "@/context/CartContext";
import { CheckoutPayload, checkoutStripe } from "@/lib/api/customer/checkout";
import axios from "axios";
import { ShippingRateResponse, RateOption } from "@/interfaces/shippingRate";
import Coupon from "@/interfaces/coupon";

interface OrderSummaryProps {
  cart: CartItem[];
  subtotal: number;
  discount: number;
  appliedCoupon?: Coupon;
  shippingRates: ShippingRateResponse | null;
  onSelectRate: (fee: number) => void;
  shippingFee: number;
  setShowCouponModal: (show: boolean) => void;
}

export default function OrderSummary({
  cart,
  subtotal,
  discount,
  appliedCoupon,
  shippingRates,
  onSelectRate,
  shippingFee,
  setShowCouponModal,
}: OrderSummaryProps) {
  const [selected, setSelected] = useState<"cheapest" | "fastest" | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<RateOption | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const { user } = useAuthStore();
  const { clearCart } = useCart();

  // Aggregate vendor info: earliest delivery & combined carriers
  const aggregateRate = (option: RateOption) => {
    const vendors = Object.values(option.vendors);

    // Earliest delivery days
    const deliveryDays = vendors
      .map((v) => v.delivery_days)
      .filter((d): d is number => d != null);

    const estimatedDelivery =
      deliveryDays.length > 0
        ? vendors.find(
            (v) => Number(v.delivery_days) === Math.min(...deliveryDays)
          )?.estimated_delivery
        : vendors
            .map((v) => v.estimated_delivery)
            .filter(Boolean)
            .sort()[0] || null;

    const carriers = Array.from(new Set(vendors.map((v) => v.carrier))).join(
      ", "
    );

    return { estimatedDelivery, carriers };
  };

  const handlePick = (key: "cheapest" | "fastest", option: RateOption) => {
    setSelected(key);
    setSelectedShipping(option);
    onSelectRate(option.total);
  };

  console.log(discount);
  const handleCheckout = async () => {
    if (!shippingFee || !selectedShipping) {
      return toast.error("Please select a shipping option before checkout");
    }

    const sessionEmail = sessionStorage.getItem("checkout_email");

    const vendorIds = Object.keys(selectedShipping.vendors);
    const vendor_id = vendorIds[0];

    const vendorCarriers = Array.from(
      new Set(Object.values(selectedShipping.vendors).map((v) => v.carrier))
    ).join(", ");

    const shippingServiceCodes = Object.values(selectedShipping.vendors).map(
      (v) => ({
        vendor_id: Number(vendor_id),
        total: v.total,
        service_code: v.service_code,
        carrier: v.carrier,
        currency: v.currency,
        delivery_days: v.delivery_days,
        estimated_delivery: v.estimated_delivery,
        shipment_id: v.shipment_id,
        rate_id: v.rate_id,
      })
    );

    // Earliest delivery across all vendors
    const estimatedDelivery =
      Object.values(selectedShipping.vendors)
        .map((v) => v.estimated_delivery)
        .filter(Boolean)
        .sort()[0] || null;

    const payload: CheckoutPayload = {
      email: user?.email || sessionEmail!,
      products: cart.map((item) => ({
        id: item.id,
        variation_id: item.variation_id || null,
        quantity: item.qty,
        price: item.price,
        color: item.color || null,
        size: item.size || null,
      })),
      shipping_fee: shippingFee,
      shipping_carrier: vendorCarriers,
      estimated_delivery: estimatedDelivery!,
      shipping_service_code: shippingServiceCodes,
    };

    try {
      setLoading(true);
      const response = await checkoutStripe(payload);
      if (response.url) {
        sessionStorage.removeItem("checkout_email");
        clearCart();
        window.location.href = response.url;
      }
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message ?? err.message
        : "Checkout failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full lg:w-96 bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-700">
        Order Summary
      </h3>

      {/* Cart Items */}
      <div className="space-y-4 max-h-60 overflow-y-auto border-b pb-4">
        {cart.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src={item.image}
                alt={item.title}
                width={50}
                height={50}
                className="rounded-md object-cover"
              />
              <div>
                <p className="text-sm text-gray-700">{item.title}</p>
                {/* VARIATION DISPLAY */}
                {(item.color || item.size) && (
                  <p className="text-[10px] text-hub-secondary! font-medium italic">
                    {[item.color, item.size].filter(Boolean).join(" / ")}
                  </p>
                )}
                <p className="text-xs text-gray-400!">x{item.qty}</p>
              </div>
            </div>
            <span className="text-sm font-medium text-gray-800">
              {formatAmount(item.price * item.qty)}
            </span>
          </div>
        ))}
      </div>

      {discount > 0 && appliedCoupon && (
        <div className="flex justify-between text-green-800 font-medium bg-green-50 p-2 rounded-md">
          <span className="text-xs italic">
            Discount ({appliedCoupon.discount_code})
          </span>
          <span>-{formatAmount(discount)}</span>
        </div>
      )}
      <div className="flex justify-between items-center mt-2">
        <span className="text-hub-secondary">Coupon</span>
        <button
          className="text-green-800 font-semibold text-xs hover:underline cursor-pointer"
          onClick={() => setShowCouponModal(true)}
        >
          {discount > 0 ? "Change" : "Add Coupon"}
        </button>
      </div>
      {/* Subtotal */}
      <div className="flex justify-between py-3 text-gray-600">
        <span>Subtotal</span>
        <span>{formatAmount(subtotal)}</span>
      </div>

      {/* Shipping Options */}
      {shippingRates && (
        <div className="mt-4 space-y-3">
          {(["cheapest", "fastest"] as const).map((key) => {
            const option = shippingRates[key];
            if (!option) return null;

            const active = selected === key;
            const { estimatedDelivery, carriers } = aggregateRate(option);

            const carrierKey = carriers.split(",")[0].toLowerCase();
            const { icon: CarrierIcon, color } =
              CARRIER_ICONS[carrierKey] || CARRIER_ICONS.default;

            return (
              <div
                key={key}
                onClick={() => handlePick(key, option)}
                className={`flex gap-4 items-center p-4 rounded-lg border cursor-pointer transition
                  ${
                    active
                      ? "border-red-800 bg-green-50 scale-[1.02]"
                      : "border-gray-200 hover:border-gray-400 hover:scale-[1.01]"
                  }
                `}
              >
                <CarrierIcon
                  className="w-10 h-10 transition-transform duration-150"
                  style={{ color }}
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-700 capitalize">
                    {key}
                  </p>
                  <p className="text-sm text-gray-500">{carriers}</p>
                  <p className="text-sm text-gray-500">
                    Arrives:{" "}
                    {estimatedDelivery
                      ? formatHumanReadable(estimatedDelivery)
                      : "N/A"}
                  </p>
                </div>
                <div className="text-right font-semibold text-gray-700">
                  {formatAmount(option.total)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Total */}
      <div className="flex justify-between mt-6 pt-4 border-t border-red-800 text-lg font-semibold text-gray-800">
        <span>Total</span>
        <span>
          {shippingFee > 0
            ? formatAmount(subtotal + shippingFee - discount) // FIXED: Added "- discount"
            : "Select a shipping option"}
        </span>
      </div>

      {shippingFee > 0 && (
        <button
          onClick={handleCheckout}
          disabled={!shippingFee || !selectedShipping || loading}
          className="mt-4 w-full py-3 rounded-full font-medium btn btn-primary"
        >
          {loading ? "Processing..." : "Checkout to Payment"}
        </button>
      )}
    </div>
  );
}
