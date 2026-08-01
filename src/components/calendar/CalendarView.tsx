"use client";

import { useMemo, useState, useTransition } from "react";
import { addMonths, format, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { WeekGrid } from "@/components/calendar/WeekGrid";
import { AgendaList } from "@/components/calendar/AgendaList";
import { EventDetailPanel } from "@/components/calendar/EventDetailPanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { DatePicker } from "@/components/ui/DatePicker";
import { buildCalendarEvents, type CalendarEvent } from "@/lib/calendar";
import type {
  CalendarEventKind,
  CalendarEventRow,
  Exam,
  Habit,
  HabitCompletion,
  Homework,
  StudySession,
  Subject,
  Task,
  Workout,
} from "@/lib/types";
import {
  createCalendarEvent,
  rescheduleCalendarEvent,
  rescheduleTask,
  rescheduleWorkout,
} from "@/app/(app)/calendar/actions";
import { rescheduleHomework } from "@/app/(app)/study/actions";

type View = "day" | "week" | "month" | "agenda";

interface CalendarViewProps {
  tasks: Task[];
  workouts: Workout[];
  exams: Exam[];
  subjects: Subject[];
  studySessions: StudySession[];
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  homework: Homework[];
  calendarEvents: CalendarEventRow[];
}

export function CalendarView({
  tasks,
  workouts,
  exams,
  subjects,
  studySessions,
  habits,
  habitCompletions,
  homework,
  calendarEvents,
}: CalendarViewProps) {
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState<string | null>(null);
  const [newType, setNewType] = useState<CalendarEventKind>("event");
  const [, startTransition] = useTransition();

  const events = useMemo(
    () =>
      buildCalendarEvents({
        tasks,
        workouts,
        exams,
        subjects,
        studySessions,
        habits,
        habitCompletions,
        homework,
        calendarEvents,
      }),
    [tasks, workouts, exams, subjects, studySessions, habits, habitCompletions, homework, calendarEvents]
  );

  function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;
    startTransition(async () => {
      await createCalendarEvent(newTitle, newDate, newType, null);
    });
    setNewTitle("");
    setNewDate(null);
    setNewType("event");
    setAddOpen(false);
  }

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
    if (event.type === "homework") {
      const hw = homework.find((h) => h.id === event.refId);
      if (hw) startTransition(() => rescheduleHomework(hw.subject_id, hw.id, isoDate));
    }
    if (event.type === "event" || event.type === "birthday") {
      startTransition(() => rescheduleCalendarEvent(event.refId, isoDate));
    }
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

        <div className="flex items-center gap-2">
          {(view === "month" || view === "week" || view === "day") && (
            <>
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
            </>
          )}
          <Button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5">
            <Plus size={16} /> New event
          </Button>
        </div>
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="New event"
        footer={
          <Button type="submit" form="new-event-form" className="w-full">
            Create
          </Button>
        }
      >
        <form id="new-event-form" onSubmit={handleAddEvent} className="flex flex-col gap-4">
          <div className="flex gap-1 border border-alabaster rounded-lg p-1 w-fit">
            {(["event", "birthday"] as CalendarEventKind[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setNewType(t)}
                className={`px-3 py-1.5 rounded-md text-small capitalize transition-fast ${
                  newType === t ? "bg-carbon text-white dark:bg-tuscan dark:text-carbon" : "hover:bg-bg"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <Input
            autoFocus
            label="Title"
            placeholder={newType === "birthday" ? "e.g. Mom's birthday" : "e.g. Dentist appointment"}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <DatePicker label="Date" value={newDate} onChange={setNewDate} />
        </form>
      </Modal>

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

      <EventDetailPanel event={selectedEvent} homework={homework} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}
