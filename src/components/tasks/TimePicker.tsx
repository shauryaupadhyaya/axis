"use client";

import { cn } from "@/lib/cn";

interface TimePickerProps {
  value: string | null;
  onChange: (time: string | null) => void;
  label?: string;
}

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  return (
    <div className="flex flex-col">
      {label && <label className="text-label text-graphite mb-1.5 block">{label}</label>}
      <input
        type="time"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className={cn(
          "text-body px-3 py-2.5 rounded-lg border border-alabaster bg-linen dark:bg-bg-secondary transition-fast",
          "focus:outline-none focus:border-2 focus:border-tuscan focus:shadow-[0_0_0_3px_rgba(245,203,92,0.1)]"
        )}
      />
    </div>
  );
}
