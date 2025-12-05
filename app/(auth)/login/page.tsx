"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import GoogleSignInButton from "@/app/components/common/GoogleSignInButton";
import { loginUser } from "@/lib/api/auth/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AxiosError } from "axios";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: CredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

type CredentialResponse = {
  credential?: string;
  select_by?: string;
  clientId?: string;
};

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
      // Detect device/browser info
      const device_name = navigator.userAgent || "web";

      const payload = {
        email,
        password,
        device_name,
      };

      const result = await loginUser(payload);
      // Store in Zustand auth store
      useAuthStore.getState().setAuth(result.token, result.user);

      const hasShop = !!result.hasShop;
      // Store in cookies
      document.cookie = `token=${result.token}; path=/;`;
      document.cookie = `role=${result.user.role}; path=/;`;

      // Redirect based on role
      const role = result.user.role;

      // Redirect logic
      if (role === "customer") {
        router.replace("/account");
        toast.success("Welcome Back");
      } else if (role === "vendor") {
        if (hasShop) {
          toast.success("Welcome Back");
          router.replace("/dashboard");
        } else {
          toast.success("Setup your shop to continue");
          router.replace("/seller-onboarding");
        }
      } else {
        // Fallback (should not happen)
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
      console.error("Authentication failed on the server:", error);

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      {/* Left Column: Image */}
      <div className="relative hidden lg:block h-full w-1/2">
        <Image
          width={1200}
          height={1600}
          src="account-header.jpg"
          alt="A woman in traditional African attire"
          className="w-full h-full object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-gray-50 opacity-10"></div>
      </div>

      {/* Right Column: Form */}
      <div className="flex items-center justify-center bg-gray-50 p-8 sm:p-12 w-full lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div hidden className="mb-8 flex justify-center">
            <Link href="/">
              <Image
                src="/images/logo.svg"
                alt="African Market Hub"
                width={180}
                height={40}
                style={{ height: "40px" }}
                priority
                unoptimized
              />
            </Link>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">
            Log in
          </h1>

          {/* Google Button (Priority) */}
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

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-gray-700">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium  mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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
              <div className="text-right mt-1">
                <Link
                  href="/forget-password"
                  className="text-sm text-red-800 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>
            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full!"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>

            <button
              type="button"
              className="btn btn-gray w-full"
              onClick={() => router.push("/register")}
            >
              Register
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
