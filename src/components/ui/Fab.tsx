"use client";

import { useState, useTransition } from "react";
import { Plus, X, ListChecks, StickyNote } from "lucide-react";
import { createPortal } from "react-dom";
import { Input } from "./Input";
import { DatePicker } from "./DatePicker";
import { Button } from "./Button";
import { cn } from "@/lib/cn";
import { createTask, updateTask } from "@/app/(app)/tasks/actions";
import { createNote } from "@/app/(app)/notes/actions";

type QuickType = "task" | "note";

/**
 * Floating Action Button (FAB) — spec: mobile-friendly quick capture.
 * Sits at bottom-right, opens a bottom-sheet modal for rapid task/note entry.
 */
export function Fab() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<QuickType>("task");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const text = title;
    const date = dueDate;
    startTransition(async () => {
      if (type === "task") {
        const id = await createTask(text);
        if (id && date) {
          await updateTask(id, { due_at: date });
        }
      } else {
        await createNote(null);
      }
    });
    setTitle("");
    setDueDate(null);
    setOpen(false);
  }

  return (
    <>
      <button
        aria-label="Quick capture"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-[76px] right-4 z-[1000]",
          "w-12 h-12 md:w-14 md:h-14 rounded-full",
          "bg-tuscan flex items-center justify-center",
          "shadow-[0_4px_12px_rgba(245,203,92,0.3)]",
          "hover:shadow-[0_8px_20px_rgba(245,203,92,0.4)]",
          "transition-all duration-140 active:scale-95"
        )}
      >
        <Plus size={24} className="text-white" />
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[1100] flex items-end justify-center"
            style={{ background: "var(--overlay)" }}
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Quick capture"
              onClick={(e) => e.stopPropagation()}
              className="bg-linen dark:bg-bg-secondary w-full max-w-[480px] rounded-t-[20px] flex flex-col transition-sheet max-h-[90vh]"
              style={{ boxShadow: "0 20px 40px var(--shadow-color-hover)" }}
            >
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-7 h-1 rounded-full bg-alabaster" />
              </div>

              <div className="px-6 pt-4">
                <div className="flex gap-1 border border-alabaster rounded-lg p-1 w-fit mb-4">
                  {(["task", "note"] as QuickType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-small capitalize flex items-center gap-1.5 transition-fast",
                        type === t
                          ? "bg-carbon text-white dark:bg-tuscan dark:text-carbon"
                          : "hover:bg-bg"
                      )}
                    >
                      {t === "task" ? <ListChecks size={14} /> : <StickyNote size={14} />}
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="px-6 pb-6 flex flex-col gap-4">
                <Input
                  autoFocus
                  label={type === "task" ? "Task title" : "Note title"}
                  placeholder={
                    type === "task"
                      ? "e.g. Physics ch4 hw fri 6pm high"
                      : "e.g. Meeting notes from study group"
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                {type === "task" && (
                  <DatePicker
                    label="Due date (optional)"
                    value={dueDate}
                    onChange={setDueDate}
                  />
                )}
                <Button type="submit" className="w-full">
                  {type === "task" ? "Create task" : "Create note"}
                </Button>
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
