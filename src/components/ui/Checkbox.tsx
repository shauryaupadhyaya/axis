import { InputHTMLAttributes, forwardRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

type CheckboxProps = InputHTMLAttributes<HTMLInputElement>;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, ...props }, ref) => {
    return (
      <label className={cn("relative inline-flex items-center justify-center w-[18px] h-[18px] cursor-pointer", className)}>
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          className="peer sr-only"
          {...props}
        />
        <span
          className={cn(
            "w-[18px] h-[18px] rounded border-2 border-alabaster flex items-center justify-center transition-fast",
            "peer-hover:border-graphite peer-focus-visible:outline-2 peer-focus-visible:outline-tuscan peer-focus-visible:outline-offset-2",
            checked && "bg-success border-success"
          )}
        >
          {checked && <Check size={12} strokeWidth={3} className="text-white" />}
        </span>
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";
