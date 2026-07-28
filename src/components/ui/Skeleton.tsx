import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-alabaster/40 dark:bg-[rgba(207,219,213,0.15)] rounded-md animate-skeleton-pulse",
        className
      )}
      {...props}
    />
  );
}
