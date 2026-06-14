import Link from "next/link";

import { cn } from "@/lib/utils/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-3", className)}>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-amber-400 font-display text-lg font-bold text-white shadow-soft">
        E
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-slate-950">EduMatch</span>
    </Link>
  );
}
