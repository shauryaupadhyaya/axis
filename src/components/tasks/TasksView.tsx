"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { DatePicker } from "@/components/ui/DatePicker";
import { DndBoard, type DndColumn } from "@/components/dnd/DndBoard";
import { MonthGrid, type MonthGridEvent } from "@/components/calendar/MonthGrid";
import { TaskRow } from "./TaskRow";
import { TaskCard } from "./TaskCard";
import { TaskDetailPanel } from "./TaskDetailPanel";
import type { Task, TaskBoardStatus } from "@/lib/types";
import { taskBoardStatus } from "@/lib/types";
import { createTask, moveTaskBoardStatus, updateTask } from "@/app/(app)/tasks/actions";

type View = "list" | "board" | "timeline";

const PRIORITY_BORDER: Record<Task["priority"], string> = {
  low: "border-l-alabaster",
  medium: "border-l-info",
  high: "border-l-warning",
  urgent: "border-l-danger",
};

export function TasksView({ tasks }: { tasks: Task[] }) {
  const [view, setView] = useState<View>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const selectedTask = tasks.find((t) => t.id === selectedId) ?? null;

  const columns: DndColumn<Task>[] = useMemo(() => {
    const byStatus = (status: TaskBoardStatus) => tasks.filter((t) => taskBoardStatus(t) === status);
    return [
      { id: "not_started", title: "Not started", items: byStatus("not_started") },
      { id: "in_progress", title: "In progress", items: byStatus("in_progress") },
      { id: "completed", title: "Completed", items: byStatus("completed") },
    ];
  }, [tasks]);

  const timelineEvents: MonthGridEvent[] = tasks
    .filter((t) => t.due_at)
    .map((t) => ({
      id: t.id,
      date: new Date(t.due_at!),
      title: t.title,
      colorClass: PRIORITY_BORDER[t.priority],
      onClick: () => setSelectedId(t.id),
    }));

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const title = newTitle;
    const dueDate = newDueDate;
    startTransition(async () => {
      const id = await createTask(title);
      if (id && dueDate) await updateTask(id, { due_at: dueDate });
    });
    setNewTitle("");
    setNewDueDate(null);
    setAddOpen(false);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-1 border border-alabaster rounded-lg p-1">
          {(["list", "board", "timeline"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-small capitalize transition-fast ${
                view === v ? "bg-carbon text-white dark:bg-tuscan dark:text-carbon" : "hover:bg-bg"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <Button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5">
          <Plus size={16} /> New task
        </Button>
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="New task"
        footer={
          <Button type="submit" form="new-task-form" className="w-full">
            Create task
          </Button>
        }
      >
        <form id="new-task-form" onSubmit={handleAdd} className="flex flex-col gap-4">
          <Input
            autoFocus
            label="Title"
            placeholder="Task title…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <DatePicker label="Due date (optional)" value={newDueDate} onChange={setNewDueDate} />
        </form>
      </Modal>

      {view === "list" && (
        <div className="border border-alabaster rounded-xl p-2">
          {tasks.length === 0 ? (
            <p className="text-small text-graphite py-8 text-center">Clear. Add one?</p>
          ) : (
            tasks.map((task) => (
              <TaskRow key={task.id} task={task} onClick={() => setSelectedId(task.id)} />
            ))
          )}
        </div>
      )}

      {view === "board" && (
        <DndBoard
          columns={columns}
          renderCard={(task) => <TaskCard task={task} onClick={() => setSelectedId(task.id)} />}
          onDrop={(taskId, status) => startTransition(() => moveTaskBoardStatus(taskId, status as TaskBoardStatus))}
        />
      )}

      {view === "timeline" && (
        <MonthGrid month={new Date()} events={timelineEvents} />
      )}

      <TaskDetailPanel task={selectedTask} onClose={() => setSelectedId(null)} />
    </div>
  );
}
