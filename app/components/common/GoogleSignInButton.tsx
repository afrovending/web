"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/useAuthStore";
import { ContinueWithGoogle } from "@/lib/api/auth/auth";
import AppleSignInButton from "./AppleSignInButton";

export default function GoogleSignInButton() {
  const router = useRouter();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredentialResponse = useCallback(
    async (response: any) => {
      const idToken = response.credential;
      if (!idToken) return toast.error("Google login failed: Missing token.");

      const payload = {
        id_token: idToken,
        device_name:
          typeof window !== "undefined" ? navigator.userAgent : "unknown",
      };

      try {
        const result = await ContinueWithGoogle(payload);

        // Sync Zustand Store
        useAuthStore.getState().setAuth(result.token, result.user);

        // Set Cookies
        const cookieSettings = "path=/; SameSite=Lax; Secure";
        document.cookie = `token=${result.token}; ${cookieSettings}`;
        document.cookie = `role=${result.user.role}; ${cookieSettings}`;

        toast.success("Welcome Back");

        // Redirect based on role
        const redirectPath =
          result.user.role === "vendor" ? "/dashboard" : "/account";
        router.push(redirectPath);
      } catch (error) {
        console.error("Auth Error:", error);
        toast.error("Login failed. Please try again.");
      }
    },
    [router]
  );

  const initializeGsi = useCallback(() => {
    const google = (window as any).google;
    if (!google?.accounts?.id || !clientId) return;

    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
      ux_mode: "popup",
      use_fedcm_for_prompt: false, // Prevents FedCM Abort errors
      itp_support: true,
    });

    // Optional: Renders the hidden real button for prompt logic
    google.accounts.id.renderButton(
      document.getElementById("google-hidden-anchor"),
      { theme: "outline", size: "large", type: "standard" }
    );
  }, [clientId, handleCredentialResponse]);

  const handleCustomClick = () => {
    const google = (window as any).google;
    if (google?.accounts?.id) {
      google.accounts.id.prompt(); // Triggers the native Google overlay
    } else {
      toast.error("Google Sign-In is still loading...");
    }
  };

  return (
    <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 gap-4">
      {/* Smart Script Loading */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGsi}
      />

      {/* Hidden anchor needed for some browser security contexts */}
      <div id="google-hidden-anchor" style={{ display: "none" }}></div>

      <button
        onClick={handleCustomClick}
        className="cursor-pointer flex items-center justify-center w-72 h-11 bg-white border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-all shadow-sm active:scale-95"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <AppleSignInButton />
    </div>
  );
}

// Extracted Icon for cleanliness
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
    />
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </svg>
);
