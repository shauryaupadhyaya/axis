"use client";

import { useMemo, useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { Paperclip, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { TimePicker } from "./TimePicker";
import { RecurrencePicker } from "./RecurrencePicker";
import { VoiceInputButton } from "./VoiceInputButton";
import { parseTaskText } from "@/lib/tasks/nlp";
import { formatRecurrence } from "@/lib/tasks/recurrence";
import { uploadTaskAttachment } from "@/lib/attachments";
import { PRIORITY_BADGE_CLASS, PRIORITY_LABEL, type Priority, type RecurrenceRule } from "@/lib/types";
import { createTask } from "@/app/(app)/tasks/actions";

interface TaskCreateModalProps {
  open: boolean;
  onClose: () => void;
  defaultDueDate?: string | null;
}

const PRIORITIES: Priority[] = ["urgent", "high", "medium", "low"];

function combineDateTime(date: string | null, time: string | null): string | null {
  if (!date) return null;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time ?? "00:00").split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm).toISOString();
}

export function TaskCreateModal({ open, onClose, defaultDueDate }: TaskCreateModalProps) {
  const [wasOpen, setWasOpen] = useState(open);

  const [rawTitle, setRawTitle] = useState("");
  const [description, setDescription] = useState("");

  const [dueDateManual, setDueDateManual] = useState<string | null>(null);
  const [dueDateTouched, setDueDateTouched] = useState(false);
  const [dueTimeManual, setDueTimeManual] = useState<string | null>(null);
  const [dueTimeTouched, setDueTimeTouched] = useState(false);
  const [recurrenceManual, setRecurrenceManual] = useState<RecurrenceRule | null>(null);
  const [recurrenceTouched, setRecurrenceTouched] = useState(false);
  const [priorityManual, setPriorityManual] = useState<Priority | null>(null);
  const [priorityTouched, setPriorityTouched] = useState(false);
  const [labelsManual, setLabelsManual] = useState<string[]>([]);
  const [labelsTouched, setLabelsTouched] = useState(false);
  const [labelInput, setLabelInput] = useState("");

  const [reminderDate, setReminderDate] = useState<string | null>(null);
  const [reminderTime, setReminderTime] = useState<string | null>(null);

  const [attachments, setAttachments] = useState<File[]>([]);

  const [, startTransition] = useTransition();

  // Reset all local state whenever the modal transitions from closed to open.
  // Done during render (React's documented "adjusting state" pattern) rather
  // than in an effect, since the component stays mounted across open/close.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setRawTitle("");
      setDescription("");
      setDueDateManual(null);
      setDueDateTouched(false);
      setDueTimeManual(null);
      setDueTimeTouched(false);
      setRecurrenceManual(null);
      setRecurrenceTouched(false);
      setPriorityManual(null);
      setPriorityTouched(false);
      setLabelsManual([]);
      setLabelsTouched(false);
      setLabelInput("");
      setReminderDate(null);
      setReminderTime(null);
      setAttachments([]);
    }
  }

  const parsed = useMemo(() => parseTaskText(rawTitle), [rawTitle]);

  const dueDate = dueDateTouched ? dueDateManual : (parsed.dueDate ?? defaultDueDate ?? null);
  const dueTime = dueTimeTouched ? dueTimeManual : parsed.dueTime;
  const recurrence = recurrenceTouched ? recurrenceManual : parsed.recurrence;
  const priority = priorityTouched ? priorityManual : parsed.priority;
  const labels = labelsTouched ? labelsManual : parsed.labels;

  const chips: { key: string; label: string; onDismiss: () => void }[] = [];
  if (!dueDateTouched && parsed.dueDate) {
    chips.push({
      key: "date",
      label: format(parseISO(parsed.dueDate), "MMM d"),
      onDismiss: () => {
        setDueDateManual(null);
        setDueDateTouched(true);
      },
    });
  }
  if (!dueTimeTouched && parsed.dueTime) {
    chips.push({
      key: "time",
      label: parsed.dueTime,
      onDismiss: () => {
        setDueTimeManual(null);
        setDueTimeTouched(true);
      },
    });
  }
  if (!recurrenceTouched && parsed.recurrence) {
    chips.push({
      key: "recurrence",
      label: formatRecurrence(parsed.recurrence),
      onDismiss: () => {
        setRecurrenceManual(null);
        setRecurrenceTouched(true);
      },
    });
  }
  if (!priorityTouched && parsed.priority) {
    chips.push({
      key: "priority",
      label: PRIORITY_LABEL[parsed.priority],
      onDismiss: () => {
        setPriorityManual(null);
        setPriorityTouched(true);
      },
    });
  }
  if (!labelsTouched) {
    for (const l of parsed.labels) {
      chips.push({
        key: `label-${l}`,
        label: `#${l}`,
        onDismiss: () => {
          setLabelsManual(parsed.labels.filter((x) => x !== l));
          setLabelsTouched(true);
        },
      });
    }
  }

  function addLabel() {
    const v = labelInput.trim();
    if (!v) return;
    setLabelInput("");
    if (labels.includes(v)) return;
    setLabelsManual([...labels, v]);
    setLabelsTouched(true);
  }

  function removeLabel(l: string) {
    setLabelsManual(labels.filter((x) => x !== l));
    setLabelsTouched(true);
  }

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setAttachments((a) => [...a, ...Array.from(files)]);
    e.target.value = "";
  }

  function removeAttachment(index: number) {
    setAttachments((a) => a.filter((_, i) => i !== index));
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const title = parsed.cleanTitle.trim();
    if (!title) return;

    const due_at = combineDateTime(dueDate, dueTime);
    const reminder_at = combineDateTime(reminderDate, reminderTime);
    const priorityValue = priority ?? "medium";
    const tags = labels;
    const recurrenceValue = recurrence;
    const files = attachments;

    startTransition(async () => {
      const id = await createTask({
        title,
        description: description.trim() || null,
        due_at,
        priority: priorityValue,
        tags,
        recurrence: recurrenceValue,
        reminder_at,
      });
      if (id) {
        await Promise.all(files.map((file) => uploadTaskAttachment(id, file)));
      }
      onClose();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New task"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="task-create-form" disabled={!parsed.cleanTitle.trim()}>
            Create Task
          </Button>
        </>
      }
    >
      <form id="task-create-form" onSubmit={handleCreate} className="flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              placeholder="Task title…"
              value={rawTitle}
              onChange={(e) => setRawTitle(e.target.value)}
              className="text-h3 flex-1"
            />
            <VoiceInputButton
              onTranscript={(text) => setRawTitle((prev) => (prev ? `${prev} ${text}` : text))}
            />
          </div>
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {chips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-alabaster text-graphite text-caption"
                >
                  {chip.label}
                  <button type="button" onClick={chip.onDismiss} aria-label={`Remove ${chip.label}`}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <textarea
          placeholder="Description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="text-body px-3 py-2.5 rounded-lg border border-alabaster bg-linen dark:bg-bg-secondary transition-fast placeholder:text-graphite placeholder:opacity-50 focus:outline-none focus:border-2 focus:border-tuscan focus:shadow-[0_0_0_3px_rgba(245,203,92,0.1)] resize-none"
        />

        <div className="grid grid-cols-2 gap-3">
          <DatePicker
            label="Due date"
            value={dueDate}
            onChange={(d) => {
              setDueDateManual(d);
              setDueDateTouched(true);
            }}
          />
          <TimePicker
            label="Due time"
            value={dueTime}
            onChange={(t) => {
              setDueTimeManual(t);
              setDueTimeTouched(true);
            }}
          />
        </div>

        <RecurrencePicker
          value={recurrence}
          onChange={(r) => {
            setRecurrenceManual(r);
            setRecurrenceTouched(true);
          }}
        />

        <div>
          <label className="text-label text-graphite mb-1.5 block">Priority</label>
          <div className="flex gap-1.5">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPriorityManual(p);
                  setPriorityTouched(true);
                }}
                className={`px-3 py-1.5 rounded-md text-small border transition-fast ${
                  priority === p ? PRIORITY_BADGE_CLASS[p] : "border-alabaster hover:bg-bg"
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
            {labels.map((l) => (
              <span
                key={l}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-alabaster text-graphite text-caption"
              >
                {l}
                <button type="button" onClick={() => removeLabel(l)} aria-label={`Remove ${l}`}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <Input
            placeholder="Add label, press Enter"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLabel();
              }
            }}
          />
        </div>

        <div>
          <label className="text-label text-graphite mb-1.5 block">Reminder</label>
          <div className="grid grid-cols-2 gap-3">
            <DatePicker value={reminderDate} onChange={setReminderDate} />
            <TimePicker value={reminderTime} onChange={setReminderTime} />
          </div>
        </div>

        <div>
          <label className="text-label text-graphite mb-1.5 block">Attachments</label>
          <ul className="flex flex-col gap-1.5 mb-2">
            {attachments.map((file, i) => (
              <li key={`${file.name}-${i}`} className="flex items-center gap-2 text-small">
                <Paperclip size={14} className="text-graphite shrink-0" />
                <span className="flex-1 truncate">{file.name}</span>
                <button type="button" aria-label="Remove attachment" onClick={() => removeAttachment(i)}>
                  <X size={14} className="text-graphite" />
                </button>
              </li>
            ))}
          </ul>
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-alabaster text-small text-graphite cursor-pointer hover:bg-bg transition-fast">
            <Paperclip size={14} /> Upload file
            <input type="file" multiple className="hidden" onChange={handleFilesSelected} />
          </label>
        </div>
      </form>
    </Modal>
  );
}
