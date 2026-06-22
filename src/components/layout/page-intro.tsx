import { cn } from "@/lib/utils/cn";

export function PageIntro({
  eyebrow,
  title,
  description,
  className,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-6 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-2xl space-y-3">
        {eyebrow ? (
          <span className="tone-primary-soft inline-flex rounded-[6px] border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {title}
        </h1>
        <p className="text-base leading-7 text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}
