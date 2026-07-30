"use client";

import { useRef } from "react";
import { addDays, format, isToday, isTomorrow, parse } from "date-fns";
import { Plus, Repeat } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { cn } from "@/lib/cn";
import { formatRecurrence } from "@/lib/tasks/recurrence";
import type { Task } from "@/lib/types";

interface TaskListLayoutProps {
  tasks: Task[];
  scope: "inbox" | "today" | "upcoming";
  onTaskClick: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onAddTask: (defaultDueDate?: string | null) => void;
}

interface TaskGroup {
  key: string;
  date: Date | null;
  tasks: Task[];
}

function stripDescription(description: string | null): string {
  if (!description) return "";
  const plain = description.replace(/<[^>]+>/g, "").trim();
  return plain.length > 80 ? `${plain.slice(0, 80)}…` : plain;
}

function buildGroups(tasks: Task[]): TaskGroup[] {
  const byDate = new Map<string, Task[]>();
  const noDate: Task[] = [];
  for (const task of tasks) {
    if (!task.due_at) {
      noDate.push(task);
      continue;
    }
    const key = format(new Date(task.due_at), "yyyy-MM-dd");
    const list = byDate.get(key) ?? [];
    list.push(task);
    byDate.set(key, list);
  }
  const groups: TaskGroup[] = Array.from(byDate.keys())
    .sort()
    .map((key) => ({ key, date: parse(key, "yyyy-MM-dd", new Date()), tasks: byDate.get(key)! }));
  if (noDate.length > 0) groups.push({ key: "no-date", date: null, tasks: noDate });
  return groups;
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

  const groups = buildGroups(tasks);
  const upcomingDays = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  function scrollToGroup(key: string) {
    groupRefs.current.get(key)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-3 gap-3">
        <span className="text-h3">{format(new Date(), "MMMM yyyy")}</span>
        <button
          onClick={() => scrollToGroup(format(new Date(), "yyyy-MM-dd"))}
          className="text-small text-graphite hover:text-carbon dark:hover:text-white transition-fast shrink-0"
        >
          Today
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 -mx-1 px-1">
        {upcomingDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          return (
            <button
              key={key}
              onClick={() => scrollToGroup(key)}
              className="shrink-0 flex flex-col items-center justify-center w-11 h-12 rounded-lg border border-alabaster text-caption hover:bg-bg transition-fast"
            >
              <span className="text-[10px] text-graphite">{format(day, "EEE")}</span>
              <span className="font-semibold">{format(day, "d")}</span>
            </button>
          );
        })}
      </div>

      {groups.length === 0 ? (
        <p className="text-small text-graphite py-8 text-center">Nothing upcoming.</p>
      ) : (
        groups.map((group) => (
          <div
            key={group.key}
            ref={(el) => {
              if (el) groupRefs.current.set(group.key, el);
              else groupRefs.current.delete(group.key);
            }}
            className="border-t border-alabaster pt-3 mt-3 first:border-t-0 first:mt-0 first:pt-0"
          >
            <h4 className="text-label text-graphite mb-1">{group.date ? formatGroupHeader(group.date) : "No date"}</h4>
            {group.tasks.map((task) => (
              <ListRow key={task.id} task={task} onTaskClick={onTaskClick} onToggleComplete={onToggleComplete} />
            ))}
            <AddTaskRow onClick={() => onAddTask(group.date ? group.key : null)} />
          </div>
        ))
      )}
    </div>
  );
}
