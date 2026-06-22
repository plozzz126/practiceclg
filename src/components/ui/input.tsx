import * as React from "react";

import { cn } from "@/lib/utils/cn";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-[8px] border border-border bg-muted/70 px-4 py-2 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/60 focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
