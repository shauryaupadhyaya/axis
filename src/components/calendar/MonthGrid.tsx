"use client";

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { cn } from "@/lib/cn";

export interface MonthGridEvent {
  id: string;
  date: Date;
  title: string;
  colorClass: string; // e.g. "border-l-carbon" (tailwind border-left color)
  onClick?: () => void;
}

interface MonthGridProps {
  month: Date;
  events: MonthGridEvent[];
  onDayClick?: (day: Date) => void;
  maxEventsPerDay?: number;
}

export function MonthGrid({ month, events, onDayClick, maxEventsPerDay = 3 }: MonthGridProps) {
  const gridStart = startOfWeek(startOfMonth(month));
  const gridEnd = endOfWeek(endOfMonth(month));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="border border-alabaster rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 bg-linen dark:bg-bg-secondary border-b border-alabaster">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-caption text-graphite text-center py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const inMonth = isSameMonth(day, month);
          const today = isToday(day);
          const dayEvents = events.filter((e) => isSameDay(e.date, day));
          const shown = dayEvents.slice(0, maxEventsPerDay);
          const overflow = dayEvents.length - shown.length;

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onDayClick?.(day)}
              className={cn(
                "h-20 border-b border-r border-alabaster p-1.5 text-left align-top flex flex-col gap-0.5 transition-fast hover:bg-bg",
                !inMonth && "opacity-40",
                today && "bg-linen dark:bg-bg-secondary border-2 border-tuscan"
              )}
            >
              <span className="text-caption font-semibold">{format(day, "d")}</span>
              {shown.map((event) => (
                <span
                  key={event.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    event.onClick?.();
                  }}
                  className={cn(
                    "text-[10px] truncate border-l-2 pl-1 leading-tight",
                    event.colorClass
                  )}
                >
                  {event.title}
                </span>
              ))}
              {overflow > 0 && <span className="text-[10px] text-graphite">+{overflow} more</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
