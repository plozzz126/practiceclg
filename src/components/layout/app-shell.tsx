import { MainFooter } from "@/components/layout/main-footer";
import { MainHeader } from "@/components/layout/main-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-hero-radial" />
      <div className="pointer-events-none absolute inset-0 bg-hero-grid bg-[size:48px_48px] opacity-40" />
      <div className="relative flex min-h-screen flex-col">
        <MainHeader />
        <main className="flex-1">{children}</main>
        <MainFooter />
      </div>
    </div>
  );
}
