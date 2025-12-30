"use client";

import Link from "next/link";
import { FaEnvelope } from "react-icons/fa";
import { FaFacebook, FaInstagram, FaTiktok, FaXTwitter } from "react-icons/fa6";

import Image from "next/image";
import { COMPANY_CONTACT_INFO } from "@/setting";

export default function Footer() {
  return (
    <footer className="bg-hub-primary/10 text-white py-5">
      <div className="max-w-1xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Logo */}
          <div className="col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Link href={"/"}>
                <Image
                  src="/logo.svg"
                  alt="Afrovending Online Marketplace"
                  className="cursor-pointer"
                  width={140}
                  height={30}
                  priority
                  unoptimized
                />
              </Link>
            </div>
            <span
              className="text-sm line-clamp-4"
              title={COMPANY_CONTACT_INFO.companyDescription}
            >
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
            <Link href="/return-policy">Return & Refund Policy</Link>
          </div>

          {/* FAQ */}
          <div className="flex flex-col gap-2">
            <span className="font-extrabold mb-2 ">Help Center</span>
            <Link href="/faqs">FAQs</Link>
            <Link href="/shipping">Shipping</Link>
            <Link href="/blogs">Tutorials</Link>
          </div>
        </div>

        <div className="mt-8 flex gap-4 justify-end items-center text-xl">
          {/* Facebook */}
          <Link
            href="https://www.facebook.com/theafrovending"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition duration-150 cursor-pointer text-white"
            aria-label="Facebook link"
          >
            <FaFacebook className="w-7 h-7" />
          </Link>

          {/* Instagram */}
          <Link
            href="https://www.instagram.com/afrovending"
            target="_blank"
            rel="noopener"
            className="hover:text-pink-600 transition duration-150 cursor-pointer text-white"
            aria-label="Instagram link"
          >
            <FaInstagram className="w-7 h-7" />
          </Link>

          {/* X (Twitter) */}
          <Link
            href="https://www.x.com/africanmkthub"
            target="_blank"
            rel="noopener"
            className="hover:text-black transition duration-150 cursor-pointer text-white"
            aria-label="Twitter link"
          >
            <FaXTwitter className="w-6 h-6" />
          </Link>

          {/* TikTok */}
          <Link
            href="https://www.tiktok.com/@afrovending"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black transition duration-150 cursor-pointer text-white"
            aria-label="Tiktok link"
          >
            <FaTiktok className="w-6 h-6" />
          </Link>

          {/* Email */}
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `mailto:support@afrovending.com`;
            }}
            className="hover:text-red-500 transition duration-150 cursor-pointer text-white"
            aria-label="Email link"
          >
            <FaEnvelope className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
