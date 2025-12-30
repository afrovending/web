"use client";

import { useRouter } from "next/navigation";
import { FaExclamationTriangle, FaArrowLeft } from "react-icons/fa";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 via-white to-gray-100 px-6">
      <div className="bg-white shadow-xl rounded-3xl p-10 max-w-md w-full text-center animate-fadeIn">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-6 rounded-full">
            <FaExclamationTriangle className="text-green-600" size={60} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Page Not Found
        </h1>

        <p className="text-gray-600 leading-relaxed mb-8">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 btn btn-primary cursor-pointer"
          >
            <FaArrowLeft size={16} />
            Go to Previous Page
          </button>
        </div>
      </div>
    </div>
  );
}
