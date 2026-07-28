"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Trash2, Paperclip, X } from "lucide-react";
import { SidePanel } from "@/components/ui/SidePanel";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { createClient } from "@/lib/supabase/client";
import {
  getAttachmentUrl,
  removeTaskAttachment,
  uploadInlineImage,
  uploadTaskAttachment,
} from "@/lib/attachments";
import type { Priority, Task, TaskAttachment, TaskBoardStatus, TaskSubtask } from "@/lib/types";
import { taskBoardStatus } from "@/lib/types";
import {
  addSubtask,
  deleteSubtask,
  deleteTask,
  moveTaskBoardStatus,
  toggleSubtask,
  updateTask,
} from "@/app/(app)/tasks/actions";

const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];
const STATUSES: { value: TaskBoardStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

export function TaskDetailPanel({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!task) return;
    const supabase = createClient();
    supabase
      .from("task_subtasks")
      .select("*")
      .eq("task_id", task.id)
      .order("position")
      .then(({ data }) => setSubtasks((data as TaskSubtask[]) ?? []));
    supabase
      .from("task_attachments")
      .select("*")
      .eq("task_id", task.id)
      .then(({ data }) => setAttachments((data as TaskAttachment[]) ?? []));
  }, [task]);

  if (!task) return null;

  function handleAddSubtask(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubtask.trim() || !task) return;
    startTransition(() => addSubtask(task.id, newSubtask));
    setSubtasks((s) => [...s, { id: crypto.randomUUID(), task_id: task.id, user_id: "", title: newSubtask, done: false, position: s.length }]);
    setNewSubtask("");
  }

  function addTag(tag: string) {
    if (!task || !tag.trim() || task.tags.includes(tag.trim())) return;
    startTransition(() => updateTask(task.id, { tags: [...task.tags, tag.trim()] }));
    setTagInput("");
  }

  function removeTag(tag: string) {
    if (!task) return;
    startTransition(() => updateTask(task.id, { tags: task.tags.filter((t) => t !== tag) }));
  }

  async function handleAttachmentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !task) return;
    const attachment = await uploadTaskAttachment(task.id, file);
    setAttachments((a) => [...a, attachment]);
    e.target.value = "";
  }

  async function handleAttachmentRemove(attachment: TaskAttachment) {
    setAttachments((a) => a.filter((x) => x.id !== attachment.id));
    await removeTaskAttachment(attachment);
  }

  async function handleAttachmentOpen(attachment: TaskAttachment) {
    const url = await getAttachmentUrl(attachment.storage_path);
    window.open(url, "_blank");
  }

  return (
    <SidePanel
      open={!!task}
      onClose={onClose}
      title={task.title}
      footer={
        <button
          onClick={() => {
            if (confirm("Delete this task? This cannot be undone.")) {
              startTransition(() => deleteTask(task.id));
              onClose();
            }
          }}
          className="text-danger text-small font-semibold flex items-center gap-1.5 hover:opacity-70 transition-fast"
        >
          <Trash2 size={14} /> Delete task
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        <Input
          label="Title"
          defaultValue={task.title}
          onBlur={(e) => e.target.value !== task.title && startTransition(() => updateTask(task.id, { title: e.target.value }))}
        />

        <div>
          <label className="text-label text-graphite mb-1.5 block">Description</label>
          <RichTextEditor
            content={task.description ?? ""}
            onChange={(html) => startTransition(() => updateTask(task.id, { description: html }))}
            onUploadImage={(file) => uploadInlineImage(task.id, file)}
          />
        </div>

        <DatePicker
          label="Due date"
          value={task.due_at ? task.due_at.slice(0, 10) : null}
          onChange={(date) => startTransition(() => updateTask(task.id, { due_at: date }))}
        />

        <div>
          <label className="text-label text-graphite mb-1.5 block">Status</label>
          <div className="flex gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => startTransition(() => moveTaskBoardStatus(task.id, s.value))}
                className={`px-3 py-1.5 rounded-md text-small border transition-fast ${
                  taskBoardStatus(task) === s.value
                    ? "bg-carbon text-white border-carbon dark:bg-tuscan dark:text-carbon dark:border-tuscan"
                    : "border-alabaster hover:bg-bg"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-label text-graphite mb-1.5 block">Priority</label>
          <div className="flex gap-1.5">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => startTransition(() => updateTask(task.id, { priority: p }))}
                className={`px-3 py-1.5 rounded-md text-small capitalize border transition-fast ${
                  task.priority === p
                    ? "bg-carbon text-white border-carbon dark:bg-tuscan dark:text-carbon dark:border-tuscan"
                    : "border-alabaster hover:bg-bg"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-label text-graphite mb-1.5 block">Tags</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {task.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-alabaster text-graphite text-caption">
                {tag}
                <button onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <Input
            placeholder="Add tag, press Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(tagInput);
              }
            }}
          />
        </div>

        <div>
          <label className="text-label text-graphite mb-1.5 block">Subtasks</label>
          <ul className="flex flex-col gap-1.5 mb-2">
            {subtasks.map((st) => (
              <li key={st.id} className="flex items-center gap-2">
                <Checkbox
                  checked={st.done}
                  onChange={(e) => {
                    setSubtasks((s) => s.map((x) => (x.id === st.id ? { ...x, done: e.target.checked } : x)));
                    startTransition(() => toggleSubtask(st.id, e.target.checked));
                  }}
                />
                <span className={`flex-1 text-body ${st.done ? "opacity-50 line-through" : ""}`}>{st.title}</span>
                <button
                  aria-label="Remove subtask"
                  onClick={() => {
                    setSubtasks((s) => s.filter((x) => x.id !== st.id));
                    startTransition(() => deleteSubtask(st.id));
                  }}
                >
                  <X size={14} className="text-graphite" />
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={handleAddSubtask} className="flex gap-2">
            <Input
              placeholder="Add subtask…"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="icon" aria-label="Add subtask">
              <Plus size={16} />
            </Button>
          </form>
        </div>

        <div>
          <label className="text-label text-graphite mb-1.5 block">Attachments</label>
          <ul className="flex flex-col gap-1.5 mb-2">
            {attachments.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-small">
                <Paperclip size={14} className="text-graphite shrink-0" />
                <button className="flex-1 text-left truncate hover:underline" onClick={() => handleAttachmentOpen(a)}>
                  {a.file_name}
                </button>
                <button aria-label="Remove attachment" onClick={() => handleAttachmentRemove(a)}>
                  <X size={14} className="text-graphite" />
                </button>
              </li>
            ))}
          </ul>
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-alabaster text-small text-graphite cursor-pointer hover:bg-bg transition-fast">
            <Paperclip size={14} /> Upload file
            <input type="file" className="hidden" onChange={handleAttachmentUpload} />
          </label>
        </div>
      </div>
    </SidePanel>
  );
}
