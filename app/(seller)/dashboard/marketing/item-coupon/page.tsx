"use client";

import { useState } from "react";
import { LuPlus, LuTicket } from "react-icons/lu";
import CouponTable from "./components/CouponTable";
import Drawer from "../../components/commons/Drawer";
import CouponForm from "./components/CouponForm";

export default function ItemCoupons() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Used to reload table

  const handleEdit = (coupon: any) => {
    setEditingCoupon(coupon);
    setDrawerOpen(true);
  };

  const handleAdd = () => {
    setEditingCoupon(null);
    setDrawerOpen(true);
  };

  const handleClose = () => {
    setDrawerOpen(false);
    setEditingCoupon(null);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div>
      <div className="card mb-6 hover:shadow-lg transition-all duration-300 rounded-xl bg-white p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 text-green-800">
              <LuTicket /> All Coupons
            </h2>
            <p className="text-sm mt-1 text-gray-600">
              Manage your active promotions and item-specific discounts.
            </p>
          </div>

          <button
            onClick={handleAdd}
            className="btn bg-green-800 hover:bg-green-900 text-white flex items-center gap-2 p-2 lg:py-2 lg:px-4 rounded-xl shadow-md transition-all active:scale-95"
          >
            <LuPlus className="text-xl lg:text-lg" />
            <span className="hidden lg:inline">Add Coupon</span>
          </button>
        </div>
      </div>

      <div className="space-y-6 mt-6">
        <CouponTable key={refreshKey} limit={10} onEdit={handleEdit} />
      </div>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={handleClose}
        title={editingCoupon ? "Edit Coupon" : "Create New Coupon"}
      >
        <CouponForm coupon={editingCoupon} onClose={handleClose} />
      </Drawer>
    </div>
  );
}
