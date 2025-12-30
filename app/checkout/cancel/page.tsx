"use client";

import { Suspense } from "react";
import { useRouter  } from "next/navigation";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { ArrowRightIcon } from "@heroicons/react/24/outline"; 
function CancelContent() {
  const router = useRouter(); 

  return (
    <div className="text-center max-w-md mx-auto">
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-green-100 rounded-full scale-150 opacity-20 animate-pulse"></div>
        <CheckCircleIcon className="h-24 w-24 text-green-500 mx-auto relative z-10" />
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Thank you for trying!
      </h1>
      <p className="text-gray-600 mb-8">Your payment was not successful.</p>
 

      <button
        onClick={() => router.push("/items")}
        className="w-full flex items-center justify-center bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all transform hover:scale-105 shadow-lg"
      >
        Go items to order again
        <ArrowRightIcon className="h-5 w-5 ml-2" />
      </button>
    </div>
  );
}

export default function SetupCancelPage() {
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
          <CancelContent />
        </Suspense>
      </div>
    </div>
  );
}
