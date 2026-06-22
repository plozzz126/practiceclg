import { cn } from "@/lib/utils/cn";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("animate-pulse rounded-[8px] bg-muted/70", className)} {...props} />;
}
