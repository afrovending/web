"use client";

import Link from "next/link";
import Image from "next/image"; 
import GoogleSignInButton from "@/app/components/common/GoogleSignInButton";

 
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: CredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

type CredentialResponse = {
  credential?: string;
  select_by?: string;
  clientId?: string;
};

export default function LoginPage() {
  return (
    <div className="flex">
      <div className="relative hidden lg:block h-full">
        <Image
          width={1200}
          height={1600}
          src="account-header.jpg"
          alt="A woman in traditional African attire"
          className="w-full h-full object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-gray-50 opacity-10"></div>
      </div>
      {/* Right Column: Form (Full width on small screens) */}
      <div className="flex items-center justify-center bg-red-50 p-8 sm:p-12 w-full">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Link href="/">
              <Image
                src="/images/logo.svg"
                alt="African Market Hub"
                width={180}
                height={40}
                style={{ height: "40px" }}
                priority
                unoptimized
              />
            </Link>
          </div>

          <h1
            hidden
            className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center"
          >
            Log in
          </h1>

          {/* Separator */}
          <div className="my-6 flex items-center justify-center">
            <div className="grow border-t border-gray-300"></div>
            <span className="mx-4 text-sm text-gray-500"> continue with</span>
            <div className="grow border-t border-gray-300"></div>
          </div>

          {/* Google Button */}
          <div>
            <GoogleSignInButton />
          </div>
        </div>
      </div>
    </div>
  );
}
