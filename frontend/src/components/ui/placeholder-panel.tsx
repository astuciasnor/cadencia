import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PlaceholderPanelProps {
  title: string;
  items: string[];
  footer?: ReactNode;
  className?: string;
}

export function PlaceholderPanel({ title, items, footer, className }: PlaceholderPanelProps) {
  return (
    <section
      className={cn(
        "rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.04] px-4 py-4",
        className
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-300">
        {items.map((item) => (
          <li key={item} className="rounded-2xl border border-white/6 bg-slate-950/45 px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
      {footer ? <div className="mt-3 text-sm text-slate-400">{footer}</div> : null}
    </section>
  );
}
