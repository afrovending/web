"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useAuthBootstrap } from "@/hooks/useAuthBootstrap";
import Image from "next/image";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);

  useAuthBootstrap();

  if (!_hasHydrated) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-50 z-9999">
        <div className="relative animate-pulse">
          <Image
            src="/logo.svg"
            alt="Afrovending Online Marketplace"
            width={180}
            height={60}
            priority
            className="h-auto w-auto"
          />
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
