"use client";

import { useEffect, useState, useCallback } from "react";
import { User } from "@/interfaces/user";
import { updateAddress, getAddress } from "@/lib/api/auth/shipping";
import toast from "react-hot-toast";
import { countryCodeToFlag } from "@/utils/countryFlag";
import GoogleAddressAutocomplete from "@/app/(seller)/dashboard/shop-management/components/GoogleAddressAutocomplete";
import PhoneInput from "@/app/(seller)/dashboard/shop-management/components/PhoneInput";
import TextInput from "@/app/(seller)/dashboard/shop-management/components/TextInput";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import {
  IoLocationOutline,
  IoGlobeOutline,
  IoCallOutline,
} from "react-icons/io5";
import Script from "next/script";
import Address from "@/interfaces/address";
import { IconType } from "react-icons";

interface AddressRowProps {
  Icon: IconType;
  label: string;
  title: React.ReactNode;
  subtitle?: string;
}

export default function ShippingSection({ user }: { user: User | null }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  const [formData, setFormData] = useState<Address>({
    street_address: "",
    city: "",
    state: "",
    country: "",
    zip_code: "",
    phone: "",
    lat: undefined,
    lng: undefined,
  });

  const loadData = useCallback(async () => {
    const savedAddress = await getAddress();

    if (savedAddress) {
      setFormData({
        street_address: savedAddress.street_address || "",
        city: savedAddress.city || "",
        state: savedAddress.state || "",
        country: savedAddress.country || "",
        zip_code: savedAddress.zip_code || "",
        phone: savedAddress.phone || "",
        lat: savedAddress.lat,
        lng: savedAddress.lng,
      });
    } else if (user) {
      setFormData((prev) => ({
        ...prev,
        phone: user.phone || "",
        country: user.country || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated = await updateAddress(formData);
      setFormData({
        ...updated,
        lat: updated.lat ?? formData.lat,
        lng: updated.lng ?? formData.lng,
      });
      toast.success("Shipping address synchronized");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        onLoad={() => setGoogleLoaded(true)}
      />

      <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <IoLocationOutline className="w-5 h-5 text-green-800" />
          Primary Shipping Address
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs font-bold text-green-800 flex items-center gap-1 hover:underline"
          >
            <PencilSquareIcon className="w-4 h-4" /> Edit
          </button>
        )}
      </div>

      <div className="p-6">
        {isEditing ? (
          <div className="space-y-4">
            <GoogleAddressAutocomplete
              onSelect={(addr) => setFormData((prev) => ({ ...prev, ...addr }))}
            />

            <TextInput
              label="Street"
              value={formData.street_address}
              onChange={(v) =>
                setFormData((p) => ({ ...p, street_address: v }))
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="City"
                value={formData.city}
                onChange={(v) => setFormData((p) => ({ ...p, city: v }))}
                disabled={!!formData.city}
              />
              <TextInput
                label="Province"
                value={formData.state}
                onChange={(v) => setFormData((p) => ({ ...p, state: v }))}
                disabled={!!formData.state}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="Postal Code"
                value={formData.zip_code}
                onChange={(v) => setFormData((p) => ({ ...p, zip_code: v }))}
                disabled={!!formData.zip_code}
              />
              <TextInput
                label="Country (2-letter)"
                value={formData.country}
                onChange={(v) =>
                  setFormData((p) => ({ ...p, country: v.toUpperCase() }))
                }
                maxLength={2}
                disabled={!!formData.country}
              />
            </div>

            <PhoneInput
              countryFlag={countryCodeToFlag(formData.country)}
              value={formData.phone}
              onChange={(val) => setFormData((p) => ({ ...p, phone: val }))}
            />

            <div className="flex gap-3 pt-4">
              <button
                disabled={loading}
                onClick={handleSave}
                className="btn btn-primary w-full!"
              >
                {loading ? "Saving..." : "Update Address"}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="btn btn-gray w-full!"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <AddressRow
              Icon={IoLocationOutline}
              label="Location"
              title={formData.street_address || "Not Set"}
              subtitle={
                formData.street_address
                  ? `${formData.city}, ${formData.state} ${formData.zip_code}`
                  : ""
              }
            />

            <AddressRow
              Icon={IoGlobeOutline}
              label="Region"
              title={
                <span className="flex items-center gap-2">
                  {countryCodeToFlag(formData.country)}{" "}
                  {formData.country || "Not specified"}
                </span>
              }
            />

            <AddressRow
              Icon={IoCallOutline}
              label="Contact"
              title={formData.phone || "No phone provided"}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function AddressRow({ Icon, label, title, subtitle }: AddressRowProps) {
  return (
    <div className="flex gap-4 group">
      <div className="bg-green-50 p-2.5 rounded-xl h-fit shrink-0 group-hover:bg-green-100 transition-colors">
        <Icon size={20} className="text-green-800" />
      </div>

      <div>
        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-0.5">
          {label}
        </p>
        <div className="text-gray-900 font-semibold leading-tight">{title}</div>
        {subtitle && (
          <p className="text-gray-500 text-sm mt-0.5 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
