"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import Image from "next/image";
import { updateUserProfile } from "@/lib/api/auth/profile";
import toast from "react-hot-toast";
import ShippingSection from "./ShippingSection";
import useUKGreeting from "@/hooks/useUKGreeting";

export default function OverviewSection() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    last_name: user?.last_name || "",
    phone: user?.phone || "",
  });

  const greeting = useUKGreeting();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const updatedUser = await updateUserProfile(user.id, formData);
      updateUser(updatedUser);
      setFormData({
        name: updatedUser.name || "",
        last_name: updatedUser.last_name || "",
        phone: updatedUser.phone || "",
      });

      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFormData({
      name: user?.name || "",
      last_name: user?.last_name || "",
      phone: user?.phone || "",
    });
  }, [user]);

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      last_name: user?.last_name || "",
      phone: user?.phone || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Box */}
      <div className="card">
        <h2 className="text-lg font-semibold">
          {greeting}, {user?.name ?? "Guest"}
        </h2>
        <p className="text-sm mt-1 text-gray-600">
          From your account dashboard, you can easily check & view your
          <span className="text-red-800"> Recent Orders</span>, manage your
          <span className="text-red-800"> Shipping and Billing Addresses</span>,
          and edit your
          <span className="text-red-800"> Account Details</span>.
        </p>
      </div>

      {/* Profile Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card flex flex-col items-center text-center py-6">
          <Image
            src={user?.profile_photo || "/default-avatar.png"}
            width={80}
            height={80}
            alt="Profile"
            className="rounded-full"
          />

          {isEditing ? (
            <div className="mt-4 w-full space-y-2">
              <input
                className="input w-full"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="First Name"
              />
              <input
                className="input w-full"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Last Name"
              />
              <input
                className="input w-full"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                maxLength={10}
              />
              <div className="flex gap-2 justify-center mt-2">
                <button
                  className="btn btn-primary w-full"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  className="btn btn-gray w-full"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  {loading ? "..." : "Cancel"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="mt-4 font-semibold text-lg">
                {user?.name} {user?.last_name ?? "Guest"}
              </h3>
              <p className="text-gray-500 text-sm">
                {user?.role ?? "Customer"}
              </p>
              <button
                className="mt-3 text-red-800 hover:underline cursor-pointer"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            </>
          )}
        </div>

        {/* Shipping Address Card */}
        <ShippingSection user={user} />
      </div>
    </div>
  );
}
