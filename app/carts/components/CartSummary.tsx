"use client";

import Coupon from "@/interfaces/coupon";
import { formatAmount } from "@/utils/formatCurrency";
import { useCart } from "@/context/CartContext"; // Import your cart hook

type Props = {
  subtotal: number;
  total: number;
  loading: boolean;
  hasOutOfStock: boolean;
  setShowCouponModal: (show: boolean) => void;
  handleProceedToShipping: () => void;
};

export default function CartSummary({
  subtotal,
  total,
  loading,
  hasOutOfStock,
  setShowCouponModal,
  handleProceedToShipping,
}: Props) {
  const { cart } = useCart();

  return (
    <div className="w-full lg:w-1/3 bg-white rounded-lg shadow-md p-5 sm:p-6 h-fit border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h3>

      {/* Mini Item List - Helpful for mobile double-check */}
      <div className="mb-6 space-y-3 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
        {cart.map((item) => (
          <div
            key={`${item.id}-${item.variation_id}`}
            className="flex justify-between items-start gap-4"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 line-clamp-1">
                {item.qty}x {item.title}
              </p>
              {/* VARIATION CHIPS */}
              {(item.color || item.size) && (
                <p className="text-[10px] text-hub-secondary! mt-0.5 italic">
                  {[item.color, item.size].filter(Boolean).join(" / ")}
                </p>
              )}
            </div>
            <span className="text-xs text-gray-600 shrink-0">
              {formatAmount(item.price * item.qty)}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-3 text-sm text-gray-600 border-t border-dashed border-gray-200 pt-4">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-medium text-gray-800">
            {formatAmount(subtotal)}
          </span>
        </div>

        <div className="border-t border-gray-300 pt-3 flex justify-between items-center">
          <span className="text-base font-bold text-gray-900">Total</span>
          <span className="text-lg font-bold text-green-900">
            {formatAmount(total)}
          </span>
        </div>
      </div>

      <button
        onClick={handleProceedToShipping}
        disabled={loading || hasOutOfStock || cart.length === 0}
        className={`mt-6 w-full py-3.5 rounded-full font-bold text-sm shadow-lg transition-all active:scale-95 ${
          loading || hasOutOfStock || cart.length === 0
            ? "btn btn-gray cursor-not-allowed"
            : "btn btn-primary cursor-pointer shadow-green-900/20"
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </span>
        ) : (
          "Checkout Now"
        )}
      </button>

      {hasOutOfStock && (
        <p className="text-[11px] text-red-600 text-center mt-3 font-medium">
          ⚠️ Some items in your cart are unavailable.
        </p>
      )}
    </div>
  );
}
