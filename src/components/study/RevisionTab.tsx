"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { Chapter } from "@/lib/types";
import { logRevisionSession } from "@/app/(app)/study/actions";
import { CHAPTER_STATUS_LABEL } from "@/lib/study";

function nextDueDate(chapter: Chapter): Date | null {
  if (!chapter.last_revised_at) return null;
  const next = new Date(chapter.last_revised_at);
  next.setDate(next.getDate() + chapter.revision_frequency_days);
  return next;
}

export function RevisionTab({ subjectId, chapters }: { subjectId: string; chapters: Chapter[] }) {
  const [, startTransition] = useTransition();
  const [minutesByChapter, setMinutesByChapter] = useState<Record<string, number>>({});

  if (chapters.length === 0) {
    return <p className="text-small text-graphite py-8 text-center">Add chapters in Syllabus first.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {chapters.map((chapter) => {
        const nextDue = nextDueDate(chapter);
        const overdue = nextDue ? nextDue < new Date() : false;
        return (
          <Card key={chapter.id}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-h3">{chapter.name}</h3>
              <Badge variant="neutral">{CHAPTER_STATUS_LABEL[chapter.status]}</Badge>
            </div>
            <p className="text-small text-graphite">Revised {chapter.revision_count} time{chapter.revision_count === 1 ? "" : "s"}</p>
            <p className="text-small text-graphite">
              Last revised:{" "}
              {chapter.last_revised_at
                ? new Date(chapter.last_revised_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "Never"}
            </p>
            <p className={`text-small mb-3 ${overdue ? "text-danger" : "text-graphite"}`}>
              Next due:{" "}
              {nextDue ? nextDue.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
              {" · every "}
              {chapter.revision_frequency_days}d
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={5}
                step={5}
                placeholder="Minutes"
                value={minutesByChapter[chapter.id] ?? ""}
                onChange={(e) =>
                  setMinutesByChapter((m) => ({ ...m, [chapter.id]: Number(e.target.value) }))
                }
                className="w-24 text-small px-2 py-1.5 rounded-md border border-alabaster bg-linen dark:bg-bg-secondary"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  const minutes = minutesByChapter[chapter.id] || 25;
                  startTransition(() => logRevisionSession(subjectId, chapter.id, minutes));
                }}
              >
                Start revision session
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
