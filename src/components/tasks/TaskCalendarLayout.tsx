"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek } from "date-fns";
import { Repeat } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRecurrence } from "@/lib/tasks/recurrence";
import { PRIORITY_BORDER_CLASS, type Task } from "@/lib/types";

interface TaskCalendarLayoutProps {
  tasks: Task[];
  month: Date;
  onTaskClick: (taskId: string) => void;
  onReschedule: (taskId: string, isoDate: string) => void;
}

const MAX_TASKS_PER_DAY = 3;
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function DraggableTaskChip({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "flex items-center gap-1 w-full text-[10px] truncate border-l-2 pl-1 leading-tight text-left cursor-grab active:cursor-grabbing",
        PRIORITY_BORDER_CLASS[task.priority],
        isDragging && "opacity-40"
      )}
    >
      {task.recurrence && (
        <span title={formatRecurrence(task.recurrence)} className="shrink-0">
          <Repeat size={9} />
        </span>
      )}
      <span className="truncate">{task.title}</span>
    </button>
  );
}

function DayCell({
  day,
  month,
  dayTasks,
  onTaskClick,
}: {
  day: Date;
  month: Date;
  dayTasks: Task[];
  onTaskClick: (taskId: string) => void;
}) {
  const dayId = format(day, "yyyy-MM-dd");
  const { setNodeRef, isOver } = useDroppable({ id: dayId });
  const inMonth = isSameMonth(day, month);
  const today = isToday(day);
  const shown = dayTasks.slice(0, MAX_TASKS_PER_DAY);
  const overflow = dayTasks.length - shown.length;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-20 border-b border-r border-alabaster p-1.5 flex flex-col gap-0.5 transition-fast",
        !inMonth && "opacity-40",
        today && "bg-linen dark:bg-bg-secondary border-2 border-tuscan",
        isOver && "bg-tuscan/10"
      )}
    >
      <span className="text-caption font-semibold">{format(day, "d")}</span>
      <div className="flex flex-col gap-0.5 overflow-hidden">
        {shown.map((task) => (
          <DraggableTaskChip key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
        ))}
      </div>
      {overflow > 0 && <span className="text-[10px] text-graphite">+{overflow} more</span>}
    </div>
  );
}

export function TaskCalendarLayout({ tasks, month, onTaskClick, onReschedule }: TaskCalendarLayoutProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [activeId, setActiveId] = useState<string | null>(null);

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(month));
    const gridEnd = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [month]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.due_at) continue;
      const key = format(new Date(task.due_at), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    return map;
  }, [tasks]);

  const activeTask = tasks.find((t) => t.id === activeId) ?? null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    onReschedule(String(active.id), String(over.id));
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="border border-alabaster rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 bg-linen dark:bg-bg-secondary border-b border-alabaster">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="text-caption text-graphite text-center py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => (
            <DayCell
              key={day.toISOString()}
              day={day}
              month={month}
              dayTasks={tasksByDay.get(format(day, "yyyy-MM-dd")) ?? []}
              onTaskClick={onTaskClick}
            />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="text-[10px] truncate border-l-2 border-l-alabaster pl-1 bg-linen dark:bg-bg-secondary rounded px-1.5 py-1 shadow-[0_4px_12px_var(--shadow-color)]">
            {activeTask.title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
