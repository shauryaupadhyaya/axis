"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { ChevronRight, Paperclip, Plus, Trash2, X } from "lucide-react";
import { SidePanel } from "@/components/ui/SidePanel";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { RecurrencePicker } from "@/components/tasks/RecurrencePicker";
import { TimePicker } from "@/components/tasks/TimePicker";
import { createClient } from "@/lib/supabase/client";
import {
  getAttachmentUrl,
  removeTaskAttachment,
  uploadInlineImage,
  uploadTaskAttachment,
} from "@/lib/attachments";
import type { Priority, Task, TaskAttachment, TaskComment } from "@/lib/types";
import { PRIORITY_LABEL } from "@/lib/types";
import {
  addComment,
  addSubtask,
  completeTask,
  deleteComment,
  deleteTask,
  stopRecurrence,
  updateTask,
} from "@/app/(app)/tasks/actions";

const PRIORITIES: Priority[] = ["urgent", "high", "medium", "low"];

type SubtaskRow = { id: string; title: string; done: boolean };

export function TaskDetailPanel({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const [subtasks, setSubtasks] = useState<SubtaskRow[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!task) return;
    const supabase = createClient();
    supabase
      .from("tasks")
      .select("id, title, done, parent_task_id")
      .eq("parent_task_id", task.id)
      .order("created_at")
      .then(({ data }) => setSubtasks((data as SubtaskRow[]) ?? []));
    supabase
      .from("task_comments")
      .select("*")
      .eq("task_id", task.id)
      .order("created_at")
      .then(({ data }) => setComments((data as TaskComment[]) ?? []));
    supabase
      .from("task_attachments")
      .select("*")
      .eq("task_id", task.id)
      .then(({ data }) => setAttachments((data as TaskAttachment[]) ?? []));
  }, [task]);

  if (!task) return null;

  function handleComplete() {
    if (!task) return;
    startTransition(async () => {
      await completeTask(task.id);
      onClose();
    });
  }

  function handleDelete() {
    if (!task) return;
    if (confirm("Delete this task? This cannot be undone.")) {
      startTransition(() => {
        deleteTask(task.id);
      });
      onClose();
    }
  }

  function handleAddSubtask(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubtask.trim() || !task) return;
    const title = newSubtask.trim();
    setNewSubtask("");
    startTransition(() => {
      addSubtask(task.id, title).then((id) => {
        if (id) setSubtasks((s) => [...s, { id, title, done: false }]);
      });
    });
  }

  function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !task) return;
    const body = newComment.trim();
    setNewComment("");
    startTransition(() => {
      addComment(task.id, body).then((comment) => {
        if (comment) setComments((c) => [...c, comment]);
      });
    });
  }

  function handleDeleteComment(id: string) {
    setComments((c) => c.filter((x) => x.id !== id));
    startTransition(() => deleteComment(id));
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

  const reminderDate = task.reminder_at ? format(new Date(task.reminder_at), "yyyy-MM-dd") : null;
  const reminderTime = task.reminder_at ? format(new Date(task.reminder_at), "HH:mm") : null;

  function handleReminderDateChange(date: string) {
    if (!task) return;
    const time = reminderTime ?? "09:00";
    const iso = new Date(`${date}T${time}`).toISOString();
    startTransition(() => {
      updateTask(task.id, { reminder_at: iso });
    });
  }

  function handleReminderTimeChange(time: string | null) {
    if (!task) return;
    if (!time) {
      startTransition(() => {
        updateTask(task.id, { reminder_at: null });
      });
      return;
    }
    const date = reminderDate ?? format(new Date(), "yyyy-MM-dd");
    const iso = new Date(`${date}T${time}`).toISOString();
    startTransition(() => {
      updateTask(task.id, { reminder_at: iso });
    });
  }

  return (
    <SidePanel
      open={!!task}
      onClose={onClose}
      title={task.title}
      footer={
        task.recurrence ? (
          <>
            <button
              onClick={() => startTransition(() => stopRecurrence(task.id))}
              className="text-graphite text-small font-semibold flex items-center gap-1.5 hover:opacity-70 transition-fast"
            >
              <X size={14} /> Stop repeating
            </button>
            <button
              onClick={handleDelete}
              className="text-danger text-small font-semibold flex items-center gap-1.5 hover:opacity-70 transition-fast"
            >
              <Trash2 size={14} /> Delete task
            </button>
          </>
        ) : (
          <button
            onClick={handleDelete}
            className="text-danger text-small font-semibold flex items-center gap-1.5 hover:opacity-70 transition-fast"
          >
            <Trash2 size={14} /> Delete task
          </button>
        )
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2.5">
          <Checkbox checked={task.done} onChange={(e) => e.target.checked && handleComplete()} />
          <Input
            defaultValue={task.title}
            className="flex-1"
            onBlur={(e) => e.target.value !== task.title && startTransition(() => updateTask(task.id, { title: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-label text-graphite mb-1.5 block">Description</label>
          <RichTextEditor
            content={task.description ?? ""}
            onChange={(html) => startTransition(() => updateTask(task.id, { description: html }))}
            onUploadImage={(file) => uploadInlineImage(task.id, file)}
          />
        </div>

        <div>
          <label className="text-label text-graphite mb-1.5 block">Subtasks</label>
          <ul className="flex flex-col gap-1.5 mb-2">
            {subtasks.map((st) => (
              <SubtaskNode key={st.id} taskId={st.id} title={st.title} done={st.done} depth={0} />
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
          <label className="text-label text-graphite mb-1.5 block">Comments</label>
          <ul className="flex flex-col gap-2 mb-2">
            {comments.map((c) => (
              <li key={c.id} className="flex items-start gap-2 text-small">
                <div className="flex-1">
                  <p className="text-body">{c.body}</p>
                  <p className="text-caption text-graphite">{format(new Date(c.created_at), "MMM d, h:mm a")}</p>
                </div>
                <button aria-label="Remove comment" onClick={() => handleDeleteComment(c.id)}>
                  <X size={14} className="text-graphite" />
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={handlePostComment} className="flex gap-2">
            <Input
              placeholder="Add a comment…"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="secondary">
              Post
            </Button>
          </form>
        </div>

        <div className="border-t border-alabaster" />

        <div>
          <label className="text-label text-graphite mb-1.5 block">Project</label>
          <p className="text-body">Inbox</p>
        </div>

        <DatePicker
          label="Due date"
          value={task.due_at ? task.due_at.slice(0, 10) : null}
          onChange={(date) => startTransition(() => updateTask(task.id, { due_at: date }))}
        />

        <RecurrencePicker
          value={task.recurrence}
          onChange={(rule) => startTransition(() => updateTask(task.id, { recurrence: rule }))}
        />

        <div>
          <label className="text-label text-graphite mb-1.5 block">Priority</label>
          <div className="flex gap-1.5">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => startTransition(() => updateTask(task.id, { priority: p }))}
                className={`px-3 py-1.5 rounded-md text-small border transition-fast ${
                  task.priority === p
                    ? "bg-carbon text-white border-carbon dark:bg-tuscan dark:text-carbon dark:border-tuscan"
                    : "border-alabaster hover:bg-bg"
                }`}
              >
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-label text-graphite mb-1.5 block">Labels</label>
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-label text-graphite block">Reminder</label>
            {task.reminder_at && (
              <button
                onClick={() => startTransition(() => updateTask(task.id, { reminder_at: null }))}
                className="text-caption text-graphite hover:opacity-70 transition-fast"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <DatePicker value={reminderDate} onChange={handleReminderDateChange} />
            <TimePicker value={reminderTime} onChange={handleReminderTimeChange} />
          </div>
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

function SubtaskNode({ taskId, title, done, depth }: { taskId: string; title: string; done: boolean; depth: number }) {
  const [children, setChildren] = useState<SubtaskRow[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [localDone, setLocalDone] = useState(done);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("tasks")
      .select("id, title, done")
      .eq("parent_task_id", taskId)
      .order("created_at")
      .then(({ data }) => setChildren((data as SubtaskRow[]) ?? []));
  }, [taskId]);

  function toggle(checked: boolean) {
    setLocalDone(checked);
    startTransition(() => {
      if (checked) {
        completeTask(taskId);
      } else {
        updateTask(taskId, { done: false });
      }
    });
  }

  return (
    <li>
      <div className="flex items-center gap-2" style={{ paddingLeft: depth * 16 }}>
        {children.length > 0 ? (
          <button
            type="button"
            aria-label={expanded ? "Collapse subtasks" : "Expand subtasks"}
            onClick={() => setExpanded((e) => !e)}
          >
            <ChevronRight size={12} className={`transition-fast ${expanded ? "rotate-90" : ""}`} />
          </button>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <Checkbox checked={localDone} onChange={(e) => toggle(e.target.checked)} />
        <span className={`flex-1 text-body ${localDone ? "opacity-50 line-through" : ""}`}>{title}</span>
      </div>
      {expanded && children.length > 0 && (
        <ul className="flex flex-col gap-1.5 mt-1.5">
          {children.map((c) => (
            <SubtaskNode key={c.id} taskId={c.id} title={c.title} done={c.done} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
