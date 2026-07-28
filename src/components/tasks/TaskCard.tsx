import { Card } from "@/components/ui/Card";
import type { Task } from "@/lib/types";

const PRIORITY_DOT: Record<Task["priority"], string> = {
  low: "bg-alabaster",
  medium: "bg-info",
  high: "bg-warning",
  urgent: "bg-danger",
};

export function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  return (
    <Card variant="lightweight" onClick={onClick} className="cursor-pointer bg-linen dark:bg-bg-secondary">
      <div className="flex items-start justify-between gap-2">
        <p className="text-body font-medium">{task.title}</p>
        <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${PRIORITY_DOT[task.priority]}`} />
      </div>
      {task.due_at && (
        <p className="text-caption text-graphite mt-1">
          {new Date(task.due_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
      )}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-alabaster text-graphite">
              {tag}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
