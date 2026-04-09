"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/state/query-client";
import { CommandPalette } from "@/components/shell/command-palette";
import { ToastViewport } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <CommandPalette />
      <ToastViewport />
    </QueryClientProvider>
  );
}
