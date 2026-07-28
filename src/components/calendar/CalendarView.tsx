"use client";

import { useMemo, useState, useTransition } from "react";
import { addMonths, format, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { WeekGrid } from "@/components/calendar/WeekGrid";
import { AgendaList } from "@/components/calendar/AgendaList";
import { EventDetailPanel } from "@/components/calendar/EventDetailPanel";
import { buildCalendarEvents, type CalendarEvent } from "@/lib/calendar";
import type { Exam, Habit, HabitCompletion, StudySession, Task, Workout } from "@/lib/types";
import { rescheduleTask, rescheduleWorkout } from "@/app/(app)/calendar/actions";

type View = "day" | "week" | "month" | "agenda";

interface CalendarViewProps {
  tasks: Task[];
  workouts: Workout[];
  exams: Exam[];
  studySessions: StudySession[];
  habits: Habit[];
  habitCompletions: HabitCompletion[];
}

export function CalendarView({ tasks, workouts, exams, studySessions, habits, habitCompletions }: CalendarViewProps) {
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [, startTransition] = useTransition();

  const events = useMemo(
    () => buildCalendarEvents({ tasks, workouts, exams, studySessions, habits, habitCompletions }),
    [tasks, workouts, exams, studySessions, habits, habitCompletions]
  );

  const monthGridEvents = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        date: e.date,
        title: e.title,
        colorClass: e.colorClass,
        onClick: () => setSelectedEvent(e),
      })),
    [events]
  );

  function findEvent(refId: string) {
    return events.find((e) => e.refId === refId && e.reschedulable);
  }

  function handleReschedule(eventRefId: string, isoDate: string) {
    const event = findEvent(eventRefId);
    if (!event) return;
    if (event.type === "task") startTransition(() => rescheduleTask(event.refId, isoDate));
    if (event.type === "workout") startTransition(() => rescheduleWorkout(event.refId, isoDate));
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-1 border border-alabaster rounded-lg p-1">
          {(["day", "week", "month", "agenda"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-small capitalize transition-fast ${
                view === v ? "bg-carbon text-white dark:bg-tuscan dark:text-carbon" : "hover:bg-bg"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {(view === "month" || view === "week" || view === "day") && (
          <div className="flex items-center gap-2">
            <button
              aria-label="Previous"
              onClick={() => setCursor((c) => subMonths(c, 1))}
              className="w-8 h-8 rounded-md border border-alabaster hover:bg-bg flex items-center justify-center transition-fast"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-h3 min-w-[140px] text-center">{format(cursor, "MMMM yyyy")}</span>
            <button
              aria-label="Next"
              onClick={() => setCursor((c) => addMonths(c, 1))}
              className="w-8 h-8 rounded-md border border-alabaster hover:bg-bg flex items-center justify-center transition-fast"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {view === "month" && <MonthGrid month={cursor} events={monthGridEvents} />}

      {(view === "week" || view === "day") && (
        <WeekGrid
          weekOf={cursor}
          events={events}
          onEventClick={setSelectedEvent}
          onReschedule={handleReschedule}
          singleDay={view === "day"}
        />
      )}

      {view === "agenda" && <AgendaList events={events} onEventClick={setSelectedEvent} />}

      <EventDetailPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}
