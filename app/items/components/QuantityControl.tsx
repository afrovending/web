"use client";

import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";

interface QuantityControlProps {
  quantity: number;
  stockQty: number;
  onIncrease: () => void;
  onDecrease: () => void;
  disabled?: boolean;
}

export default function QuantityControl({
  quantity,
  stockQty,
  onIncrease,
  onDecrease,
  disabled = false,
}: QuantityControlProps) {
  const isOutOfStock = stockQty <= 0;

  return (
    <div
      className={`flex items-center gap-3 bg-green-50 px-2 py-1.5 rounded-full border border-green-100 shadow-sm w-fit ${
        disabled ? "opacity-50 grayscale" : ""
      }`}
    >
      {/* Decrease Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onDecrease();
        }}
        disabled={disabled || quantity <= 1 || isOutOfStock}
        className="w-4 h-4 flex items-center justify-center rounded-full bg-white shadow-sm text-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90 cursor-pointer"
        aria-label="Decrease quantity"
      >
        <MinusIcon className="w-4 h-4 stroke-[3px]" />
      </button>

      {/* Quantity Display */}
      <span className="text-sm font-extrabold text-green-900 min-w-5 text-center select-none">
        {isOutOfStock ? 0 : quantity}
      </span>

      {/* Increase Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onIncrease();
        }}
        disabled={disabled || quantity >= stockQty || isOutOfStock}
        className="w-4 h-4 flex items-center justify-center rounded-full bg-white shadow-sm text-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90 cursor-pointer"
        aria-label="Increase quantity"
      >
        <PlusIcon className="w-4 h-4 stroke-[3px]" />
      </button>
    </div>
  );
}
