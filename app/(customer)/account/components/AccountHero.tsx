"use client";

import Image from "next/image";
import Link from "next/link";

export default function AccountHero() {
  return (
    <div className="relative w-full h-40 md:h-48 lg:h-56">
      <Image
        src="/account-header.jpg"
        alt="Account Header"
        fill
        className="object-cover brightness-28"
        priority
      />

      <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-10 text-white">
        <h1 className="text-2xl md:text-3xl text-white! font-semibold">My Account</h1>

        <div className="text-sm mt-2 opacity-90">
          <Link href="/" className="hover:underline">
            Home
          </Link>{" "}
          /<span className="ml-1">My Account</span>
        </div>
      </div>
    </div>
  );
}
