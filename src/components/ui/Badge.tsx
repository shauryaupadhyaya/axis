import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "success" | "warning" | "danger" | "neutral" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  success: "bg-success text-white",
  warning: "bg-warning text-white",
  danger: "bg-danger text-white",
  neutral: "bg-alabaster text-graphite",
  info: "bg-info text-white",
};

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-md text-[11px] font-semibold uppercase",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
