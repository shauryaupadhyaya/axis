"use client";

import { useTransition } from "react";
import { SidePanel } from "@/components/ui/SidePanel";
import { DatePicker } from "@/components/ui/DatePicker";
import { Badge } from "@/components/ui/Badge";
import type { CalendarEvent } from "@/lib/calendar";
import { rescheduleTask, rescheduleWorkout } from "@/app/(app)/calendar/actions";

const TYPE_LABEL: Record<CalendarEvent["type"], string> = {
  task: "Task",
  habit: "Habit",
  exam: "Exam",
  workout: "Workout",
  study: "Study session",
};

export function EventDetailPanel({ event, onClose }: { event: CalendarEvent | null; onClose: () => void }) {
  const [, startTransition] = useTransition();

  if (!event) return null;

  function handleDateChange(isoDate: string) {
    if (!event) return;
    if (event.type === "task") startTransition(() => rescheduleTask(event.refId, isoDate));
    if (event.type === "workout") startTransition(() => rescheduleWorkout(event.refId, isoDate));
  }

  return (
    <SidePanel open={!!event} onClose={onClose} title={event.title}>
      <div className="flex flex-col gap-4">
        <Badge variant="neutral" className="w-fit">
          {TYPE_LABEL[event.type]}
        </Badge>

        {event.reschedulable ? (
          <DatePicker
            label="Date"
            value={event.date.toISOString().slice(0, 10)}
            onChange={handleDateChange}
          />
        ) : (
          <div>
            <label className="text-label text-graphite mb-1.5 block">Date</label>
            <p className="text-body">
              {event.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <p className="text-caption text-graphite mt-1">
              {event.type === "exam"
                ? "Exam dates are fixed and can't be dragged from the calendar."
                : "Logged sessions reflect when they happened, so they aren't reschedulable."}
            </p>
          </div>
        )}
      </div>
    </SidePanel>
  );
}
