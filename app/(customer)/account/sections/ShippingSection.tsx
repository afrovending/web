"use client";

import { useEffect, useState } from "react";
import { User } from "@/interfaces/user";
import Address from "@/interfaces/address";
import { updateAddress, getAddresses } from "@/lib/api/auth/shipping";
import toast from "react-hot-toast";
import axios from "axios";

interface ShippingSectionProps {
  user: User | null;
}

export default function ShippingSection({ user }: ShippingSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<{
    address_id?: number;
    street_address: string;
    city: string;
    state: string;
    country: string;
    zip_code: string;
    phone: string;
    address_label: string;
  }>({
    street_address: "",
    city: "",
    state: "",
    country: "",
    zip_code: "",
    phone: "",
    address_label: "",
  });

  // Load initial address (from backend) or fallback to user
  useEffect(() => {
    async function loadAddress() {
      try {
        const addresses = await getAddresses();
        if (addresses.length > 0) {
          const addr = addresses[0];
          setAddress(addr);
          setFormData({
            address_id: addr.address_id,
            street_address: addr.street_address || "",
            city: addr.city || "",
            state: addr.state || "",
            country: addr.country || "",
            zip_code: addr.zip_code || "",
            phone: addr.phone || "",
            address_label: addr.address_label || "",
          });
        } else if (user) {
          // fallback to user data
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedAddress = await updateAddress(formData);
      toast.success("Address saved successfully");
      setAddress(updatedAddress);

      setFormData({
        address_id: updatedAddress.address_id, // optional
        street_address: updatedAddress.street_address || "",
        city: updatedAddress.city || "",
        state: updatedAddress.state || "",
        country: updatedAddress.country || "",
        zip_code: updatedAddress.zip_code || "",
        phone: updatedAddress.phone || "",
        address_label: updatedAddress.address_label || "",
      });

      setIsEditing(false);
    } catch (err) {
      let message = "Failed to save address";
      const e: any = err;

      const humanizeField = (f: string) =>
        f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

      const extractMessagesFromObject = (obj: any) => {
        const parts: string[] = [];
        for (const [key, val] of Object.entries(obj)) {
          if (Array.isArray(val)) {
            val.forEach((v) =>
              parts.push(`${humanizeField(key)}: ${String(v)}`)
            );
          } else if (typeof val === "string") {
            parts.push(`${humanizeField(key)}: ${val}`);
          } else if (typeof val === "object") {
            // nested errors
            const nested = extractMessagesFromObject(val);
            if (nested) parts.push(nested);
          }
        }
        return parts.join(" ");
      };

      if (axios.isAxiosError(e)) {
        let resp = e.response?.data;
        // Sometimes backend returns a JSON string - try parse it
        if (typeof resp === "string") {
          try {
            resp = JSON.parse(resp);
          } catch {
            /* leave as string */
          }
        }

        if (resp) {
          if (resp.errors && typeof resp.errors === "object") {
            message =
              extractMessagesFromObject(resp.errors) ||
              resp.message ||
              String(resp);
          } else if (typeof resp === "object") {
            const possible = extractMessagesFromObject(resp);
            message = possible || resp.message || JSON.stringify(resp);
          } else if (typeof resp === "string") {
            message = resp;
          } else if (e.message) {
            message = e.message;
          }
        } else if (e.message) {
          message = e.message;
        }
      } else {
        // fallback for non-axios errors
        if (e) {
          if (typeof e === "string") {
            message = e;
          } else if (e.response?.data?.message) {
            message = e.response.data.message;
          } else if (e.data?.message) {
            message = e.data.message;
          } else if (e.message) {
            message = e.message;
          }
        }
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (address) {
      setFormData({
        address_id: address.address_id,
        street_address: address.street_address || "",
        city: address.city || "",
        state: address.state || "",
        country: address.country || "",
        zip_code: address.zip_code || "",
        phone: address.phone || "",
        address_label: address.address_label || "",
      });
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
    setIsEditing(false);
  };

  return (
    <div className="card p-6">
      <h4 hidden className="text-sm text-gray-500 mb-3">
        Shipping Address
      </h4>

      {isEditing ? (
        <div className="space-y-2">
          <input
            name="street_address"
            value={formData.street_address}
            onChange={handleChange}
            placeholder="Street Address"
            className="input w-full"
          />
          <input
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="City"
            className="input w-full"
          />
          <input
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="State/Province"
            className="input w-full"
          />
          <input
            name="zip_code"
            value={formData.zip_code}
            onChange={handleChange}
            placeholder="Zip Code"
            className="input w-full"
          />
          <input
            name="country"
            value={formData.country}
            onChange={handleChange}
            placeholder="Country (2-letter code)"
            className="input w-full"
            maxLength={2}
          />
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            className="input w-full"
            maxLength={10}
          />
          <input
            name="address_label"
            value={formData.address_label}
            onChange={handleChange}
            placeholder="Address Label"
            className="input w-full"
          />

          <div className="flex gap-2 mt-2">
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
        <div className="space-y-1">
          <p className="font-semibold">
            {user?.name} {user?.last_name ?? "Guest"}
          </p>
          <p className="text-gray-700 text-sm">
            {formData.street_address || ""} {formData.city}, {formData.state},{" "}
            {formData.country}
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
