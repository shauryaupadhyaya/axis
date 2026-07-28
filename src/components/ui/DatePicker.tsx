"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { cn } from "@/lib/cn";

interface DatePickerProps {
  value: string | null; // ISO date (YYYY-MM-DD)
  onChange: (isoDate: string) => void;
  label?: string;
}

export function DatePicker({ value, onChange, label }: DatePickerProps) {
  const selected = value ? parseISO(value) : null;
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(selected ?? new Date());

  const gridStart = startOfWeek(startOfMonth(cursor));
  const gridEnd = endOfWeek(endOfMonth(cursor));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="relative inline-block">
      {label && <label className="text-label text-graphite mb-1.5 block">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-body px-3 py-2.5 rounded-lg border border-alabaster bg-linen dark:bg-bg-secondary hover:bg-bg transition-fast text-left w-full"
      >
        {selected ? format(selected, "MMM d, yyyy") : "Select date"}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 p-3 rounded-xl border border-alabaster bg-linen dark:bg-bg-secondary shadow-[0_8px_16px_var(--shadow-color-hover)] w-[280px]">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setCursor((c) => subMonths(c, 1))}
              className="w-7 h-7 rounded-md hover:bg-bg flex items-center justify-center transition-fast"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-h3">{format(cursor, "MMMM yyyy")}</span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setCursor((c) => addMonths(c, 1))}
              className="w-7 h-7 rounded-md hover:bg-bg flex items-center justify-center transition-fast"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="text-caption text-graphite text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const inMonth = isSameMonth(day, cursor);
              const isSelected = selected && isSameDay(day, selected);
              const today = isToday(day);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => {
                    onChange(format(day, "yyyy-MM-dd"));
                    setOpen(false);
                  }}
                  className={cn(
                    "h-8 w-8 rounded-md text-small flex items-center justify-center transition-fast",
                    !inMonth && "opacity-30",
                    today && !isSelected && "border border-tuscan bg-tuscan/20",
                    isSelected && "bg-tuscan text-carbon font-semibold",
                    !isSelected && "hover:bg-bg"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
