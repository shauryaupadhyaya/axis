"use client";

import { useEffect, useState } from "react";

interface ProgressRingProps {
  percent: number; // 0-100
  size?: number;
  label?: string;
}

export function ProgressRing({ percent, size = 60, label }: ProgressRingProps) {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const clamped = Math.max(0, Math.min(100, percent));
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--tuscan-sun)"
          strokeOpacity={0.15}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--tuscan-sun)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={
            reduced
              ? undefined
              : { transition: "stroke-dashoffset 600ms ease-out" }
          }
        />
      </svg>
      <span className="absolute text-display" style={{ fontSize: size * 0.4 }}>
        {label ?? `${Math.round(clamped)}%`}
      </span>
    </div>
  );
}
