"use client";

import { LuShoppingBag } from "react-icons/lu";

export default function ShopHeaderCard({ subtitle }: { subtitle?: string }) {
  return (
    <div className="card p-4 border rounded-md bg-white shadow-sm mb-6">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-green-50 p-2">
          <LuShoppingBag className="text-green-700" size={22} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Shop / Business information
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {subtitle ?? "Manage and update your shop details from here."}
          </p>
        </div>
      </div>
    </div>
  );
}
