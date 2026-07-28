import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "standard" | "focus" | "lightweight";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  standard:
    "bg-linen dark:bg-bg-secondary border border-alabaster rounded-xl p-5 shadow-[0_2px_8px_var(--shadow-color)] hover:shadow-[0_8px_16px_var(--shadow-color-hover)] hover:-translate-y-0.5 transition-fast",
  focus: "border-2 border-tuscan rounded-xl p-6 shadow-[0_4px_12px_rgba(245,203,92,0.15)] bg-gradient-to-br from-linen to-[rgba(245,203,92,0.1)]",
  lightweight: "border border-alabaster rounded-[10px] p-4 bg-transparent",
};

export function Card({ variant = "standard", className, ...props }: CardProps) {
  return <div className={cn(variantClasses[variant], className)} {...props} />;
}
