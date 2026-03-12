import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 md:flex-row md:items-start md:justify-between", className)}>
      <div className="min-w-0">
        <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.22em] text-slate-500">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-white md:text-2xl">{title}</h2>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{description}</p> : null}
      </div>

      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
