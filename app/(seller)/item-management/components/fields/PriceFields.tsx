"use client";

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
    <div className="grid grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sales Price <span className="text-red-500">*</span>
        </label>
        <input
          value={salesPrice}
          onChange={(e) => setSalesPrice(e.target.value)}
          className="input"
          placeholder="0.00"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Regular Price <span className="text-red-500">*</span>
        </label>
        <input
          value={regularPrice}
          onChange={(e) => setRegularPrice(e.target.value)}
          className="input"
          placeholder="0.00"
        />
      </div>
      {shopType === "products" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="input"
            placeholder="0"
          />
        </div>
      )}
    </div>
  );
}
