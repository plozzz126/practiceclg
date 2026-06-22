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
        "flex min-h-72 flex-col items-center justify-center rounded-[8px] border border-dashed border-border bg-card/60 px-6 text-center",
        className,
      )}
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <SearchSlash className="h-6 w-6" />}
      </div>
      <h3 className="font-display text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
