"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { ArrowRightIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import confetti from "canvas-confetti";
import { verifySubscriptionCheckout } from "@/lib/api/seller/shop";

export default function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [countdown, setCountdown] = useState(5);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const verificationStarted = useRef(false);

  const verifyPayment = async (id: string) => {
    try {
      setIsRetrying(true);
      const response = await verifySubscriptionCheckout(id);

      if (response.status === "paid" && response.onboarding_url) {
        setOnboardingUrl(response.onboarding_url);
        setStatus("success");
        triggerConfetti();
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error("Verification failed", err);
      setStatus("error");
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    if (sessionId && !verificationStarted.current) {
      verificationStarted.current = true;
      verifyPayment(sessionId);
    } else if (!sessionId) {
      setStatus("error");
    }
  }, [sessionId]);

  useEffect(() => {
    if (status === "success" && onboardingUrl && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === "success" && onboardingUrl && countdown === 0) {
      window.location.href = onboardingUrl;
    }
  }, [status, countdown, onboardingUrl]);

  const triggerConfetti = () => {
    const end = Date.now() + 3000;
    const colors = ["#ea580c", "#fb923c", "#facc15"];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };

  if (status === "loading") {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-hub-primary mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold text-gray-800">
          Finalizing your shop...
        </h2>
        <p className="text-gray-500 mt-2">
          Confirming your subscription with Stripe.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center py-12 px-4">
        <XCircleIcon className="h-20 w-20 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Verification Delayed
        </h2>
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">
          We're having trouble confirming your payment. This can happen if
          Stripe is still processing.
        </p>
        <button
          onClick={() => sessionId && verifyPayment(sessionId)}
          disabled={isRetrying}
          className="flex items-center justify-center space-x-2 mx-auto bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-hub-secondary transition-all disabled:opacity-50"
        >
          {isRetrying ? (
            <ArrowPathIcon className="h-5 w-5 animate-spin" />
          ) : (
            <span>Retry Verification</span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="text-center max-w-lg mx-auto py-8 px-4">
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-green-100 rounded-full scale-150 opacity-20 animate-pulse"></div>
        <CheckCircleIcon className="h-24 w-24 text-green-500 mx-auto relative z-10" />
      </div>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        Payment Successful!
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Your subscription is active. Now, let's set up your payouts.
      </p>

      <div className="bg-green-50 border border-green-100 rounded-2xl p-6 mb-8 text-left">
        <h3 className="text-hub-secondary font-bold mb-1">
          Next Step: Seller Verification
        </h3>
        <p className="text-hub-secondary text-sm leading-relaxed mb-4">
          We are taking you to <strong>Stripe Connect</strong> to verify your
          identity and link your bank account so you can receive payments.
        </p>
        <div className="flex items-center text-hub-secondary font-semibold text-sm">
          <div className="h-2 w-full bg-green-200 rounded-full overflow-hidden mr-3">
            <div
              className="h-full bg-hub-primary transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 5) * 100}%` }}
            ></div>
          </div>
          {countdown}s
        </div>
      </div>

      <button
        onClick={() => {
          if (onboardingUrl) window.location.href = onboardingUrl;
        }}
        className="w-full flex items-center justify-center bg-gray-900 text-white px-6 py-4 rounded-xl font-bold hover:bg-black transition-all transform hover:scale-[1.02] shadow-xl"
      >
        Verify Identity on Stripe
        <ArrowRightIcon className="h-5 w-5 ml-2" />
      </button>

      <p className="mt-6 text-xs text-gray-400 uppercase tracking-widest font-medium">
        Securely powered by Stripe Connect
      </p>
    </div>
  );
}
