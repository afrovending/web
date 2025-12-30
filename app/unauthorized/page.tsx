"use client";

import Link from "next/link";
import { FaShieldAlt, FaArrowLeft } from "react-icons/fa";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 via-white to-gray-100 px-6">
      <div className="bg-white shadow-xl rounded-3xl p-10 max-w-md w-full text-center animate-fadeIn">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-6 rounded-full">
            <FaShieldAlt className="text-green-600" size={60} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-4">Access Denied</h1>

        <p className="text-gray-600 leading-relaxed mb-8">
          You don't have permission to view this page.
          <br />
          Please make sure you're logged in with the correct role.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 btn btn-primary"
          >
            <FaArrowLeft size={16} />
            Go Back Home
          </Link>

          <Link href="/login" className="btn btn-gray">
            Login with another account
          </Link>
        </div>
      </div>
    </div>
  );
}
