import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type ToggleProps = InputHTMLAttributes<HTMLInputElement>;

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, checked, ...props }, ref) => {
    return (
      <label className={cn("relative inline-flex items-center cursor-pointer", className)}>
        <input ref={ref} type="checkbox" checked={checked} className="peer sr-only" {...props} />
        <span
          className={cn(
            "w-11 h-6 rounded-full bg-alabaster transition-fast relative",
            "peer-focus-visible:outline-2 peer-focus-visible:outline-tuscan peer-focus-visible:outline-offset-2",
            checked && "bg-success"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-fast",
              checked && "translate-x-5"
            )}
          />
        </span>
      </label>
    );
  }
);
Toggle.displayName = "Toggle";
