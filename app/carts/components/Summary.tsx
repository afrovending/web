"use client";

import CartItem from "@/interfaces/cart";
import Image from "next/image";

interface OrderSummaryProps {
  cart: CartItem[];
  subtotal: number;
  shippingFee?: number;
  discount?: number;
  total: number;
 }

export default function OrderSummary({
  cart,
  subtotal,
  shippingFee = 0,
  discount = 0,
  total,
 }: OrderSummaryProps) {
  return (
    <div className="w-full lg:w-1/3 bg-white rounded-lg shadow-md p-6 h-fit lg:sticky lg:top-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary</h3>

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
                <p className="text-xs text-gray-400">x{item.qty}</p>
              </div>
            </div>
            <span className="text-sm font-medium text-gray-800">
              ${(item.price * item.qty).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="mt-4 space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>

        {shippingFee > 0 && (
          <div className="flex justify-between">
            <span>Shipping Fee</span>
            <span>${shippingFee.toFixed(2)}</span>
          </div>
        )}

        {discount > 0 && (
          <div className="flex justify-between text-green-600 font-medium">
            <span>Discount</span>
            <span>- ${discount.toFixed(2)}</span>
          </div>
        )} 
       
        <div className="border-t border-gray-300 pt-3 flex justify-between font-semibold text-gray-800">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="mt-6 space-y-3">
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name="payment" />
          <span className="text-sm">Stripe</span>
        </label>
         
      </div>

      {/* Terms */}
      <div className="mt-4 flex items-start gap-2">
        <input type="checkbox" />
        <span className="text-xs text-gray-500">
          I have read and agree to the website terms and conditions
        </span>
      </div>

      <button className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-full font-medium cursor-pointer">
        Checkout
      </button>
    </div>
  );
}
