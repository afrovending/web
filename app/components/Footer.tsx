"use client";

import Link from "next/link";
import { FaFacebookF, FaEnvelope } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

import Image from "next/image";
import { COMPANY_CONTACT_INFO } from "@/setting";

export default function Footer() {
  return (
    <footer className="bg-red-50 text-red-900 py-5">
      <div className="max-w-1xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Logo */}
          <div className="col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Link href={"/"}>
                <Image
                  src="/images/logo.svg"
                  alt="African Market Hub"
                  className="cursor-pointer"
                  width={140}
                  height={30}
                  priority
                  unoptimized
                />
              </Link>
            </div>
            <span className="text-sm line-clamp-2">
              {COMPANY_CONTACT_INFO.companyDescription}
            </span>
          </div>

          {/* About */}
          <div className="flex flex-col gap-2">
            <span className="font-extrabold mb-2 ">About</span>
            <Link href="/about-us">About Us</Link>
            <Link href="/contact-us">Contact Us</Link>
          </div>

          {/* Privacy */}
          <div className="flex flex-col gap-2">
            <span className="font-extrabold mb-2 ">Privacy</span>
            <Link href="/terms-condition">Terms of Privacy</Link>
            <Link href="/privacy-policy">Privacy Policy</Link>
          </div>

          {/* FAQ */}
          <div className="flex flex-col gap-2">
            <span className="font-extrabold mb-2 ">FAQ</span>
            <Link href="/faqs">FAQs</Link>
            <Link href="/shipping">Shipping</Link>
          </div>
        </div>

        <div className="mt-8 flex gap-4 justify-end text-xl">
          <Link
            href="https://www.facebook.com/ayokah_foods"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition duration-150 cursor-pointer"
            aria-label="Facebook link"
          >
            <FaFacebookF className="w-6 h-6" />
          </Link>

          <Link
            href="https://www.twitter.com/ayokah_foods"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-900 transition duration-150 cursor-pointer"
            aria-label="Twitter link"
          >
            <FaXTwitter className="w-6 h-6" />
          </Link>

          <Link
            href="mailto:support@ayokah.co.ke"
            className="hover:text-red-500 transition duration-150 cursor-pointer"
            aria-label="Email link"
          >
            <FaEnvelope className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
