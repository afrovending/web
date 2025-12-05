"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { confirmEmail, confirmResetCode } from "@/lib/api/auth/auth";
import Link from "next/link";
import Image from "next/image";

type ErrorResponse = {
  message?: string;
  status?: string;
  error_detail?: string;
};

export default function ConfirmResetCode() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const savedEmail = sessionStorage.getItem("registerEmail");
    if (savedEmail) {
      setEmail(savedEmail);
    } else {
      router.replace("/register");
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
  const value = e.target.value;

  if (!/^[0-9]?$/.test(value)) return; 

  const newOtp = [...otp];
  newOtp[idx] = value;
  setOtp(newOtp);

  // Move to next input automatically
  if (value && idx < 5) {
    inputsRef.current[idx + 1]?.focus();
  }

  // Update main code state
  setCode(newOtp.join(""));
};

const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
  if (e.key === "Backspace" && !otp[idx] && idx > 0) {
    const prev = idx - 1;
    inputsRef.current[prev]?.focus();

    const newOtp = [...otp];
    newOtp[prev] = "";
    setOtp(newOtp);
    setCode(newOtp.join(""));
  }
};

const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
  const paste = e.clipboardData.getData("text").slice(0, 6).replace(/\D/g, "");

  if (paste.length !== 6) return;

  const newOtp = paste.split("");
  setOtp(newOtp);
  setCode(newOtp.join(""));

  inputsRef.current[5]?.focus();
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const payload = { email, otp: code };
      const result = await confirmEmail(payload);
      toast.success(result.message || "Code confirmed successfully.");
      router.replace("/login");
    } catch (err) {
      const error = err as { response?: { data?: ErrorResponse } };
      const errorDetail =
        error.response?.data?.error_detail ||
        error.response?.data?.message ||
        "Invalid confirmation code";
      toast.error(errorDetail);
    } finally {
      setLoading(false);
    }
  };
  const setInputRef = (index: number) => (el: HTMLInputElement | null) => {
    inputsRef.current[index] = el;
  };


  return (
    <div className="flex min-h-screen">
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
          </div>

          <h1 className="text-2xl font-bold mb-6 text-gray-800">
            Confirm Email
          </h1>

          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm space-y-8 text-gray-800"
          >
            <div>
              <label className="block text-sm font-medium mb-1">
                Enter the 6-digit code sent to your email address
              </label>

              <div className="flex gap-3 justify-between">
                {Array(6)
                  .fill(0)
                  .map((_, idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      ref={(el) => {
                        inputsRef.current[idx] = el;
                      }}
                      value={otp[idx] || ""}
                      onChange={(e) => handleChange(e, idx)}
                      onKeyDown={(e) => handleKeyDown(e, idx)}
                      onPaste={handlePaste}
                      className="w-12 h-12 border border-gray-300 rounded-md text-center text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                  ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <button
                type="submit"
                className={`btn btn-primary w-full ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
                disabled={loading}
              >
                {loading ? "Confirming..." : "Verify code"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
