"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { SidePanel } from "@/components/ui/SidePanel";
import { DatePicker } from "@/components/ui/DatePicker";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import type { CalendarEvent } from "@/lib/calendar";
import {
  deleteCalendarEvent,
  rescheduleCalendarEvent,
  rescheduleTask,
  rescheduleWorkout,
  updateCalendarEvent,
} from "@/app/(app)/calendar/actions";
import { rescheduleHomework } from "@/app/(app)/study/actions";
import type { Homework } from "@/lib/types";

const TYPE_LABEL: Record<CalendarEvent["type"], string> = {
  task: "Task",
  habit: "Habit",
  exam: "Exam",
  workout: "Workout",
  study: "Study session",
  homework: "Homework",
  event: "Event",
  birthday: "Birthday",
};

export function EventDetailPanel({
  event,
  homework,
  onClose,
}: {
  event: CalendarEvent | null;
  homework: Homework[];
  onClose: () => void;
}) {
  const [, startTransition] = useTransition();

  if (!event) return null;

  const isCustom = event.type === "event" || event.type === "birthday";

  function handleDateChange(isoDate: string) {
    if (!event) return;
    if (event.type === "task") startTransition(() => rescheduleTask(event.refId, isoDate));
    if (event.type === "workout") startTransition(() => rescheduleWorkout(event.refId, isoDate));
    if (event.type === "homework") {
      const hw = homework.find((h) => h.id === event.refId);
      if (hw) startTransition(() => rescheduleHomework(hw.subject_id, hw.id, isoDate));
    }
    if (isCustom) startTransition(() => rescheduleCalendarEvent(event.refId, isoDate));
  }

  return (
    <SidePanel
      open={!!event}
      onClose={onClose}
      title={event.title}
      footer={
        isCustom ? (
          <button
            onClick={() => {
              if (confirm("Delete this event? This cannot be undone.")) {
                startTransition(() => deleteCalendarEvent(event.refId));
                onClose();
              }
            }}
            className="text-danger text-small font-semibold flex items-center gap-1.5 hover:opacity-70 transition-fast"
          >
            <Trash2 size={14} /> Delete event
          </button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4">
        <Badge variant="neutral" className="w-fit">
          {TYPE_LABEL[event.type]}
        </Badge>

        {isCustom && (
          <Input
            label="Title"
            defaultValue={event.title}
            onBlur={(e) =>
              e.target.value !== event.title &&
              startTransition(() => updateCalendarEvent(event.refId, { title: e.target.value }))
            }
          />
        )}

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
