"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import Address from "@/interfaces/address";
import { shippingRate } from "@/lib/api/customer/shippingRate";
import toast from "react-hot-toast";
import { ShippingRateResponse } from "@/interfaces/shippingRate";
import { useAuthStore } from "@/store/useAuthStore";
import TextInput from "../(seller)/dashboard/shop-management/components/TextInput";
import GoogleAddressAutocomplete from "../(seller)/dashboard/shop-management/components/GoogleAddressAutocomplete";
import { countryCodeToFlag } from "@/utils/countryFlag";
import Coupon from "@/interfaces/coupon";
import verifyCoupon from "@/lib/api/customer/coupon";
import Modal from "../components/common/Modal";
import Script from "next/script";
import OrderSummary from "./components/OrderSummary";

export default function CheckoutPage() {
  const { cart } = useCart();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [shippingRates, setShippingRates] =
    useState<ShippingRateResponse | null>(null);
  const [shippingFee, setShippingFee] = useState(0);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon>();
  const [error, setError] = useState("");
  const [googleLoaded, setGoogleLoaded] = useState(false);

  const [address, setAddress] = useState<Address>({
    street_address: "",
    city: "",
    state: "",
    zip_code: "",
    phone: "",
    dialCode: "",
    country: "",
  });

  const [firstname, setFirstname] = useState(user?.name || "");
  const [lastname, setLastname] = useState(user?.last_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleAddressChange = (field: keyof Address, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  // === Coupon Logic ===
  const handleApplyCoupon = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await verifyCoupon(couponCode);

      // Match your API structure: status === "success" and top-level is_active
      if (res?.status === "success" && res?.is_active && res.discount) {
        const { discount_rate, discount_type } = res.discount;

        // Convert "10.9" string to Number
        const rate = Number(discount_rate);

        const calculatedDiscount =
          discount_type === "fixed" ? rate : (subtotal * rate) / 100;

        setDiscount(calculatedDiscount);
        setAppliedCoupon(res.discount); // Set the discount object
        toast.success("Coupon applied!");
        setShowCouponModal(false);
      } else {
        const msg = res?.message || "Invalid or inactive coupon";
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      setError("Failed to apply coupon.");
      toast.error("Failed to apply coupon.");
    } finally {
      setLoading(false);
    }
  };
  // === Submission & Validation ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Basic Validation
    if (!firstname.trim()) return toast.error("First name is required");
    if (!lastname.trim()) return toast.error("Last name is required");
    if (!email.trim()) return toast.error("Email is required");
    if (!phone.trim()) return toast.error("Phone number is required");

    // 2. Address Validation
    if (!address.street_address.trim())
      return toast.error("Street address is required");
    if (!address.city.trim()) return toast.error("City is required");

    // State 2-letter validation
    const stateTrimmed = address.state.trim();

    if (address.country === "GB") {
      // For UK: Must be more than 2 letters (e.g., "London", not "LD")
      if (stateTrimmed.length <= 2) {
        return toast.error(
          "Please enter the full County/State name for UK (e.g., London)"
        );
      }
    } else {
      // For others (US/CA): Must be exactly 2 letters (e.g., "NY", "ON")
      if (stateTrimmed.length !== 2) {
        return toast.error("State must be a 2-letter code (e.g., NY or ON)");
      }
    }

    const zipLength = address.zip_code.length;
    if (zipLength < 5 || zipLength > 10) {
      return toast.error(
        "Postal/Code code must be between 5 and 10 characters"
      );
    }

    if (!address.country.trim()) return toast.error("Country is required");

    const payload = {
      firstname,
      lastname,
      email,
      phone,
      country: address.country,
      street: address.street_address,
      city: address.city,
      state: address.state,
      zip: address.zip_code,
      type: "products",
      products: cart.map((item) => ({
        id: item.id,
        variation_id: item.variation_id || null,
        quantity: item.qty,
        price: item.price,
        color: item.color || null,
        size: item.size || null,
      })),
    };

    try {
      setLoading(true);
      const response = await shippingRate(payload);

      sessionStorage.setItem("checkout_email", email);

      if (response?.rate) {
        setShippingRates(response.rate);
        toast.success("Shipping rates updated");
      }
    } catch (err) {
      let message = "An error occurred while calculating shipping";
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.message ?? err.message;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((window.google as any)?.maps?.places) {
      setGoogleLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => setGoogleLoaded(true);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);
  return (
    <div className="bg-gray-50 py-8 min-h-screen">
      <div className="px-4 lg:px-8 flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
        {cart && cart.length > 0 ? (
          <>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Shipping Information
              </h2>
              <form
                className="grid grid-cols-1 bg-white p-6 rounded-lg shadow-sm md:grid-cols-2 gap-4"
                onSubmit={handleSubmit}
              >
                {/* Identity Fields */}
                <TextInput
                  label="First Name"
                  value={firstname}
                  onChange={setFirstname}
                  required
                />
                <TextInput
                  label="Last Name"
                  value={lastname}
                  onChange={setLastname}
                  required
                />
                <div className="md:col-span-2">
                  <TextInput
                    label="Email Address"
                    value={email}
                    onChange={setEmail}
                    required
                  />
                </div>

                {/* Address Section */}
                <div className="md:col-span-2">
                  {googleLoaded && (
                    <GoogleAddressAutocomplete
                      onSelect={(addr) =>
                        setAddress((prev) => ({ ...prev, ...addr }))
                      }
                    />
                  )}
                </div>

                <TextInput
                  label="Street Address"
                  value={address.street_address}
                  onChange={(v) => handleAddressChange("street_address", v)}
                  required
                />
                <TextInput
                  label="City"
                  value={address.city}
                  onChange={(v) => handleAddressChange("city", v)}
                  required
                />
                <TextInput
                  label="Province"
                  value={address.state}
                  onChange={(v) => handleAddressChange("state", v)}
                  required
                />
                <TextInput
                  label="Postal Code"
                  value={address.zip_code}
                  onChange={(v) => handleAddressChange("zip_code", v)}
                  required
                />
                <TextInput
                  label="Country"
                  value={address.country}
                  onChange={(v) => handleAddressChange("country", v)}
                  required
                />

                {/* Phone Section */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="flex items-stretch h-12">
                    <div className="flex items-center justify-center px-3 border border-gray-300 border-r-0 rounded-l-md bg-gray-50 text-gray-700 text-sm min-w-20">
                      <span className="mr-2">
                        {countryCodeToFlag(address.country)}
                      </span>
                      <span className="font-medium">
                        {address.dialCode || "+1"}
                      </span>
                    </div>
                    <input
                      type="tel"
                      className="input rounded-l-none flex-1 border border-gray-300 px-3 outline-none focus:ring-1 focus:ring-hub-primary"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="712 345 678"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !!shippingFee}
                  className={`mt-4 w-full py-3 rounded-full font-medium md:col-span-2 transition ${
                    loading || !!shippingFee
                      ? "btn btn-gray cursor-not-allowed"
                      : "btn btn-primary text-white hover:bg-opacity-90"
                  }`}
                >
                  {loading ? "Calculating..." : "Get Shipping Rate"}
                </button>
              </form>
            </div>

            <OrderSummary
              cart={cart}
              subtotal={subtotal}
              shippingRates={shippingRates}
              onSelectRate={setShippingFee}
              discount={discount}
              appliedCoupon={appliedCoupon}
              shippingFee={shippingFee}
              setShowCouponModal={setShowCouponModal}
            />

            <Modal
              isOpen={showCouponModal}
              onClose={() => setShowCouponModal(false)}
              title="Apply Coupon"
            >
              <div className="space-y-4">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="input w-full border border-gray-300 p-2 rounded"
                  placeholder="Enter coupon code"
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCouponModal(false)}
                    className="btn btn-gray w-full"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyCoupon}
                    disabled={loading || !couponCode}
                    className="btn btn-primary text-white w-full "
                  >
                    {loading ? "Checking..." : "Apply"}
                  </button>
                </div>
              </div>
            </Modal>
          </>
        ) : (
          <div className="w-full text-center py-20 bg-white rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-700">
              Your cart is empty
            </h2>
            <p className="mt-2 text-gray-500 text-lg">
              Add products to your cart to proceed with checkout.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
