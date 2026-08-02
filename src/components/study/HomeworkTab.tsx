"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { DatePicker } from "@/components/ui/DatePicker";
import type { Chapter, Homework } from "@/lib/types";
import { createHomework, setHomeworkStatus, updateHomework } from "@/app/(app)/study/actions";
import { HomeworkDetailPanel } from "./HomeworkDetailPanel";
import { bucketHomework } from "@/lib/study";

function formatDue(due: string | null) {
  if (!due) return "";
  return new Date(due).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Section({
  title,
  items,
  subjectId,
  onSelect,
  urgent,
}: {
  title: string;
  items: Homework[];
  subjectId: string;
  onSelect: (id: string) => void;
  urgent?: boolean;
}) {
  const [, startTransition] = useTransition();
  if (items.length === 0) return null;
  return (
    <div className="mb-4">
      <p className={`text-label mb-1.5 ${urgent ? "text-danger" : "text-graphite"}`}>
        {title} ({items.length})
      </p>
      <div className="border border-alabaster rounded-xl p-2">
        {items.map((hw) => (
          <div
            key={hw.id}
            className="flex items-center gap-3 py-2.5 border-b border-alabaster last:border-b-0 hover:bg-bg transition-fast px-1 -mx-1 rounded"
          >
            <Checkbox
              checked={hw.status === "completed"}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => startTransition(() => setHomeworkStatus(subjectId, hw.id, e.target.checked ? "completed" : "not_started"))}
            />
            <button onClick={() => onSelect(hw.id)} className="flex-1 flex items-center gap-3 text-left min-w-0">
              <span className="flex-1 text-body truncate">{hw.title}</span>
              {hw.due_at && <span className="text-mono text-graphite shrink-0">{formatDue(hw.due_at)}</span>}
              {(hw.priority === "high" || hw.priority === "urgent") && <span className="w-1 h-1 rounded-full bg-danger shrink-0" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomeworkTab({ subjectId, homework, chapters = [] }: { subjectId: string; homework: Homework[]; chapters?: Chapter[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [addError, setAddError] = useState<string | null>(null);

  const selected = homework.find((h) => h.id === selectedId) ?? null;
  const buckets = bucketHomework(homework);
  const completed = homework.filter((h) => h.status === "completed");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAddError(null);
    const title = newTitle;
    const dueDate = newDueDate;
    setNewTitle("");
    setNewDueDate(null);
    startTransition(async () => {
      try {
        const id = await createHomework(subjectId, title);
        if (!id) {
          setAddError("Couldn't add homework — try again.");
          return;
        }
        if (dueDate) await updateHomework(subjectId, id, { due_at: dueDate });
      } catch {
        setAddError("Couldn't add homework — try again.");
      }
    });
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="flex flex-wrap gap-2 mb-4">
        <Input
          placeholder="Homework title…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 min-w-[180px]"
        />
        <DatePicker value={newDueDate} onChange={setNewDueDate} />
        <Button type="submit" className="flex items-center gap-1.5">
          <Plus size={16} /> Add
        </Button>
      </form>
      {addError && <p className="text-caption text-danger mb-3">{addError}</p>}

      {homework.length === 0 ? (
        <p className="text-small text-graphite py-8 text-center">No homework yet. Add one above.</p>
      ) : (
        <>
          <Section title="Overdue" items={buckets.overdue} subjectId={subjectId} onSelect={setSelectedId} urgent />
          <Section title="Due today" items={buckets.dueToday} subjectId={subjectId} onSelect={setSelectedId} />
          <Section title="Due tomorrow" items={buckets.dueTomorrow} subjectId={subjectId} onSelect={setSelectedId} />
          <Section title="Upcoming" items={buckets.upcoming} subjectId={subjectId} onSelect={setSelectedId} />
          <Section title="Completed" items={completed} subjectId={subjectId} onSelect={setSelectedId} />
        </>
      )}

      <HomeworkDetailPanel subjectId={subjectId} homework={selected} chapters={chapters} onClose={() => setSelectedId(null)} />
    </div>
  );
}
