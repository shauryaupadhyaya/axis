"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import type { Task } from "@/lib/types";
import { addTask, toggleTask } from "@/app/(app)/dashboard/actions";

function formatDue(due: string | null) {
  if (!due) return "";
  const date = new Date(due);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TasksWidget({ tasks }: { tasks: Task[] }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();

  const visible = tasks.filter((t) => !t.done).slice(0, 3);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(() => addTask(title));
    setTitle("");
    setAdding(false);
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-h3">Today&apos;s tasks</h3>
        <button
          aria-label="Add task"
          onClick={() => setAdding((v) => !v)}
          className="w-9 h-9 rounded-md border border-alabaster flex items-center justify-center hover:bg-bg transition-fast"
        >
          <Plus size={18} />
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="mb-3">
          <Input
            autoFocus
            placeholder="New task…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => !title && setAdding(false)}
          />
        </form>
      )}

      {visible.length === 0 ? (
        <p className="text-small text-graphite py-4 text-center">Clear. Add one?</p>
      ) : (
        <ul>
          {visible.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-3 py-2.5 border-b border-alabaster last:border-b-0"
            >
              <Checkbox
                checked={task.done}
                disabled={pending}
                onChange={(e) => startTransition(() => toggleTask(task.id, e.target.checked))}
              />
              <span className="flex-1 text-body">{task.title}</span>
              {task.due_at && (
                <span className="text-mono text-graphite">{formatDue(task.due_at)}</span>
              )}
              {(task.priority === "high" || task.priority === "urgent") && (
                <span className="w-1 h-1 rounded-full bg-danger shrink-0" />
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
