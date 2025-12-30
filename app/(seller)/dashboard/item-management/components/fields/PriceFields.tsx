"use client";
import { handleDecimalChange, handleIntegerChange } from "@/utils/inputMode";

export default function PriceFields(props: any) {
  const {
    salesPrice,
    setSalesPrice,
    regularPrice,
    setRegularPrice,
    quantity,
    setQuantity,
    shopType,
  } = props;

  return (
    <div
      className={`grid gap-4 ${
        shopType === "products" ? "grid-cols-3" : "grid-cols-2"
      }`}
    >
      {/* Sales Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sales Price <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={salesPrice}
          onChange={(e) => handleDecimalChange(e.target.value, setSalesPrice)}
          className="input w-full"
          placeholder="0.00"
        />
      </div>

      {/* Regular Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Regular Price <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={regularPrice}
          onChange={(e) => handleDecimalChange(e.target.value, setRegularPrice)}
          className="input w-full"
          placeholder="0.00"
        />
      </div>

      {/* Quantity - Dynamic Grid Item */}
      {shopType === "products" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={quantity}
            onChange={(e) => handleIntegerChange(e.target.value, setQuantity)}
            className="input w-full"
            placeholder="0"
          />
        </div>
      )}
    </div>
  );
}
