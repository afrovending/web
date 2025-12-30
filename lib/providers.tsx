"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import router from "next/router";
import { useAuthStore } from "@/store/useAuthStore";
import { ContinueWithGoogle } from "./api/auth/auth";

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

export default function GoogleOneTap() {
  useEffect(() => {
    const handleCredentialResponse = async (response: {
      credential?: string;
    }) => {
      const id_token = response.credential;

      if (!id_token) {
        console.error("Google response missing credential (ID Token).");
        return;
      }
      const payload = {
        id_token: id_token,
        device_name: "Web Browser Login",
      };

      try {
        const result = await ContinueWithGoogle(payload);
        useAuthStore.getState().setAuth(result.token, result.user);
        // Save to cookies (so middleware can read it)
        document.cookie = `token=${result.token}; path=/;`;
        document.cookie = `role=${result.user.role}; path=/;`;

        // Redirect based on role
        const role = result.user.role;

        if (role === "customer") {
          router.push("/account");
        } else if (role === "vendor") {
          router.push("/dashboard");
        } else {
          router.push("/"); // fallback
        }
        toast.success("Welcome Back");
      } catch (error) {
        console.error("Authentication failed on the server:", error);
        toast.error("Login failed. Please try again.");
      }
    };
    const handleLoad = () => {
      if (window.google?.accounts.id) {
        const clientId = process.env.NEXT_GOOGLE_CLIENT_ID;
        if (!clientId) {
          console.error("CLIENT_ID is missing from environment variables.");
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        window.google.accounts.id.prompt();
      } else {
        console.error("Google Identity Services not initialized.");
      }
    };

    window.addEventListener("google-script-loaded", handleLoad);

    return () => {
      window.removeEventListener("google-script-loaded", handleLoad);
    };
  }, []);

  return null;
}
