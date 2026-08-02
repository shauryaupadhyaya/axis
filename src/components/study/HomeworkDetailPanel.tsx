"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { SidePanel } from "@/components/ui/SidePanel";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import type { Chapter, Homework, HomeworkStatus, Priority } from "@/lib/types";
import { deleteHomework, updateHomework } from "@/app/(app)/study/actions";
import { homeworkStatusLabel } from "@/lib/study";

const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];
const STATUSES: HomeworkStatus[] = ["not_started", "in_progress", "completed"];

export function HomeworkDetailPanel({
  subjectId,
  homework,
  chapters = [],
  onClose,
}: {
  subjectId: string;
  homework: Homework | null;
  chapters?: Chapter[];
  onClose: () => void;
}) {
  const [, startTransition] = useTransition();

  if (!homework) return null;

  return (
    <SidePanel
      open={!!homework}
      onClose={onClose}
      title={homework.title}
      footer={
        <button
          onClick={() => {
            if (confirm("Delete this homework? This cannot be undone.")) {
              startTransition(() => deleteHomework(subjectId, homework.id));
              onClose();
            }
          }}
          className="text-danger text-small font-semibold flex items-center gap-1.5 hover:opacity-70 transition-fast"
        >
          <Trash2 size={14} /> Delete homework
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        <Input
          key={homework.id}
          label="Title"
          defaultValue={homework.title}
          onBlur={(e) =>
            e.target.value !== homework.title &&
            startTransition(() => updateHomework(subjectId, homework.id, { title: e.target.value }))
          }
        />

        <div>
          <label className="text-label text-graphite mb-1.5 block">Description</label>
          <RichTextEditor
            key={homework.id}
            content={homework.description ?? ""}
            onChange={(html) => startTransition(() => updateHomework(subjectId, homework.id, { description: html }))}
          />
        </div>

        <DatePicker
          label="Due date"
          value={homework.due_at ? homework.due_at.slice(0, 10) : null}
          onChange={(date) => startTransition(() => updateHomework(subjectId, homework.id, { due_at: date }))}
        />

        <div>
          <label className="text-label text-graphite mb-1.5 block">Priority</label>
          <div className="flex gap-1.5">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => startTransition(() => updateHomework(subjectId, homework.id, { priority: p }))}
                className={`px-3 py-1.5 rounded-md text-small capitalize border transition-fast ${
                  homework.priority === p
                    ? "bg-carbon text-white border-carbon dark:bg-tuscan dark:text-carbon dark:border-tuscan"
                    : "border-alabaster hover:bg-bg"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {chapters.length > 0 && (
          <div>
            <label className="text-label text-graphite mb-1.5 block">Chapter</label>
            <select
              value={homework.chapter_id ?? ""}
              onChange={(e) =>
                startTransition(() => updateHomework(subjectId, homework.id, { chapter_id: e.target.value || null }))
              }
              className="w-full text-small px-2 py-2 rounded-md border border-alabaster bg-linen dark:bg-bg-secondary"
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

        <div>
          <label className="text-label text-graphite mb-1.5 block">Status</label>
          <div className="flex gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => startTransition(() => updateHomework(subjectId, homework.id, { status: s }))}
                className={`px-3 py-1.5 rounded-md text-small border transition-fast ${
                  homework.status === s
                    ? "bg-carbon text-white border-carbon dark:bg-tuscan dark:text-carbon dark:border-tuscan"
                    : "border-alabaster hover:bg-bg"
                }`}
              >
                {homeworkStatusLabel(s)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </SidePanel>
  );
}
