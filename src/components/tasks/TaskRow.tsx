"use client";

import { useTransition } from "react";
import { Checkbox } from "@/components/ui/Checkbox";
import type { Task } from "@/lib/types";
import { toggleTaskDone } from "@/app/(app)/tasks/actions";

function formatDue(due: string | null) {
  if (!due) return "";
  return new Date(due).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
  const [, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-alabaster last:border-b-0 hover:bg-bg transition-fast px-1 -mx-1 rounded">
      <Checkbox
        checked={task.done}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => startTransition(() => toggleTaskDone(task.id, e.target.checked))}
      />
      <button onClick={onClick} className="flex-1 flex items-center gap-3 text-left min-w-0">
        <span className={`flex-1 text-body truncate ${task.done ? "opacity-50 line-through" : ""}`}>
          {task.title}
        </span>
        {task.due_at && <span className="text-mono text-graphite shrink-0">{formatDue(task.due_at)}</span>}
        {(task.priority === "high" || task.priority === "urgent") && (
          <span className="w-1 h-1 rounded-full bg-danger shrink-0" />
        )}
      </button>
    </div>
  );
}
