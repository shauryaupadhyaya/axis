"use client";

import { format, isSameDay, isToday, isTomorrow } from "date-fns";
import { Plus, Repeat } from "lucide-react";
import { DndBoard, type DndColumn } from "@/components/dnd/DndBoard";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { cn } from "@/lib/cn";
import { formatRecurrence } from "@/lib/tasks/recurrence";
import { PRIORITY_BORDER_CLASS, type Task } from "@/lib/types";

interface TaskBoardLayoutProps {
  tasks: Task[];
  days: Date[];
  onTaskClick: (taskId: string) => void;
  onAddTask: (defaultDueDate: string) => void;
  onReschedule: (taskId: string, isoDate: string) => void;
}

const ADD_TASK_PREFIX = "__add-task__:";

function addTaskSentinel(columnId: string): Task {
  return {
    id: `${ADD_TASK_PREFIX}${columnId}`,
    user_id: "",
    title: "",
    description: null,
    done: false,
    in_progress: false,
    due_at: null,
    priority: "low",
    tags: [],
    created_at: "",
    parent_task_id: null,
    recurrence: null,
    reminder_at: null,
    completed_at: null,
  };
}

function stripDescription(description: string | null): string {
  if (!description) return "";
  const plain = description.replace(/<[^>]+>/g, "").trim();
  return plain.length > 80 ? `${plain.slice(0, 80)}…` : plain;
}

function columnTitle(day: Date): string {
  if (isToday(day)) return "Today";
  if (isTomorrow(day)) return "Tomorrow";
  return format(day, "EEEE");
}

function BoardTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const preview = stripDescription(task.description);
  return (
    <Card
      variant="lightweight"
      onClick={onClick}
      className={cn("cursor-pointer bg-linen dark:bg-bg-secondary border-l-4", PRIORITY_BORDER_CLASS[task.priority])}
    >
      <div className="flex items-start gap-2">
        <Checkbox
          checked={task.done}
          onClick={(e) => e.stopPropagation()}
          onChange={() => {}}
          className="mt-0.5 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className={cn("text-body truncate", task.done && "opacity-50 line-through")}>{task.title}</p>
            {task.recurrence && (
              <span title={formatRecurrence(task.recurrence)} className="shrink-0">
                <Repeat size={12} className="text-graphite" />
              </span>
            )}
          </div>
          {preview && <p className="text-caption text-graphite truncate mt-0.5">{preview}</p>}
        </div>
      </div>
    </Card>
  );
}

function AddTaskCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-1.5 text-small text-graphite hover:text-carbon dark:hover:text-white transition-fast px-2 py-2 rounded-lg border border-dashed border-alabaster w-full"
    >
      <Plus size={14} /> Add Task
    </button>
  );
}

export function TaskBoardLayout({ tasks, days, onTaskClick, onAddTask, onReschedule }: TaskBoardLayoutProps) {
  const columns: DndColumn<Task>[] = days.map((day) => {
    const id = format(day, "yyyy-MM-dd");
    const items = tasks.filter((t) => t.due_at && isSameDay(new Date(t.due_at), day));
    return { id, title: columnTitle(day), items: [...items, addTaskSentinel(id)] };
  });

  return (
    <DndBoard
      columns={columns}
      renderCard={(task) =>
        task.id.startsWith(ADD_TASK_PREFIX) ? (
          <AddTaskCard onClick={() => onAddTask(task.id.slice(ADD_TASK_PREFIX.length))} />
        ) : (
          <BoardTaskCard task={task} onClick={() => onTaskClick(task.id)} />
        )
      }
      onDrop={(taskId, columnId) => {
        if (taskId.startsWith(ADD_TASK_PREFIX)) return;
        onReschedule(taskId, columnId);
      }}
    />
  );
}
