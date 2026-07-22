"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ProjectKeyRevealProvider } from "@/components/workspace/project-key-reveal";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }));
  return <QueryClientProvider client={client}><ToastProvider><ProjectKeyRevealProvider>{children}</ProjectKeyRevealProvider></ToastProvider></QueryClientProvider>;
}
