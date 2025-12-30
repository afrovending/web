"use client";
import { FiMapPin } from "react-icons/fi";
import ShippingSection from "../sections/ShippingSection";
import { useAuthStore } from "@/store/useAuthStore";

export default function AddressBook() {
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      {/* Welcome Box */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold flex items-center">
          <FiMapPin className="text-green-800 text-xl mr-2" size={24} />
          Shipping Address
        </h2>
        <p className="text-sm mt-1 text-gray-600">
          From your account dashboard, you can easily check, modify and view
          your
          <span className="text-green-800"> Shipping Address</span>
        </p>
      </div>
      <ShippingSection user={user} />
    </div>
  );
}
