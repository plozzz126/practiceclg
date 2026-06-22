import Link from "next/link";

import { cn } from "@/lib/utils/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-3", className)}>
      <span className="tone-primary-soft inline-flex h-10 w-10 items-center justify-center rounded-full border font-display text-sm font-bold shadow-soft">
        D
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-foreground">DevLink</span>
    </Link>
  );
}
