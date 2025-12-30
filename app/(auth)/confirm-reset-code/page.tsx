"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import { confirmResetCode, forgetPassword } from "@/lib/api/auth/auth"; // Added resend import

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
  const [resending, setResending] = useState(false); // State for resend button loading

  // Countdown state (in seconds)
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    const savedEmail = sessionStorage.getItem("resetEmail");
    if (savedEmail) {
      setEmail(savedEmail);
    } else {
      router.replace("/forget-password");
    }
  }, [router]);

  const handleResend = async () => {
    if (!canResend || resending) return;

    try {
      setResending(true);
      const result = await forgetPassword({ email }); // Assuming payload takes email
      toast.success(result.message || "OTP resent successfully.");

      // Reset timer
      setTimer(60);
      setCanResend(false);
    } catch (err) {
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    const value = e.target.value;
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[idx] = value;
    setOtp(newOtp);

    if (value && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
    setCode(newOtp.join(""));
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
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
    const paste = e.clipboardData
      .getData("text")
      .slice(0, 6)
      .replace(/\D/g, "");
    if (paste.length !== 6) return;
    const newOtp = paste.split("");
    setOtp(newOtp);
    setCode(newOtp.join(""));
    inputsRef.current[5]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      toast.error("Please enter the full 6-digit code");
      return;
    }

    try {
      setLoading(true);
      const payload = { email, otp: code };
      const result = await confirmResetCode(payload);
      toast.success(result.message || "Code confirmed successfully.");
      router.replace("/reset-password");
    } catch (err) {
      const error = err as { response?: { data?: ErrorResponse } };
      const errorDetail =
        error.response?.data?.error_detail ||
        error.response?.data?.message ||
        "Invalid reset code";
      toast.error(errorDetail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <div className="relative hidden lg:block h-full w-1/2">
        <Image
          width={1200}
          height={1600}
          src="/account-header.jpg"
          alt="African Market"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gray-50 opacity-10"></div>
      </div>

      <div className="flex items-center justify-center bg-gray-50 p-8 sm:p-12 w-full lg:w-1/2">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold mb-2 text-gray-800">
            Confirm Reset Code
          </h1>
          <p className="text-gray-600 mb-6 text-sm">
            We sent a code to <span className="font-semibold">{email}</span>
          </p>

          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm space-y-8 text-gray-800"
          >
            <div>
              <div className="flex gap-3 justify-between mb-6">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    inputMode="numeric"
                    ref={(el) => {
                      inputsRef.current[idx] = el;
                    }}
                    value={digit}
                    onChange={(e) => handleChange(e, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    onPaste={handlePaste}
                    className="w-12 h-12 border border-gray-300 rounded-lg text-center text-xl font-bold focus:ring-2 focus:ring-hub-primary outline-none bg-white text-black"
                  />
                ))}
              </div>

              <div className="text-center text-sm">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-green-800 font-bold hover:underline cursor-pointer disabled:opacity-50"
                    disabled={resending}
                  >
                    {resending ? "Resending..." : "Resend code"}
                  </button>
                ) : (
                  <p className="text-gray-500">
                    Resend code in{" "}
                    <span className="font-bold">
                      0:{timer.toString().padStart(2, "0")}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-primary w-full py-3 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={loading || code.length < 6}
            >
              {loading ? "Confirming..." : "Verify code"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
