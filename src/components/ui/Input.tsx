import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, required, id, className, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col">
        {label && (
          <label htmlFor={inputId} className="text-label text-graphite mb-1.5">
            {label}
            {required && <span className="text-danger"> *</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "text-body px-3 py-2.5 rounded-lg border bg-linen dark:bg-bg-secondary transition-fast",
            "placeholder:text-graphite placeholder:opacity-50",
            "focus:outline-none focus:border-2 focus:border-tuscan focus:shadow-[0_0_0_3px_rgba(245,203,92,0.1)]",
            error
              ? "border-l-2 border-l-danger bg-[rgba(239,68,68,0.05)]"
              : "border-alabaster",
            className
          )}
          {...props}
        />
        {error && <p className="text-[12px] text-danger mt-1.5">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
