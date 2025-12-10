"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export function useAuthBootstrap() {
  const { token, user, _hasHydrated, setAuth, clearAuth } = useAuthStore();

  const ranRef = useRef(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) return;
    if (ranRef.current) return;

    ranRef.current = true;

    const checkAuth = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/user`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (!res.ok) throw new Error("Unauthorized");

        const json = await res.json();

        // ✅ Trust server, not storage
        setAuth(token, json.data);
      } catch (err) {
        // 🚨 Token lies → full reset
        clearAuth();
      }
    };

    checkAuth();
  }, [_hasHydrated, token, user, setAuth, clearAuth]);
}
