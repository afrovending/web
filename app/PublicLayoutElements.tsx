"use client";

import { useAuthStore } from "@/store/useAuthStore";
import TopHeader from "./components/TopHeader";
import NavBar from "./components/NavBar";

export default function PublicLayoutElements() {
  const { user, _hasHydrated } = useAuthStore();

  const isVendorAuthenticated = user && user.role === "vendor";
  if (isVendorAuthenticated) {
    return null;
  }

  if (!_hasHydrated) {
    return (
      <div className="w-full bg-green-50" style={{ height: "110px" }}></div>
    );
  }

  return (
    <>
      <TopHeader />
      <NavBar />
    </>
  );
}
