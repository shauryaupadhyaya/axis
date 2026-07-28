import { cn } from "@/lib/cn";

interface ProgressBarProps {
  percent: number;
  color?: "tuscan" | "success";
  className?: string;
}

export function ProgressBar({ percent, color = "tuscan", className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={cn("h-2 rounded bg-alabaster overflow-hidden", className)}>
      <div
        className={cn(
          "h-full rounded transition-[width] duration-300 ease-out",
          color === "success" ? "bg-success" : "bg-tuscan"
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
