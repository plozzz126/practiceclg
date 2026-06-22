import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-[6px] border px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "tone-primary-soft",
        secondary: "border-border bg-muted text-muted-foreground",
        outline: "border-border bg-transparent text-foreground/80",
        warning: "tone-warning-soft",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
