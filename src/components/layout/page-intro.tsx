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
          <span className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
          {title}
        </h1>
        <p className="text-base leading-7 text-slate-600 md:text-lg">{description}</p>
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}
