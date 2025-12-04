"use client";

import Image from "next/image";
import Link from "next/link";
import CartDropdown from "./common/CartDropdown";
import DesktopSearch from "./common/DesktopSearch";
import HeaderActions from "./common/HeaderActions";
import MobileSearch from "./common/MobileSearch";

export default function TopHeader() {
  return (
    <header className="relative w-full border-b bg-red-50 px-4 sm:px-6 py-3 flex items-center justify-between text-gray-500">
      {/* Logo */}
      <div className="shrink-0">
        <Link href="/">
          <Image
            src="/images/logo.svg"
            alt="African Market Hub"
            width={150}
            height={40}
            priority
            unoptimized
          />
        </Link>
      </div>

      {/* Search (Desktop) */}
      <DesktopSearch />

      {/* Right Section */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search (Mobile) */}
        <MobileSearch />

        <HeaderActions />

        <CartDropdown />
      </div>
    </header>
  );
}
