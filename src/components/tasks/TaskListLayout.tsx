"use client";

import { useRef, useState } from "react";
import { addDays, format, isToday, isTomorrow, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Repeat } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { cn } from "@/lib/cn";
import { formatRecurrence } from "@/lib/tasks/recurrence";
import { PRIORITY_DOT_CLASS, type Task } from "@/lib/types";

interface TaskListLayoutProps {
  tasks: Task[];
  scope: "inbox" | "today" | "upcoming";
  onTaskClick: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onAddTask: (defaultDueDate?: string | null) => void;
}

function stripDescription(description: string | null): string {
  if (!description) return "";
  const plain = description.replace(/<[^>]+>/g, "").trim();
  return plain.length > 80 ? `${plain.slice(0, 80)}…` : plain;
}

function formatGroupHeader(date: Date): string {
  const label = format(date, "d MMM");
  if (isToday(date)) return `${label} • Today`;
  if (isTomorrow(date)) return `${label} • Tomorrow`;
  return `${label} • ${format(date, "EEEE")}`;
}

function ListRow({
  task,
  onTaskClick,
  onToggleComplete,
}: {
  task: Task;
  onTaskClick: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
}) {
  const preview = stripDescription(task.description);
  return (
    <div className="flex items-start gap-3 py-3 border-b border-alabaster last:border-b-0">
      <Checkbox
        checked={task.done}
        onClick={(e) => e.stopPropagation()}
        onChange={() => onToggleComplete(task.id)}
        className="mt-1 shrink-0"
      />
      <button onClick={() => onTaskClick(task.id)} className="flex-1 min-w-0 text-left flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span
            title={`Priority ${task.priority}`}
            className={cn("w-1.5 h-1.5 rounded-full shrink-0", PRIORITY_DOT_CLASS[task.priority])}
          />
          <span className={cn("text-body truncate", task.done && "opacity-50 line-through")}>{task.title}</span>
          {task.recurrence && (
            <span title={formatRecurrence(task.recurrence)} className="shrink-0">
              <Repeat size={12} className="text-graphite" />
            </span>
          )}
        </div>
        {preview && <p className="text-small text-graphite truncate">{preview}</p>}
        {task.due_at && <span className="text-caption text-graphite">{format(new Date(task.due_at), "MMM d")}</span>}
      </button>
    </div>
  );
}

function AddTaskRow({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 py-3 text-small text-graphite hover:text-carbon dark:hover:text-white transition-fast w-full"
    >
      <Plus size={14} /> Add Task
    </button>
  );
}

export function TaskListLayout({ tasks, scope, onTaskClick, onToggleComplete, onAddTask }: TaskListLayoutProps) {
  const groupRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  if (scope !== "upcoming") {
    return (
      <div className="flex flex-col">
        {tasks.length === 0 ? (
          <p className="text-small text-graphite py-8 text-center">Nothing here.</p>
        ) : (
          tasks.map((task) => (
            <ListRow key={task.id} task={task} onTaskClick={onTaskClick} onToggleComplete={onToggleComplete} />
          ))
        )}
        <AddTaskRow onClick={() => onAddTask()} />
      </div>
    );
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const tasksByDay = new Map<string, Task[]>();
  for (const task of tasks) {
    if (!task.due_at) continue;
    const key = format(new Date(task.due_at), "yyyy-MM-dd");
    const list = tasksByDay.get(key) ?? [];
    list.push(task);
    tasksByDay.set(key, list);
  }

  function scrollToGroup(key: string) {
    groupRefs.current.get(key)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function shiftWeek(delta: number) {
    setWeekStart((d) => addDays(d, delta * 7));
  }

  function resetToThisWeek() {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-3 gap-3">
        <span className="text-h3">
          {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d")}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => shiftWeek(-1)}
            aria-label="Previous week"
            className="p-1.5 rounded-md border border-alabaster hover:bg-bg transition-fast"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={resetToThisWeek}
            className="px-2.5 py-1.5 rounded-md border border-alabaster text-small hover:bg-bg transition-fast"
          >
            This week
          </button>
          <button
            onClick={() => shiftWeek(1)}
            aria-label="Next week"
            className="p-1.5 rounded-md border border-alabaster hover:bg-bg transition-fast"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="flex gap-1.5 mb-3">
        {weekDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          return (
            <button
              key={key}
              onClick={() => scrollToGroup(key)}
              className="flex-1 flex flex-col items-center justify-center h-12 rounded-lg border border-alabaster text-caption hover:bg-bg transition-fast"
            >
              <span className="text-[10px] text-graphite">{format(day, "EEE")}</span>
              <span className="font-semibold">{format(day, "d")}</span>
            </button>
          );
        })}
      </div>

      {weekDays.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const dayTasks = tasksByDay.get(key) ?? [];
        return (
          <div
            key={key}
            ref={(el) => {
              if (el) groupRefs.current.set(key, el);
              else groupRefs.current.delete(key);
            }}
            className="border-t border-alabaster pt-3 mt-3 first:border-t-0 first:mt-0 first:pt-0"
          >
            <h4 className="text-label text-graphite mb-1">{formatGroupHeader(day)}</h4>
            {dayTasks.map((task) => (
              <ListRow key={task.id} task={task} onTaskClick={onTaskClick} onToggleComplete={onToggleComplete} />
            ))}
            <AddTaskRow onClick={() => onAddTask(key)} />
          </div>
        );
      })}
    </div>
  );
}
