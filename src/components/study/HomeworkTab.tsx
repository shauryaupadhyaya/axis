"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { DatePicker } from "@/components/ui/DatePicker";
import type { Homework } from "@/lib/types";
import { createHomework, toggleHomeworkDone, updateHomework } from "@/app/(app)/study/actions";
import { HomeworkDetailPanel } from "./HomeworkDetailPanel";

function formatDue(due: string | null) {
  if (!due) return "";
  return new Date(due).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function HomeworkTab({ subjectId, homework }: { subjectId: string; homework: Homework[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const selected = homework.find((h) => h.id === selectedId) ?? null;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const title = newTitle;
    const dueDate = newDueDate;
    startTransition(async () => {
      const id = await createHomework(subjectId, title);
      if (id && dueDate) await updateHomework(subjectId, id, { due_at: dueDate });
    });
    setNewTitle("");
    setNewDueDate(null);
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

      <div className="border border-alabaster rounded-xl p-2">
        {homework.length === 0 ? (
          <p className="text-small text-graphite py-8 text-center">No homework yet. Add one above.</p>
        ) : (
          homework.map((hw) => (
            <div
              key={hw.id}
              className="flex items-center gap-3 py-2.5 border-b border-alabaster last:border-b-0 hover:bg-bg transition-fast px-1 -mx-1 rounded"
            >
              <Checkbox
                checked={hw.done}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => startTransition(() => toggleHomeworkDone(subjectId, hw.id, e.target.checked))}
              />
              <button onClick={() => setSelectedId(hw.id)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                <span className={`flex-1 text-body truncate ${hw.done ? "opacity-50 line-through" : ""}`}>
                  {hw.title}
                </span>
                {hw.due_at && <span className="text-mono text-graphite shrink-0">{formatDue(hw.due_at)}</span>}
                {(hw.priority === "high" || hw.priority === "urgent") && (
                  <span className="w-1 h-1 rounded-full bg-danger shrink-0" />
                )}
              </button>
            </div>
          ))
        )}
      </div>

      <HomeworkDetailPanel subjectId={subjectId} homework={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}
