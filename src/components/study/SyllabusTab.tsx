"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Chapter, ChapterStatus } from "@/lib/types";
import { addChapter, deleteChapter, updateChapterStatus } from "@/app/(app)/study/actions";

const STATUS_LABEL: Record<ChapterStatus, string> = {
  not_started: "Not started",
  learning: "Learning",
  revised: "Revised",
  mastered: "Mastered",
};

const STATUS_DOT: Record<ChapterStatus, string> = {
  not_started: "bg-graphite",
  learning: "bg-info",
  revised: "bg-warning",
  mastered: "bg-success",
};

const STATUS_ORDER: ChapterStatus[] = ["not_started", "learning", "revised", "mastered"];

export function SyllabusTab({ subjectId, chapters }: { subjectId: string; chapters: Chapter[] }) {
  const [name, setName] = useState("");
  const [, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(() => addChapter(subjectId, name));
    setName("");
  }

  return (
    <div>
      <div className="border border-alabaster rounded-xl divide-y divide-alabaster mb-4">
        {chapters.length === 0 ? (
          <p className="text-small text-graphite py-8 text-center">No chapters yet.</p>
        ) : (
          chapters.map((chapter) => (
            <div key={chapter.id} className="flex items-center gap-3 px-4 py-3">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[chapter.status]}`} />
              <span className="flex-1 text-body">{chapter.name}</span>
              <select
                value={chapter.status}
                onChange={(e) =>
                  startTransition(() =>
                    updateChapterStatus(subjectId, chapter.id, e.target.value as ChapterStatus)
                  )
                }
                className="text-small border border-alabaster rounded-md px-2 py-1 bg-linen dark:bg-bg-secondary"
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <button
                aria-label="Delete chapter"
                onClick={() => startTransition(() => deleteChapter(subjectId, chapter.id))}
              >
                <Trash2 size={14} className="text-graphite hover:text-danger transition-fast" />
              </button>
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleAdd} className="flex gap-2 max-w-sm">
        <Input placeholder="Add chapter…" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
        <Button type="submit" variant="icon" aria-label="Add chapter">
          <Plus size={16} />
        </Button>
      </form>
    </div>
  );
}
