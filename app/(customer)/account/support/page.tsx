"use client";

import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { FiLifeBuoy } from "react-icons/fi";

export default function CustomerSupportPage() {
  return (
    <>
      <div className="card mb-6">
        <h2 className="text-lg font-semibold flex items-center">
          <FiLifeBuoy className="text-green-800 text-xl mr-2" size={24} />
          Customer Support
        </h2>
        <p className="text-sm mt-1 text-gray-600">
          From your account dashboard, you can easily contact support regarding
          your
          <span className="text-green-800"> Orders or other inquiries </span>
        </p>
      </div>
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
        <section className="mb-10">
          <h2 className="text-lg font-semibold">Contact Support</h2>
          <p className="text-sm text-gray-500 mb-4">
            Receive notifications about the progress of your orders.
          </p>

          <div className="space-y-1">
            <SupportItem label="Live Chat" href="#" />
            <SupportItem label="Email Support" href="#" />
            <SupportItem label="Help Center" href="#" />
          </div>
        </section>

        {/* Orders & Returns */}
        <section>
          <h2 className="text-lg font-semibold">Orders & Returns Help</h2>
          <p className="text-sm text-gray-500 mb-4">
            Receive notifications about the progress of your orders.
          </p>

          <div className="space-y-1">
            <SupportItem label="Order Tracking" href="#" />
            <SupportItem label="Return Instructions" href="#" />
          </div>
        </section>
      </div>
    </>
  );
}

interface SupportItemProps {
  label: string;
  href: string;
}

function SupportItem({ label, href }: SupportItemProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between py-4 border-b border-gray-200 hover:bg-gray-50 transition rounded-lg px-2"
    >
      <span className="text-base">{label}</span>
      <ChevronRightIcon className="h-5 w-5 text-gray-400" />
    </Link>
  );
}
