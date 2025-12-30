"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import confetti from "canvas-confetti";
import {
  verifyOnboardingStatus,
  retryOnboardingStatus,
} from "@/lib/api/seller/shop";
import { useAuthStore } from "@/store/useAuthStore";

export default function OnboardingSuccessContent() {
  const router = useRouter();
  const { clearAuth } = useAuthStore();
  // States
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [countdown, setCountdown] = useState(5);
  const [isRetrying, setIsRetrying] = useState(false);

  // Refs to prevent double-calls in dev mode
  const hasVerified = useRef(false);

  const checkStatus = async () => {
    try {
      setStatus("loading");
      const response = await verifyOnboardingStatus();

      if (response.completed) {
        setStatus("success");
        triggerConfetti();
        clearAuth();
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error("Verification failed", err);
      setStatus("error");
    }
  };

  useEffect(() => {
    if (!hasVerified.current) {
      hasVerified.current = true;
      checkStatus();
    }
  }, []);

  // Countdown to Login/Dashboard
  useEffect(() => {
    if (status === "success" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === "success" && countdown === 0) {
      // Redirect to login so they can enter with fresh session data
      router.push("/login?message=onboarding_complete");
    }
  }, [status, countdown, router]);

  const handleRetryOnboarding = async () => {
    setIsRetrying(true);
    try {
      const response = await retryOnboardingStatus();
      if (response.onboarding_url) {
        window.location.href = response.onboarding_url;
      }
    } catch (err) {
      console.error("Retry failed", err);
      setIsRetrying(false);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#ea580c", "#fb923c", "#facc15"],
    });
  };

  if (status === "loading") {
    return (
      <div className="text-center py-10">
        <ArrowPathIcon className="h-12 w-12 text-green-500 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800">
          Verifying Payout Status...
        </h2>
        <p className="text-gray-500">
          Checking with Stripe if your account is ready.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center max-w-md mx-auto py-10">
        <XCircleIcon className="h-20 w-20 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Onboarding Incomplete
        </h2>
        <p className="text-gray-600 mb-8">
          It looks like the Stripe setup wasn't finished. We need your payout
          details before you can start selling.
        </p>
        <button
          onClick={handleRetryOnboarding}
          aria-label="retry button"
          disabled={isRetrying}
          className="cursor-pointer w-full flex items-center justify-center bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50"
        >
          {isRetrying ? "Generating Link..." : "Complete Stripe Setup"}
        </button>
        <button
          onClick={() => router.push("/dashboard")}
          aria-label="dashboard"
          className="cursor-pointer mt-4 text-sm text-gray-500 hover:underline"
        >
          Go to Dashboard anyway
        </button>
      </div>
    );
  }

  return (
    <div className="text-center max-w-md mx-auto py-10">
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-green-100 rounded-full scale-150 opacity-20 animate-pulse"></div>
        <CheckCircleIcon className="h-24 w-24 text-green-500 mx-auto relative z-10" />
      </div>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        Shop Verified!
      </h1>
      <p className="text-gray-600 mb-8">
        Your payout account is linked. You are officially ready to start
        receiving payments.
      </p>

      <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-8">
        <p className="text-sm text-green-800 font-medium">
          Entering your dashboard in {countdown}s...
        </p>
      </div>

      <button
        onClick={() => router.push("/dashboard")}
        className="cursor-pointer w-full flex items-center justify-center bg-gray-900 text-white px-6 py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg"
      >
        Go to Dashboard Now
        <ArrowRightIcon className="h-5 w-5 ml-2" />
      </button>
    </div>
  );
}
