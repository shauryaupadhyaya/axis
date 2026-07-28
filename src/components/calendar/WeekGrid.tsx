"use client";

import { DndContext, DragEndEvent, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { eachDayOfInterval, endOfWeek, format, isSameDay, isToday, startOfWeek } from "date-fns";
import { cn } from "@/lib/cn";
import type { CalendarEvent } from "@/lib/calendar";

interface WeekGridProps {
  weekOf: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onReschedule: (eventId: string, isoDate: string) => void;
  singleDay?: boolean;
}

/**
 * Day-level reschedule grid. Tasks/workouts only carry a due DATE (no time-of-day
 * input exists yet in the detail panels), so drag targets are day columns rather
 * than hour slots — dragging changes which day an item falls on.
 */
export function WeekGrid({ weekOf, events, onEventClick, onReschedule, singleDay }: WeekGridProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const start = startOfWeek(weekOf);
  const end = endOfWeek(weekOf);
  const allDays = eachDayOfInterval({ start, end });
  const days = singleDay ? [weekOf] : allDays;

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    onReschedule(String(active.id), String(over.id));
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className={cn("grid gap-2", singleDay ? "grid-cols-1" : "grid-cols-7")}>
        {days.map((day) => (
          <DayColumn
            key={day.toISOString()}
            day={day}
            events={events.filter((e) => isSameDay(e.date, day))}
            onEventClick={onEventClick}
          />
        ))}
      </div>
    </DndContext>
  );
}

function DayColumn({
  day,
  events,
  onEventClick,
}: {
  day: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}) {
  const dayId = format(day, "yyyy-MM-dd");
  const { setNodeRef, isOver } = useDroppable({ id: dayId });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border border-alabaster rounded-lg p-2 min-h-[220px] transition-fast",
        isOver && "bg-tuscan/10",
        isToday(day) && "border-2 border-tuscan"
      )}
    >
      <p className="text-caption font-semibold text-graphite mb-2">{format(day, "EEE d")}</p>
      <div className="flex flex-col gap-1.5">
        {events.map((event) =>
          event.reschedulable ? (
            <DraggableChip key={event.id} event={event} onClick={() => onEventClick(event)} />
          ) : (
            <button
              key={event.id}
              onClick={() => onEventClick(event)}
              className={cn("text-[11px] truncate px-2 py-1 rounded text-left opacity-70", event.chipClass)}
            >
              {event.title}
            </button>
          )
        )}
      </div>
    </div>
  );
}

function DraggableChip({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: event.refId });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "text-[11px] truncate px-2 py-1 rounded text-left cursor-grab active:cursor-grabbing",
        event.chipClass,
        isDragging && "opacity-40"
      )}
    >
      {event.title}
    </button>
  );
}
