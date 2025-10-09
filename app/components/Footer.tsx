"use client";

import Link from "next/link";
import {
  GlobeAltIcon,
  PhotoIcon,
  ChatBubbleOvalLeftEllipsisIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
export default function Footer() {
  return (
    <footer className="bg-red-700 text-white py-10">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Logo */}
          <div className="col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/images/logo.svg"
                alt="African Market Hub"
                className=""
                width={120}
                height={120}
              /> 
            </div>
            <span className="text-sm text-white">
              Your No 1 African marketplace online platform.
            </span>
          </div>

          {/* About */}
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold mb-2 text-black">About</h3>
            <Link href="#">About Us</Link> 
            <Link href="#">Contact Us</Link>
          </div> 

          {/* Privacy */}
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold mb-2 text-black">Privacy</h3>
            <Link href="#">Terms of Privacy</Link>
            <Link href="#">Privacy Policy</Link> 
          </div>

          {/* FAQ */}
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold mb-2 text-black">FAQ</h3>
            <Link href="#">FAQs</Link>
            <Link href="#">Blog</Link>
          </div>

          {/* Download */}
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold mb-2 text-black">Download</h3>
            <Link href="#">Download on Play Store</Link>
            <Link href="#">Download on App Store</Link>
          </div>
        </div>

        {/* Social Icons */}
        <div className="mt-8 flex gap-4 justify-end text-xl">
          <Link href="#" className="hover:text-gray-300">
            <GlobeAltIcon className="w-6 h-6" />
          </Link>
          <Link href="#" className="hover:text-gray-300">
            <PhotoIcon className="w-6 h-6" />
          </Link>
          <Link href="#" className="hover:text-gray-300">
            <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
