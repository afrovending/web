"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PulseLoader from "react-spinners/PulseLoader";
import { useAuthStore } from "@/store/useAuthStore";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";

interface SellerLayoutProps {
  children: React.ReactNode;
}

export default function SellerLayout({ children }: SellerLayoutProps) {
  const { token, _hasHydrated } = useAuthStore();
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    if (_hasHydrated && !token) {
      router.replace("/login");
    }
  }, [token, _hasHydrated, router]);

  if (!_hasHydrated || !token) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <PulseLoader color="#ff6600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* SIDEBAR (desktop + mobile slide-in) */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-y-auto p-3 md:p-8">{children}</main>
      </div>
    </div>
  );
}
