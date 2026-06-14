import { SearchSlash } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export function EmptyState({
  title,
  description,
  icon,
  className,
  action,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-72 flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300/80 bg-white/60 px-6 text-center",
        className,
      )}
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        {icon ?? <SearchSlash className="h-6 w-6" />}
      </div>
      <h3 className="font-display text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
