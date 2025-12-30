"use client";

import { useState } from "react";
import Image from "next/image";
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon,
  UserIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import GoogleSignInButton from "@/app/components/common/GoogleSignInButton";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import { registerUser } from "@/lib/api/auth/auth";
import { REGISTRATION_COUNTRY_LIST } from "@/setting";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [firstname, setName] = useState("");
  const [lastname, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(""); // Default empty to force choice
  const [selectedCountry, setSelectedCountry] = useState(
    REGISTRATION_COUNTRY_LIST[0]
  );
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const device_name =
        typeof window !== "undefined" ? navigator.userAgent : "web";
      const payload = {
        firstname,
        lastname,
        phone,
        email,
        password,
        role,
        device_name,
      };

      const response = await registerUser(payload);
      if (response.status === "success") {
        sessionStorage.setItem("registerEmail", email);
        toast.success(response.message || "Registration successful!");
        router.replace("/confirm-email");
      }
    } catch (error) {
      let message = "Registration failed. Please try again.";
      if (error instanceof AxiosError) {
        if (error.response?.status === 422 && error.response.data?.errors) {
          message = Object.values(error.response.data.errors).flat().join(" ");
        } else if (error.response?.data?.message) {
          message = error.response.data.message;
        }
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Column - Image */}
      <div className="relative hidden lg:block w-1/2">
        <Image
          width={1200}
          height={1600}
          src="/account-header.jpg"
          alt="African Culture"
          className="w-full h-full object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Right Column - Content */}
      <div className="flex items-center justify-center bg-gray-50 p-8 sm:p-12 w-full lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Progress Indicator */}
          <div className="flex justify-center mb-8 gap-2">
            <div
              className={`h-1.5 w-12 rounded-full ${
                step >= 1 ? "bg-hub-primary" : "bg-gray-200"
              }`}
            ></div>
            <div
              className={`h-1.5 w-12 rounded-full ${
                step >= 2 ? "bg-hub-primary" : "bg-gray-200"
              }`}
            ></div>
          </div>

          {/* STEP 1: ROLE SELECTION */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center">
                Join our Marketplace
              </h1>
              <p className="text-gray-500 text-center mb-8">
                Choose how you want to participate
              </p>

              <div className="space-y-4">
                <RoleCard
                  title="I'm a Customer"
                  description="I want to discover and buy authentic African products."
                  icon={<UserIcon className="w-8 h-8" />}
                  active={role === "customer"}
                  onClick={() => {
                    setRole("customer");
                    setStep(2);
                  }}
                />
                <RoleCard
                  title="I'm a Seller"
                  description="I want to list my items and grow my business."
                  icon={<ShoppingBagIcon className="w-8 h-8" />}
                  active={role === "vendor"}
                  onClick={() => {
                    setRole("vendor");
                    setStep(2);
                  }}
                />
              </div>

              <p className="mt-8 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  onClick={() => router.push("/login")}
                  className="text-hub-primary cursor-pointer font-semibold hover:underline"
                >
                  Login here
                </button>
              </p>
            </div>
          )}

          {/* STEP 2: DETAILS FORM */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <button
                onClick={() => setStep(1)}
                aria-label="back"
                className="flex items-center text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors cursor-pointer"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to roles
              </button>

              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                Tell us about yourself
              </h1>

              {/* do not show this when role selected is vendor */}
              {role !== "vendor" && (
                <>
                  <div className="mb-6">
                    <GoogleSignInButton />
                  </div>

                  <div className="relative my-6 flex items-center">
                    <div className="grow border-t border-gray-300"></div>
                    <span className="mx-4 text-xs uppercase text-gray-400 font-medium">
                      or use email
                    </span>
                    <div className="grow border-t border-gray-300"></div>
                  </div>
                </>
              )}

              <form
                onSubmit={handleRegister}
                className="space-y-4 text-gray-700"
              >
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    name="given-name" // Standard HTML name
                    autoComplete="given-name" // Helps browser autofill
                    value={firstname}
                    onChange={setName}
                    placeholder="Mary"
                    required
                  />
                  <Input
                    label="Last Name"
                    name="family-name" // Standard HTML name
                    autoComplete="family-name" // Helps browser autofill
                    value={lastname}
                    onChange={setLastName}
                    placeholder="Joseph"
                    required
                  />
                </div>

                <Input
                  label="Email"
                  type="email"
                  name="email"
                  autoComplete="email" // Critical for password managers
                  inputMode="email" // Forces the "@" and ".com" keyboard on mobile
                  value={email}
                  onChange={setEmail}
                  placeholder="mary.j@example.ca" // Localized Canadian example
                  required
                />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="flex  bg-white rounded-lg overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-hub-primary focus-within:border-hub-primary transition-all">
                    {/* Country Selector Prefix */}
                    <div className="flex items-center gap-1 bg-gray-50 px-3 border-r border-gray-300">
                      <span className="text-lg">{selectedCountry.flag}</span>
                      <span className="text-sm font-medium text-gray-600">
                        {selectedCountry.dial_code}
                      </span>
                      {/* If you eventually have multiple countries, you'd add a ChevronDownIcon here */}
                    </div>

                    {/* Phone Input Field */}
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, ""))
                      } // Only allow digits
                      className="flex-1 py-2.5 px-3 focus:outline-none text-gray-700 placeholder:text-gray-400"
                      placeholder="6470000000"
                      maxLength={10}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Currently accepting Canada-based numbers only.
                  </p>
                </div>

                <div className="relative">
                  <Input
                    label="Password"
                    id="password" // Add this
                    name="password" // Add this
                    autoComplete="new-password" // This triggers the suggestion
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={setPassword}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1} // Pro tip: prevents tabbing to the eye icon
                    className="absolute right-3 top-10 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full py-3 mt-4"
                >
                  {loading ? "Creating Account..." : "Complete Registration"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** HELPER COMPONENTS **/

function RoleCard({ title, description, icon, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`group cursor-pointer relative w-full flex items-center p-5 border-2 rounded-2xl transition-all duration-200 text-left
        ${
          active
            ? "border-hub-primary bg-hub-light-primary/10 shadow-md"
            : "border-gray-200 bg-white hover:border-hub-light-primary hover:shadow-sm"
        }
      `}
    >
      <div
        className={`p-3 rounded-xl mr-4 transition-colors ${
          active
            ? "bg-hub-primary text-white"
            : "bg-gray-100 text-gray-500 group-hover:bg-hub-light-primary group-hover:text-hub-secondary"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 leading-tight">{description}</p>
      </div>
      {active && (
        <CheckCircleIcon className="w-6 h-6 text-hub-secondary ml-2" />
      )}
    </button>
  );
}

export function Input({ label, type = "text", value, onChange, placeholder }: any) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
        placeholder={placeholder}
      />
    </div>
  );
}
