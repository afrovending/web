"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FaSkullCrossbones, FaArrowLeft, FaRedo } from "react-icons/fa";
import toast from "react-hot-toast";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const handleReport = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/report-error`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: error.message,
              stack: error.stack,
              digest: error.digest,
              url:
                typeof window !== "undefined"
                  ? window.location.href
                  : "Unknown",
              timestamp: new Date().toISOString(),
            }),
          }
        );

        if (response.ok) {
          toast.success("Report sent to the support team");
        } else {
          toast.success("Failed to send report");
        }
      } catch (err) {
        console.warn("Report Failed", err);
      }
    };

    handleReport();
  }, [error]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 via-white to-gray-100 px-6">
      <div className="bg-white shadow-xl rounded-3xl p-10 max-w-md w-full text-center animate-fadeIn">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-6 rounded-full">
            <FaSkullCrossbones className="text-red-600" size={60} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Something went wrong!
        </h1>
        <p className="text-gray-600 leading-relaxed mb-8">
          An unexpected error occurred. Our team has been notified.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 btn btn-primary"
          >
            <FaRedo size={16} /> Try Again
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 btn btn-gray"
          >
            <FaArrowLeft size={16} /> Back to Safety
          </Link>
        </div>
      </div>
    </div>
  );
}
