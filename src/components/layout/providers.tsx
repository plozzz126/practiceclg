"use client";

import { Toaster } from "sonner";

import { AuthBootstrap } from "@/components/layout/auth-bootstrap";
import { QueryProvider } from "@/components/layout/query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthBootstrap>
        {children}
        <Toaster
          richColors
          position="top-right"
          toastOptions={{
            classNames: {
              toast: "rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-soft",
            },
          }}
        />
      </AuthBootstrap>
    </QueryProvider>
  );
}
