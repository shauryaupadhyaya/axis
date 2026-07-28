"use client";

import { format, isSameDay, isWithinInterval, startOfDay, endOfWeek } from "date-fns";
import { cn } from "@/lib/cn";
import type { CalendarEvent } from "@/lib/calendar";

export function AgendaList({ events, onEventClick }: { events: CalendarEvent[]; onEventClick: (e: CalendarEvent) => void }) {
  const today = startOfDay(new Date());
  const weekEnd = endOfWeek(today);

  const sorted = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());
  const todayEvents = sorted.filter((e) => isSameDay(e.date, today));
  const thisWeekEvents = sorted.filter(
    (e) => !isSameDay(e.date, today) && isWithinInterval(e.date, { start: today, end: weekEnd })
  );
  const laterEvents = sorted.filter((e) => e.date > weekEnd);

  const sections = [
    { label: "Today", items: todayEvents },
    { label: "This Week", items: thisWeekEvents },
    { label: "Later", items: laterEvents },
  ];

  return (
    <div className="flex flex-col gap-6">
      {sections.map(
        (section) =>
          section.items.length > 0 && (
            <div key={section.label}>
              <h3 className="text-label text-graphite mb-2">{section.label}</h3>
              <div className="border border-alabaster rounded-xl divide-y divide-alabaster">
                {section.items.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-bg transition-fast"
                  >
                    <span className="text-mono text-graphite w-16 shrink-0">{format(event.date, "MMM d")}</span>
                    <span className="flex-1 text-body truncate">{event.title}</span>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded uppercase font-semibold", event.chipClass)}>
                      {event.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
      )}
      {events.length === 0 && <p className="text-small text-graphite py-8 text-center">Nothing scheduled</p>}
    </div>
  );
}
