"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { resetPassword } from "@/lib/api/auth/auth";
import Link from "next/link";
import Image from "next/image";

type ResetErrorResponse = {
  message?: string;
  status?: string;
  error_detail?: string;
};

export default function ResetPassword() {
  const router = useRouter();
  const [new_password, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    const savedEmail = sessionStorage.getItem("resetEmail");
    if (savedEmail) {
      setEmail(savedEmail);
    } else {
      router.replace("/forget-password");
    }
  }, [router]);

  const device_name = navigator.userAgent || "web";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      email,
      new_password,
      device_name: device_name,
    };

    try {
      setLoading(true);
      const result = await resetPassword(payload);

      toast.success(result.message || "Password reset successful");

      sessionStorage.removeItem("resetEmail");
      router.replace("/login");
    } catch (err) {
      const error = err as { response?: { data?: ResetErrorResponse } };

      const errorDetail =
        error.response?.data?.error_detail ||
        error.response?.data?.message ||
        "Password reset failed";

      toast.error(errorDetail);
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
          </div>{" "}
          <h1 className="text-2xl font-bold mb-6 text-gray-800">
            Reset Password
          </h1>
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm space-y-8 text-gray-800"
          >
            {/* Email (readonly) */}
            <div hidden>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full border border-gray-300 rounded-md px-4 py-2 bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={new_password}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="input"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew((prev) => !prev)}
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-700"
                >
                  {showNew ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-primary w-full ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? "Reseting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
