"use client";

import { MainHeader } from "@/components/layout/main-header";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { routes } from "@/constants/routes";
import { cn } from "@/lib/utils/cn";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = pathname === routes.home || pathname === routes.login || pathname === routes.register;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 surface-grid" />
      <ThemeToggle />
      <MainHeader hidden={hideChrome} />
      <main className={cn("relative min-h-screen", !hideChrome && "pb-24 md:pb-0 md:pl-[248px]")}>
        {children}
      </main>
    </div>
  );
}
