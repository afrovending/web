"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { useAuthBootstrap } from "@/hooks/useAuthBootstrap";
export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useAuthBootstrap();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
