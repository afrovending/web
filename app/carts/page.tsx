"use client";

import Image from "next/image";
import {
  TrashIcon,
  HeartIcon,
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { CartItem, useCart } from "@/context/CartContext";
import { useState } from "react";
import Modal from "../components/common/Modal";
import verifyCoupon from "@/lib/api/customer/coupon";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Coupon from "@/interfaces/coupon";
import { ClipLoader } from "react-spinners";
import { formatAmount } from "@/utils/formatCurrency";

export default function CartPage() {
  const { cart, updateQty, removeFromCart } = useCart();
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon>();

  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const subtotal = cart.reduce(
    (sum: number, item: CartItem) =>
      sum + Number(item.price) * Number(item.qty),
    0
  );
  const total = Math.max(0, subtotal - discount);

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
        if (discount_type === "fixed") {
          calculatedDiscount = Number(discount_rate);
        } else if (discount_type === "percentage") {
          calculatedDiscount = (subtotal * Number(discount_rate)) / 100;
        }

        setDiscount(calculatedDiscount);
        setAppliedCoupon(res.discount);
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

  const router = useRouter();

  const handleProceedToShipping = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      router.push("/checkout");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRemove = () => {
    if (itemToDelete) {
      removeFromCart(itemToDelete);
      setItemToDelete(null);
    }
  };

  return (
    <div className="bg-gray-50 py-8">
      {cart.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {/* Empty Cart SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="180"
            height="180"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#c2410c"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-6"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>

          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Your Cart is Empty
          </h2>

          <p className="text-gray-600 mb-6">
            Looks like you haven't added anything to your cart yet.
          </p>

          <button
            onClick={() => router.push("/items")}
            className="px-6 py-3 bg-red-800 text-white rounded-full font-medium hover:bg-red-700 transition cursor-pointer"
          >
            Start Shopping
          </button>
        </div>
      )}

      {cart.length > 0 && (
        <div className="px-4 lg:px-8 flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1 space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 bg-white p-4 rounded-xl shadow">
              Your Cart ({cart.length})
            </h2>

            {cart.map((item: CartItem) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-4">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={100}
                    height={100}
                    className="rounded-md object-cover"
                  />
                  <div>
                    <h3 className="font-medium text-gray-800">{item.title}</h3>
                    <span
                      className={`text-xs font-medium ${
                        item.stock ? "text-red-800" : "text-red-800"
                      }`}
                    >
                      {item.stock ? "In stock" : "Out of stock"}
                    </span>

                    {/* Quantity */}
                    <div className="flex items-center gap-2 mt-2 text-red-800">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="w-5 h-5 flex items-center justify-center rounded-full cursor-pointer bg-red-100 text-red-800"
                      >
                        <MinusIcon className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className="w-5 h-5 flex items-center justify-center rounded-full cursor-pointer bg-red-100 text-red-800"
                      >
                        <PlusIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between h-full">
                  <span className="text-lg font-semibold text-gray-800">
                    {formatAmount(Number(item.price) * Number(item.qty))}
                  </span>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => setItemToDelete(item.id)}
                      className="p-2 hover:text-red-800"
                    >
                      <TrashIcon className="h-5 w-5 cursor-pointer text-gray-500 hover:text-red-500 " />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="w-full lg:w-1/3 bg-white rounded-lg shadow-md p-6 h-fit">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Summary
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatAmount(subtotal)}</span>
              </div>

              {discount > 0 && appliedCoupon && (
                <div className="flex justify-between text-red-800 font-medium">
                  <span>
                    Discount ({appliedCoupon.discount_code} -{" "}
                    {appliedCoupon.discount_type})
                  </span>
                  <span>- {formatAmount(discount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>Coupon</span>
                <button
                  className="text-red-800 font-medium cursor-pointer"
                  onClick={() => setShowCouponModal(true)}
                >
                  {discount > 0 ? "Change Coupon" : "Apply Coupon"}
                </button>
              </div>

              <div className="border-t border-gray-300 pt-3 flex justify-between font-semibold text-gray-800">
                <span>Total</span>
                <span>{formatAmount(total)}</span>
              </div>
            </div>
            <button
              onClick={handleProceedToShipping}
              disabled={loading}
              className={`mt-6 w-full py-3 rounded-full font-medium transition ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-800 hover:bg-red-800 text-white cursor-pointer"
              }`}
            >
              {loading ? (
                <div className="flex justify-center items-center gap-2">
                  <ClipLoader size={20} color="#fff" />
                  <span>Processing...</span>
                </div>
              ) : (
                "Proceed to Shipping"
              )}
            </button>
          </div>
        </div>
      )}

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

        {error && <p className="text-red-800 text-sm mb-2">{error}</p>}

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
            className="px-4 py-2 bg-red-800 text-white rounded-md hover:bg-red-800 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Applying..." : "Apply"}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        title="Remove Item?"
        description="Are you sure you want to remove this item from your cart?"
      >
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={() => setItemToDelete(null)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmRemove}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 cursor-pointer"
          >
            Remove
          </button>
        </div>
      </Modal>
    </div>
  );
}
