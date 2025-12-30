"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { CartItem, useCart } from "@/context/CartContext";
import Modal from "../components/common/Modal";
import verifyCoupon from "@/lib/api/customer/coupon";
import Coupon from "@/interfaces/coupon";
import CartSummary from "./components/CartSummary";
import RemoveItemModal from "./components/RemoveItemModal";
import CartItemRow from "./components/CartItemRow";

export default function CartPage() {
  const { cart, updateQty, removeFromCart } = useCart();
  const router = useRouter();

  // Coupon
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Remove item modal
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CartItem | null>(null);

  const subtotal = cart.reduce(
    (sum: number, item: CartItem) =>
      sum + Number(item.price) * Number(item.qty),
    0
  );
  const total = Math.max(0, subtotal - discount);
  const hasOutOfStock = cart.some(
    (item) => item.stockQty !== undefined && item.qty > item.stockQty
  );

  // === Coupon functions ===
  const handleApplyCoupon = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await verifyCoupon(couponCode);

      if (res?.status === "error") {
        setError(res.message || "Invalid or expired coupon code");
        toast.error(res.message || "Invalid or expired coupon code");
        return;
      }

      if (res?.is_active && res.discount) {
        const { discount_rate, discount_type } = res.discount;

        let calculatedDiscount = 0;
        if (discount_type === "fixed")
          calculatedDiscount = Number(discount_rate);
        else if (discount_type === "percentage")
          calculatedDiscount = (subtotal * Number(discount_rate)) / 100;

        setDiscount(calculatedDiscount);
        setShowCouponModal(false);
      } else {
        setError("Invalid or expired coupon code");
      }
    } catch {
      setError("Failed to apply coupon. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // === Remove item functions ===
  const openRemoveModal = (item: CartItem) => {
    setItemToDelete(item);
    setShowRemoveModal(true);
  };
  const closeRemoveModal = () => {
    setItemToDelete(null);
    setShowRemoveModal(false);
  };
  const handleConfirmRemove = () => {
    if (!itemToDelete) return;
    removeFromCart(itemToDelete.id);
    toast.success(`${itemToDelete.title} removed from cart`);
    closeRemoveModal();
  };

  const handleProceedToShipping = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      router.push("/checkout");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 py-8">
      {/* Empty Cart */}
      {cart.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="90"
            height="90"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#C2680C"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-6"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <h2 className="sm:text-2xl font-semibold text-gray-800 mb-2">
            Your cart is empty
          </h2>
          <button
            onClick={() => router.push("/items")}
            className="btn btn-primary"
          >
            Explore Marketplace
          </button>
        </div>
      )}

      {/* Cart Content */}
      {cart.length > 0 && (
        <div className="px-4 lg:px-8 flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1 space-y-4">
            <h2 className="text-sm sm:text-xl font-semibold text-gray-800 mb-4 bg-white p-4 rounded-xl shadow">
              Your Cart ({cart.length})
            </h2>
            {cart.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                updateQty={updateQty}
                openRemoveModal={openRemoveModal}
              />
            ))}
          </div>

          {/* Cart Summary */}
          <CartSummary
            subtotal={subtotal}
            total={total}
            loading={loading}
            hasOutOfStock={hasOutOfStock}
            setShowCouponModal={setShowCouponModal}
            handleProceedToShipping={handleProceedToShipping}
          />
        </div>
      )}

      {/* Coupon Modal */}
      <Modal
        isOpen={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        title="Apply Coupon"
        description="Enter the coupon code to apply"
      >
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          className="input text-gray-500!"
          placeholder="Enter coupon code"
        />
        {error && <p className="text-green-800 text-sm mb-2">{error}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => setShowCouponModal(false)}
            className="px-4 py-2 bg-gray-200 text-gray-500 rounded-md hover:bg-gray-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyCoupon}
            disabled={loading || !couponCode}
            className="px-4 py-2 bg-green-800 text-white rounded-md hover:bg-green-800 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Applying..." : "Apply"}
          </button>
        </div>
      </Modal>

      {/* Remove Item Modal */}
      <RemoveItemModal
        isOpen={showRemoveModal}
        onClose={closeRemoveModal}
        onConfirm={handleConfirmRemove}
        item={itemToDelete}
      />
    </div>
  );
}
