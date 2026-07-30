"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { TaskCreateModal } from "@/components/tasks/TaskCreateModal";
import { PRIORITY_DOT_CLASS, type Task } from "@/lib/types";
import { toggleTask } from "@/app/(app)/dashboard/actions";

function formatDue(due: string | null) {
  if (!due) return "";
  const date = new Date(due);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function stripDescription(description: string | null): string {
  if (!description) return "";
  const plain = description.replace(/<[^>]+>/g, "").trim();
  return plain.length > 100 ? `${plain.slice(0, 100)}…` : plain;
}

export function TasksWidget({ tasks }: { tasks: Task[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const nextTask =
    tasks
      .filter((t) => !t.done && t.due_at)
      .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime())[0] ?? null;

  const preview = stripDescription(nextTask?.description ?? null);

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-h3">Upcoming tasks</h3>
        <button
          aria-label="Add task"
          onClick={() => setAddOpen(true)}
          className="w-9 h-9 rounded-md border border-alabaster flex items-center justify-center hover:bg-bg transition-fast"
        >
          <Plus size={18} />
        </button>
      </div>

      {!nextTask ? (
        <p className="text-small text-graphite py-4 text-center">Clear. Add one?</p>
      ) : (
        <Link href="/tasks" className="flex items-start gap-3 py-1 -mx-1 px-1 rounded-lg hover:bg-bg transition-fast">
          <Checkbox
            checked={nextTask.done}
            disabled={pending}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              startTransition(() => toggleTask(nextTask.id, e.target.checked));
            }}
            className="mt-1 shrink-0"
          />
          <span
            title={`Priority ${nextTask.priority}`}
            className={`w-1.5 h-1.5 rounded-full shrink-0 mt-2 ${PRIORITY_DOT_CLASS[nextTask.priority]}`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-body truncate">{nextTask.title}</span>
              {nextTask.due_at && (
                <span className="text-mono text-graphite shrink-0">{formatDue(nextTask.due_at)}</span>
              )}
            </div>
            {preview && <p className="text-small text-graphite mt-0.5 truncate">{preview}</p>}
          </div>
        </Link>
      )}

      <TaskCreateModal open={addOpen} onClose={() => setAddOpen(false)} />
    </Card>
  );
}
