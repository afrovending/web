"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const SuccessContent = dynamic(
  () => import("../components/SetupSuccessContent"),
  { ssr: false }
);

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
