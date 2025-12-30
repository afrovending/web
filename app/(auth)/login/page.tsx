"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import GoogleSignInButton from "@/app/components/common/GoogleSignInButton";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import { loginUser } from "@/lib/api/auth/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const device_name =
        typeof window !== "undefined" ? navigator.userAgent : "web";

      const result = await loginUser({ email, password, device_name });

      // 1. Sync State
      useAuthStore.getState().setAuth(result.token, result.user);

      // 2. Set Secure Cookies
      const cookieConfig = "path=/; SameSite=Lax; Secure";
      document.cookie = `token=${result.token}; ${cookieConfig}`;
      document.cookie = `role=${result.user.role}; ${cookieConfig}`;

      // 3. Optimized Redirect Logic
      const { role } = result.user;
      const hasShop = !!result.hasShop;

      if (role === "customer") {
        toast.success("Welcome Back");
        router.replace("/account");
      } else if (role === "vendor") {
        if (hasShop) {
          toast.success("Welcome Back");
          router.replace("/dashboard");
        } else {
          toast.success("Setup your shop to continue");
          router.replace("/seller-onboarding");
        }
      } else {
        router.replace("/");
      }
    } catch (error) {
      let message = "Login failed. Please try again.";

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
      {/* Left Column: Branding Image */}
      <div className="relative hidden lg:block w-1/2">
        <Image
          fill
          src="/account-header.jpg"
          alt="Afrovending Online Marketplace Branding"
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-black/5"></div>
      </div>

      {/* Right Column: Auth UI */}
      <div className="flex items-center justify-center bg-gray-50 p-8 w-full lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
            <p hidden className="text-gray-500 mt-2">
              Please enter your details to sign in
            </p>
          </div>

          {/* Fancy Google Button Component */}
          <div className="mb-8">
            <GoogleSignInButton />
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300"></span>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-50 px-4 text-gray-500">
                or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 text-gray-700">
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Email Address
              </label>
              <input
                id="email-address"
                type="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                placeholder="mary.j@example.ca"
                className="input appearance-none"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold mb-1.5 text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="input outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  // Use tabIndex="-1" so the user doesn't accidentally tab onto the eye icon instead of the button
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="text-right mt-2">
                <Link
                  href="/forget-password"
                  className="text-sm font-medium text-hub-primary hover:text-hub-secondary transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full h-11 flex items-center justify-center transition-all disabled:opacity-70"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Logging in...
                  </span>
                ) : (
                  "Log in"
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push("/register")}
                className="btn btn-gray w-full h-11 border border-gray-300 bg-white hover:bg-gray-50 transition-colors text-gray-700"
              >
                Create an account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
