"use client";

import { useState, useMemo } from "react";
import { useCart } from "@/context/CartContext";
import OrderSummary from "../carts/components/Summary";
import AddressAutocomplete from "./components/AddressAutocomplete";
import Address from "@/interfaces/address";
import { shippingRate } from "@/lib/api/customer/shippingRate";
import toast from "react-hot-toast";
import axios, { AxiosError } from "axios";
import { ShippingRateResponse } from "@/interfaces/shippingRate";
import { useAuthStore } from "@/store/useAuthStore";

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user } = useAuthStore(); // get logged-in user

  const [userIP] = useState<string>("178.238.11.6");
  const [loading, setLoading] = useState(false);
  const [shippingRates, setShippingRates] =
    useState<ShippingRateResponse | null>(null);
  const [shippingFee, setShippingFee] = useState(0);

  const [address, setAddress] = useState<Address>({
    street_address: "",
    city: "",
    state: "",
    zip_code: "",
    phone: "",
    address_label: "",
    country: "",
  });

  const [firstname, setFirstname] = useState(user?.name || "");
  const [lastname, setLastname] = useState(user?.last_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [serviceNote, setServiceNote] = useState("");
  const [preferredDate, setPreferredDate] = useState("");

  const isServiceOrder = useMemo(() => {
    return cart.some((item) => item.type === "services");
  }, [cart]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleAddressChange = (field: keyof Address, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!firstname.trim()) {
      return toast.error("First name is required");
    }
    if (!lastname.trim()) {
      return toast.error("Last name is required");
    }
    if (!email.trim()) {
      return toast.error("Email is required");
    }
    if (!phone.trim()) {
      return toast.error("Phone number is required");
    }

    if (!isServiceOrder) {
      if (!address.street_address.trim()) {
        return toast.error("Street address is required");
      }
      if (!address.city.trim()) {
        return toast.error("City is required");
      }
      if (!address.state.trim()) {
        return toast.error("State is required");
      }
      if (!address.zip_code.trim()) {
        return toast.error("Zip code is required");
      }
      if (!address.country.trim()) {
        return toast.error("Country is required");
      }
    } else {
      if (!serviceNote.trim()) {
        return toast.error("Service note is required");
      }
      if (!preferredDate.trim()) {
        return toast.error("Preferred date is required");
      }
    }

    const basePayload = {
      firstname,
      lastname,
      email,
      phone,
      country: address.country || "UK",
      ip: userIP,
      products: cart.map((item) => ({
        id: item.id,
        quantity: item.qty,
      })),
    };

    const payload = isServiceOrder
      ? {
          ...basePayload,
          note: serviceNote,
          preferred_date: preferredDate,
          type: "services",
        }
      : {
          ...basePayload,
          street: address.street_address,
          city: address.city,
          state: address.state,
          zip: address.zip_code,
          type: "products",
        };

    try {
      setLoading(true);
      const response = await shippingRate(payload);
      // Save email to sessionStorage ONLY if different
      const existingEmail = sessionStorage.getItem("checkout_email");
      if (!existingEmail || existingEmail !== email) {
        sessionStorage.setItem("checkout_email", email);
      }
      if (response?.rate) {
        setShippingRates(response.rate);
      }
    } catch (err) {
      let message = "An error occurred while saving the item";
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ message: string }>;
        message = axiosErr.response?.data?.message ?? axiosErr.message;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 py-8">
      <div className="px-4 lg:px-8 flex flex-col lg:flex-row gap-8">
        {/* Checkout Form */}
        <div className="flex-1">
          <h2 className="card text-xl font-semibold text-gray-800 mb-8">
            {isServiceOrder
              ? "Service Booking Information"
              : "Shipping Information"}
          </h2>
          <form
            className="grid grid-cols-1 bg-white p-6 rounded-lg shadow-md md:grid-cols-2 gap-4 text-gray-500!"
            onSubmit={handleSubmit}
          >
            {/* Customer Info */}
            {!user?.name && (
              <input
                type="text"
                placeholder="First name"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
                required
                className="input"
              />
            )}

            {!user?.last_name && (
              <input
                type="text"
                placeholder="Last name"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                required
                className="input"
              />
            )}

            {!user?.email && (
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
              />
            )}

            {/* 👇 Conditional Fields */}
            {!isServiceOrder ? (
              <>
                <div className="md:col-span-2">
                  <AddressAutocomplete
                    onSelectAddress={(addr) =>
                      setAddress((prev) => ({ ...prev, ...addr }))
                    }
                  />
                </div>
                <input
                  type="text"
                  placeholder="Street address"
                  value={address.street_address}
                  onChange={(e) =>
                    handleAddressChange("street_address", e.target.value)
                  }
                  className="input"
                />
                <input
                  type="text"
                  placeholder="City"
                  value={address.city}
                  onChange={(e) => handleAddressChange("city", e.target.value)}
                  className="input"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={address.state}
                  onChange={(e) => handleAddressChange("state", e.target.value)}
                  className="input"
                />
                <input
                  type="text"
                  placeholder="Zip code"
                  value={address.zip_code}
                  onChange={(e) =>
                    handleAddressChange("zip_code", e.target.value)
                  }
                  className="input"
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={address.country}
                  onChange={(e) =>
                    handleAddressChange("country", e.target.value)
                  }
                  className="input"
                />
                <input
                  type="text"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="input"
                />
              </>
            ) : (
              <>
                <textarea
                  placeholder="Describe your service needs or special instructions..."
                  value={serviceNote}
                  onChange={(e) => setServiceNote(e.target.value)}
                  rows={4}
                  className="border border-gray-200 p-3 rounded md:col-span-2 focus:ring-red-800 focus:border-red-800 focus:outline-none transition duration-150"
                  required
                />
                <input
                  type="datetime-local"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="border border-gray-200 p-3 rounded md:col-span-2 focus:ring-red-800 focus:border-red-800 focus:outline-none transition duration-150"
                  required
                />
              </>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !!shippingFee} // disable if shippingFee exists
              className={`mt-2 w-full py-3 rounded-full font-medium md:col-span-2 transition ${
                loading || !!shippingFee ? "btn btn-gray" : "btn btn-primary"
              }`}
            >
              {loading
                ? "Processing..."
                : isServiceOrder
                ? "Book Service"
                : "Get Shipping Rate"}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <OrderSummary
          cart={cart}
          subtotal={subtotal}
          shippingRates={shippingRates}
          onSelectRate={(fee) => setShippingFee(fee)}
          shippingFee={shippingFee}
        />
      </div>
    </div>
  );
}
