"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightCircleIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { ContinueWithGoogle } from "@/lib/api/auth/auth";
import { useAuthStore } from "@/store/useAuthStore";

interface GoogleUserPayload {
  name: string;
  given_name: string;
  family_name: string;
  sub: string;
  picture: string;
  email: string;
}

const decodeJWT = (token: string): GoogleUserPayload | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload) as GoogleUserPayload;
  } catch (e) {
    console.error("Failed to decode JWT:", e);
    return null;
  }
};

// --- REACT COMPONENT ---
export default function GoogleSignInButton() {
  const router = useRouter();
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredentialResponse = async (response: {
    credential?: string;
    select_by: string;
  }) => {
    const id_token = response.credential;
    if (!id_token) {
      toast.error("Google login failed: Missing token.");
      return;
    }

    const payload = {
      id_token: id_token,
      device_name: navigator.userAgent,
    };

    try {
      const responsePayload = decodeJWT(id_token);
      if (responsePayload) {
      }

      // API Call
      const result = await ContinueWithGoogle(payload);
      useAuthStore.getState().setAuth(result.token, result.user);

      document.cookie = `token=${result.token}; path=/;`;
      document.cookie = `role=${result.user.role}; path=/;`;

      const role = result.user.role;

      if (role === "customer") {
        router.push("/account");
      } else if (role === "vendor") {
        router.push("/dashboard");
      } else {
        // router.push("/");
      }
      toast.success("Welcome Back");
    } catch (error) {
      console.error("Authentication failed on the server:", error);
      toast.error("Login failed. Please try again.");
    }
  };

  useEffect(() => {
    const initializeGsi = () => {
      const googleAccounts = (window as any).google?.accounts;

      if (!googleAccounts?.id) {
        console.error("GSI library object is not available after load.");
        return;
      }

      if (!clientId) {
        console.error("Client ID is missing. Cannot initialize GSI.");
        return;
      }

      // Initialization
      googleAccounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Rendering
      (googleAccounts.id as any).renderButton(
        document.getElementById("g_id_signin") as HTMLElement,
        {
          theme: "outline",
          size: "large",
          width: "300",
          type: "standard",
        }
      );

      setIsSdkLoaded(true);
    };
    if ((window as any).google?.accounts?.id) {
      initializeGsi();
      return;
    }
    window.addEventListener("load", initializeGsi);
    return () => {
      window.removeEventListener("load", initializeGsi);
    };
  }, [clientId, handleCredentialResponse]);

  if (!isSdkLoaded) {
    return (
      <div className="flex items-center justify-center p-4 border border-gray-300 rounded-lg bg-gray-50">
        <ArrowRightCircleIcon className="w-5 h-5 mr-2 text-gray-500 animate-spin" />
        Loading Sign-In services...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6 card">
      {/* <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Sign in to your account
      </h2> */}

      <div id="g_id_signin" className="mb-4"></div>
    </div>
  );
}
