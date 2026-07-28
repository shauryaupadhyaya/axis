import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "icon" | "fab";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  // Dark mode: a near-black button would nearly vanish against the near-black
  // page background, so it swaps to the tuscan accent (always high-contrast
  // per the design system's own "accent works on both grounds" rule).
  primary:
    "bg-carbon text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-graphite active:bg-tuscan active:text-carbon disabled:opacity-50 disabled:cursor-not-allowed dark:bg-tuscan dark:text-carbon dark:hover:opacity-90 dark:active:opacity-100",
  secondary:
    "border border-graphite bg-transparent text-text px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-linen disabled:opacity-50 disabled:cursor-not-allowed",
  icon: "w-9 h-9 rounded-md border border-alabaster bg-transparent flex items-center justify-center hover:bg-linen disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:w-[18px] [&_svg]:h-[18px] [&_svg]:text-text",
  fab: "w-12 h-12 md:w-14 md:h-14 rounded-full bg-tuscan flex items-center justify-center shadow-[0_4px_12px_rgba(245,203,92,0.3)] hover:shadow-[0_8px_20px_rgba(245,203,92,0.4)] [&_svg]:w-6 [&_svg]:h-6 [&_svg]:text-white",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "transition-fast focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-tuscan",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
