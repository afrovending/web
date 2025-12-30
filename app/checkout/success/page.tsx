"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import confetti from "canvas-confetti";
import { verifyStripeSession } from "@/lib/api/customer/checkout";
import { useCart } from "@/context/CartContext";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    const verifyPayment = async () => {
      try {
        const data = await verifyStripeSession(sessionId);
        if (data.status === "paid") {
          setStatus("success");
          clearCart();
          triggerConfetti();
        } else {
          setStatus("error");
        }
      } catch (err) {
        console.error("Verification failed", err);
        setStatus("error");
      }
    };

    verifyPayment();
  }, [sessionId]);

  // Countdown effect for auto-redirect
  useEffect(() => {
    if (status === "success" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === "success" && countdown === 0) {
      router.push("/login?redirect=/account");
    }
  }, [status, countdown, router]);

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#ea580c", "#fb923c"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#ea580c", "#fb923c"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  if (status === "loading") {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">
          Finalizing your order...
        </h2>
        <p className="text-gray-500 mt-2">
          Please wait while we confirm your payment.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center">
        <XCircleIcon className="h-20 w-20 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-6">
          We couldn't verify your payment session. Please check your email for a
          receipt or contact support.
        </p>
        <Link
          href="/items"
          className="text-green-600 font-medium hover:text-green-700 underline"
        >
          Return to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center max-w-md mx-auto">
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-green-100 rounded-full scale-150 opacity-20 animate-pulse"></div>
        <CheckCircleIcon className="h-24 w-24 text-green-500 mx-auto relative z-10" />
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Thank you for your order!
      </h1>
      <p className="text-gray-600 mb-8">Your payment was successful.</p>

      <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-8">
        <p className="text-sm text-green-800 font-medium">
          Redirecting to your account in {countdown}s...
        </p>
      </div>

      <button
        onClick={() => router.push("/account")}
        className="w-full flex items-center justify-center bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all transform hover:scale-105 shadow-lg"
      >
        Go to account now
        <ArrowRightIcon className="h-5 w-5 ml-2" />
      </button>
    </div>
  );
}

export default function SetupSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-8 sm:p-12 border border-gray-100">
        <Suspense
          fallback={
            <div className="h-40 flex items-center justify-center">
              Loading...
            </div>
          }
        >
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  );
}
