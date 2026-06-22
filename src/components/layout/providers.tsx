"use client";

import { Toaster } from "sonner";

import { AuthBootstrap } from "@/components/layout/auth-bootstrap";
import { QueryProvider } from "@/components/layout/query-provider";
import { ThemeBootstrap } from "@/components/layout/theme-bootstrap";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeBootstrap />
      <AuthBootstrap>
        {children}
        <Toaster
          richColors
          position="top-right"
          toastOptions={{
            classNames: {
              toast: "rounded-[8px] border border-border bg-card text-foreground shadow-soft",
            },
          }}
        />
      </AuthBootstrap>
    </QueryProvider>
  );
}
