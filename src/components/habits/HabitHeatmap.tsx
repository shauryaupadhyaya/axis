"use client";

import { toISODate } from "@/lib/scores";
import type { HabitCompletion } from "@/lib/types";

/** 52-week completion grid (7 cols x 52 rows), per the spec's habit heatmap. */
export function HabitHeatmap({ completions }: { completions: HabitCompletion[] }) {
  const byDate = new Map(completions.map((c) => [c.completed_at, c.status]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalDays = 52 * 7;
  const start = new Date(today);
  start.setDate(start.getDate() - (totalDays - 1) - today.getDay());

  const weeks: Date[][] = [];
  for (let w = 0; w < 52; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(day.getDate() + w * 7 + d);
      week.push(day);
    }
    weeks.push(week);
  }

  function cellClass(day: Date) {
    const iso = toISODate(day);
    const status = byDate.get(iso);
    const isToday = iso === toISODate(today);
    const base = "w-[10px] h-[10px] rounded-[2px]";
    const color =
      status === "completed"
        ? "bg-success"
        : status === "partial"
          ? "bg-warning/70"
          : "bg-alabaster/40";
    const ring = isToday ? "ring-2 ring-tuscan" : "";
    return `${base} ${color} ${ring}`;
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px] w-fit">
        {weeks.map((week, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {week.map((day) => (
              <div key={day.toISOString()} title={toISODate(day)} className={cellClass(day)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
