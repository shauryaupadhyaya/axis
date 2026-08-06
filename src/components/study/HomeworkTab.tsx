"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { DatePicker } from "@/components/ui/DatePicker";
import type { Chapter, Homework } from "@/lib/types";
import { createHomework, setHomeworkStatus } from "@/app/(app)/study/actions";
import { HomeworkDetailPanel } from "./HomeworkDetailPanel";
import { bucketHomework } from "@/lib/study";

function formatDate(due: string | null) {
  if (!due) return "";
  return new Date(due).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Section({
  title,
  items,
  subjectId,
  chaptersById,
  onSelect,
  urgent,
}: {
  title: string;
  items: Homework[];
  subjectId: string;
  chaptersById: Record<string, Chapter>;
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
        {items.map((hw) => {
          const chapter = hw.chapter_id ? chaptersById[hw.chapter_id] : undefined;
          return (
            <div
              key={hw.id}
              className="flex items-center gap-3 py-2.5 border-b border-alabaster last:border-b-0 hover:bg-bg transition-fast px-1 -mx-1 rounded"
            >
              <Checkbox
                checked={hw.status === "completed"}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => startTransition(() => setHomeworkStatus(subjectId, hw.id, e.target.checked ? "completed" : "not_started"))}
              />
              <button onClick={() => onSelect(hw.id)} className="flex-1 flex items-center gap-2 text-left min-w-0">
                <span className="flex-1 text-body truncate">{hw.title}</span>
                {chapter && (
                  <span className="text-caption text-graphite bg-alabaster/60 rounded-md px-1.5 py-0.5 shrink-0 truncate max-w-[120px]">
                    {chapter.name}
                  </span>
                )}
                {hw.given_at && (
                  <span className="text-caption text-graphite shrink-0" title="Given date">
                    Given {formatDate(hw.given_at)}
                  </span>
                )}
                {hw.due_at && <span className="text-mono text-graphite shrink-0">{formatDate(hw.due_at)}</span>}
                {(hw.priority === "high" || hw.priority === "urgent") && <span className="w-1 h-1 rounded-full bg-danger shrink-0" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HomeworkTab({ subjectId, homework, chapters = [] }: { subjectId: string; homework: Homework[]; chapters?: Chapter[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newChapterId, setNewChapterId] = useState("");
  const [newGivenDate, setNewGivenDate] = useState<string | null>(null);
  const [newDueDate, setNewDueDate] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [addError, setAddError] = useState<string | null>(null);

  const chaptersById = Object.fromEntries(chapters.map((c) => [c.id, c]));
  const selected = homework.find((h) => h.id === selectedId) ?? null;
  const buckets = bucketHomework(homework);
  const completed = homework.filter((h) => h.status === "completed");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAddError(null);
    const title = newTitle;
    const chapterId = newChapterId || null;
    const givenDate = newGivenDate;
    const dueDate = newDueDate;
    setNewTitle("");
    setNewChapterId("");
    setNewGivenDate(null);
    setNewDueDate(null);
    startTransition(async () => {
      try {
        const id = await createHomework(subjectId, title, { chapterId, givenAt: givenDate, dueAt: dueDate });
        if (!id) {
          setAddError("Couldn't add homework — try again.");
        }
      } catch {
        setAddError("Couldn't add homework — try again.");
      }
    });
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="flex flex-col gap-2 mb-4">
        <Input
          placeholder="Homework title…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <div className="flex flex-wrap items-end gap-2">
          {chapters.length > 0 && (
            <div className="min-w-[160px]">
              <label className="text-label text-graphite mb-1.5 block">Chapter</label>
              <select
                value={newChapterId}
                onChange={(e) => setNewChapterId(e.target.value)}
                className="w-full text-small px-2 py-2.5 rounded-md border border-alabaster bg-linen dark:bg-bg-secondary"
              >
                <option value="">No chapter</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <DatePicker label="Given" value={newGivenDate} onChange={setNewGivenDate} />
          <DatePicker label="Due" value={newDueDate} onChange={setNewDueDate} />
          <Button type="submit" className="flex items-center gap-1.5">
            <Plus size={16} /> Add
          </Button>
        </div>
      </form>
      {addError && <p className="text-caption text-danger mb-3">{addError}</p>}

      {homework.length === 0 ? (
        <p className="text-small text-graphite py-8 text-center">No homework yet. Add one above.</p>
      ) : (
        <>
          <Section title="Overdue" items={buckets.overdue} subjectId={subjectId} chaptersById={chaptersById} onSelect={setSelectedId} urgent />
          <Section title="Due today" items={buckets.dueToday} subjectId={subjectId} chaptersById={chaptersById} onSelect={setSelectedId} />
          <Section title="Due tomorrow" items={buckets.dueTomorrow} subjectId={subjectId} chaptersById={chaptersById} onSelect={setSelectedId} />
          <Section title="Upcoming" items={buckets.upcoming} subjectId={subjectId} chaptersById={chaptersById} onSelect={setSelectedId} />
          <Section title="Completed" items={completed} subjectId={subjectId} chaptersById={chaptersById} onSelect={setSelectedId} />
        </>
      )}

      <HomeworkDetailPanel subjectId={subjectId} homework={selected} chapters={chapters} onClose={() => setSelectedId(null)} />
    </div>
  );
}
