import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
  {
    variants: {
      variant: {
        default: "border border-white/10 bg-white/5 text-slate-100",
        success: "border border-emerald-400/25 bg-emerald-500/15 text-emerald-100",
        purple: "border border-violet-400/30 bg-violet-500/20 text-violet-100",
        blue: "border border-blue-400/30 bg-blue-500/20 text-blue-100",
        amber: "border border-amber-400/30 bg-amber-500/20 text-amber-100",
        muted: "border border-white/10 bg-slate-900/70 text-slate-300"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
