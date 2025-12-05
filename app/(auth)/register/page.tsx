"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import GoogleSignInButton from "@/app/components/common/GoogleSignInButton";
import { registerUser } from "@/lib/api/auth/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import { ROLE_OPTIONS } from "@/setting";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [last_name, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("customer");

  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const device_name = navigator.userAgent || "web";

      const payload = {
        name,
        last_name,
        phone,
        email,
        password,
        role,
        device_name,
      };

      const response = await registerUser(payload);
      if (response.status === "success") {
        sessionStorage.setItem("registerEmail", email);
        toast.success("Confirm your email to continue");
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
    <div className="flex">
      {/* Left Column */}
      <div className="relative hidden lg:block h-full w-1/2">
        <Image
          width={1200}
          height={1600}
          src="/account-header.jpg"
          alt="A woman in traditional African attire"
          className="w-full h-full object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black opacity-10"></div>
      </div>

      {/* Right Column */}
      <div className="flex items-center justify-center bg-gray-50 p-8 sm:p-12 w-full lg:w-1/2">
        <div className="w-full max-w-md">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">
            Create Your Account
          </h1>

          {/* Google Login */}
          <div className="mb-6">
            <GoogleSignInButton />
          </div>

          {/* Separator */}
          <div className="my-6 flex items-center justify-center">
            <div className="grow border-t border-gray-300"></div>
            <span className="mx-4 text-sm text-gray-500">
              or continue with email
            </span>
            <div className="grow border-t border-gray-300"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4 text-gray-700">
            {/* Firstname */}
            <div>
              <label className="block text-sm font-medium mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="John"
              />
            </div>

            {/* Lastname */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Last Name
              </label>
              <input
                type="text"
                required
                value={last_name}
                onChange={(e) => setLastName(e.target.value)}
                className="input"
                placeholder="Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input"
                placeholder="+254712345678"
              />
            </div>
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Choose Account Type
              </label>

              <div className="space-y-2">
                {ROLE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-3 p-3 border border-red-100 rounded-md cursor-pointer bg-white hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={role === opt.value}
                      onChange={() => setRole(opt.value)}
                      className="h-4 w-4 text-red-600 border-gray-300 rounded cursor-pointer"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full!"
            >
              {loading ? "Processing..." : "Register"}
            </button>

            <button
              type="button"
              className="btn btn-gray w-full"
              onClick={() => router.push("/login")}
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
