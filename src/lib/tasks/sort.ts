import type { Task } from "@/lib/types";

export type SortMode = "smart" | "due_date" | "priority" | "created" | "alphabetical";

export const SORT_MODES: { value: SortMode; label: string }[] = [
  { value: "smart", label: "Smart" },
  { value: "due_date", label: "Due Date" },
  { value: "priority", label: "Priority" },
  { value: "created", label: "Creation Date" },
  { value: "alphabetical", label: "Alphabetical" },
];

const PRIORITY_RANK: Record<Task["priority"], number> = { urgent: 0, high: 1, medium: 2, low: 3 };

function dueRank(t: Task): number {
  return t.due_at ? new Date(t.due_at).getTime() : Number.POSITIVE_INFINITY;
}

function isOverdue(t: Task, now: Date): boolean {
  return !t.done && !!t.due_at && new Date(t.due_at).getTime() < now.getTime();
}

export function sortTasks(tasks: Task[], mode: SortMode, now: Date = new Date()): Task[] {
  const copy = [...tasks];
  switch (mode) {
    case "due_date":
      return copy.sort((a, b) => dueRank(a) - dueRank(b));
    case "priority":
      return copy.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
    case "created":
      return copy.sort((a, b) => a.created_at.localeCompare(b.created_at));
    case "alphabetical":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "smart":
    default:
      return copy.sort((a, b) => {
        const overdueDiff = Number(isOverdue(b, now)) - Number(isOverdue(a, now));
        if (overdueDiff !== 0) return overdueDiff;
        const prDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        if (prDiff !== 0) return prDiff;
        return dueRank(a) - dueRank(b);
      });
  }
}
