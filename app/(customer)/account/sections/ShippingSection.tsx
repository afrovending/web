"use client";

import { useEffect, useState } from "react";
import { User } from "@/interfaces/user";
import Address from "@/interfaces/address";
import { updateAddress, getAddresses } from "@/lib/api/auth/shipping";
import toast from "react-hot-toast";
import GoogleAddressAutocomplete from "@/app/(seller)/shop-management/components/GoogleAddressAutocomplete";
import { countryCodeToFlag } from "@/utils/countryFlag";
import PhoneInput from "@/app/(seller)/shop-management/components/PhoneInput";
import TextInput from "@/app/(seller)/shop-management/components/TextInput";

interface ShippingSectionProps {
  user: User | null;
}

interface ShippingFormData {
  address_id?: number;
  street_address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  phone: string;
  address_label: string;
  lat?: number;
  lng?: number;
  dialCode?: string; // add this
}


export default function ShippingSection({ user }: ShippingSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<Address | null>(null);
const [formData, setFormData] = useState<ShippingFormData>({
  street_address: "",
  city: "",
  state: "",
  country: "",
  zip_code: "",
  phone: "",
  address_label: "",
  lat: undefined,
  lng: undefined,
  dialCode: undefined,
});

  // Load existing addresses or fallback to user
  useEffect(() => {
    async function loadAddress() {
      try {
        const addresses = await getAddresses();
        if (addresses.length > 0) {
          const addr = addresses[0];
          setAddress(addr);
          setFormData({ ...addr });
        } else if (user) {
          setFormData({
            street_address: user.street_address || "",
            city: user.city || "",
            state: user.state || "",
            country: user.country || "",
            zip_code: user.zip_code || "",
            phone: user.phone || "",
            address_label: user.address_label || "",
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadAddress();
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated = await updateAddress(formData);
      setAddress(updated);
      setFormData({ ...updated });
      toast.success("Address saved successfully");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (address) setFormData({ ...address });
    else if (user)
      setFormData({
        street_address: user.street_address || "",
        city: user.city || "",
        state: user.state || "",
        country: user.country || "",
        zip_code: user.zip_code || "",
        phone: user.phone || "",
        address_label: user.address_label || "",
      });
    setIsEditing(false);
  };

  return (
    <div className="card p-6">
      <h4 hidden className="text-sm text-gray-500 mb-3">
        Shipping Address
      </h4>

      {isEditing ? (
        <div className="space-y-2">
          {/* Google Address Autocomplete */}
          <GoogleAddressAutocomplete
            placeholder="Start typing street address..."
            onSelect={(addr) =>
              setFormData((prev) => ({
                ...prev,
                street_address: addr.street_address,
                city: addr.city,
                state: addr.state,
                zip_code: addr.zip_code,
                country: addr.country,
                lat: addr.lat,
                lng: addr.lng,
                dialCode: addr.dialCode,
              }))
            }
          />

          {/* Street Address */}
          <TextInput
            label="Street Address"
            value={formData.street_address}
            onChange={(v) =>
              setFormData((prev) => ({ ...prev, street_address: v }))
            }
            placeholder="Street Address"
            className="w-full"
          />

          {/* City, State, ZIP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <TextInput
              label="City"
              value={formData.city}
              onChange={(v) => setFormData((prev) => ({ ...prev, city: v }))}
              placeholder="City"
              className="w-full"
            />
            <TextInput
              label="State/Province"
              value={formData.state}
              onChange={(v) => setFormData((prev) => ({ ...prev, state: v }))}
              placeholder="State/Province"
              className="w-full"
            />
            <TextInput
              label="ZIP"
              value={formData.zip_code}
              onChange={(v) =>
                setFormData((prev) => ({ ...prev, zip_code: v }))
              }
              placeholder="ZIP Code"
              className="w-full"
            />
          </div>
          {/* Country */}
          <TextInput
            label="Country"
            value={formData.country}
            onChange={(v) => setFormData((prev) => ({ ...prev, country: v }))}
            placeholder="Country (2-letter code)"
            maxLength={2}
            className="w-full"
          />

          {/* Phone Input */}
          <PhoneInput
            countryFlag={countryCodeToFlag(formData.country)}
            dialCode={formData.dialCode ?? ""}
            value={formData.phone}
            onChange={(val) => setFormData((prev) => ({ ...prev, phone: val }))}
            validating={false} // set your own validation state
            valid={true} // set your own validation state
          />

          <TextInput
            label="Address Label"
            value={formData.address_label}
            onChange={(v) =>
              setFormData((prev) => ({ ...prev, address_label: v }))
            }
            required
            placeholder="Address Label"
            className="w-full"
          />
          {/* Buttons */}
          <div className="flex gap-2 mt-10">
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
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // Display Mode
        <div className="space-y-1">
          <p className="font-semibold">
            {user?.name} {user?.last_name ?? "Guest"}
          </p>
          <p className="text-gray-700 text-sm">
            {formData.street_address}, {formData.city}, {formData.state},{" "}
            {formData.zip_code}, {formData.country}
          </p>
          <p className="text-gray-700 text-sm">
            {formData.phone || "(no phone number)"}
          </p>
          <p className="text-gray-700 text-sm">
            {formData.address_label || ""}
          </p>

          <button
            className="mt-3 text-red-800 hover:underline cursor-pointer"
            onClick={() => setIsEditing(true)}
          >
            Edit Shipping Address
          </button>
        </div>
      )}
    </div>
  );
}
