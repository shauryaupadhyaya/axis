"use client";

import { useMemo, useState, useTransition } from "react";
import { addDays, addMonths, format, startOfDay } from "date-fns";
import { Plus, List as ListIcon, Columns3, CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { TaskListLayout } from "./TaskListLayout";
import { TaskBoardLayout } from "./TaskBoardLayout";
import { TaskCalendarLayout } from "./TaskCalendarLayout";
import { TaskCreateModal } from "./TaskCreateModal";
import { TaskDetailPanel } from "./TaskDetailPanel";
import { sortTasks, SORT_MODES, type SortMode } from "@/lib/tasks/sort";
import { PRIORITY_BADGE_CLASS, PRIORITY_LABEL, type Priority, type Task } from "@/lib/types";
import { completeTask, uncompleteTask, updateTask } from "@/app/(app)/tasks/actions";
import type { CompletionResult } from "@/lib/tasks/service";

type Scope = "inbox" | "today" | "upcoming";
type Layout = "list" | "board" | "calendar";

const PRIORITIES: Priority[] = ["urgent", "high", "medium", "low"];
const LAYOUTS: { value: Layout; icon: typeof ListIcon }[] = [
  { value: "list", icon: ListIcon },
  { value: "board", icon: Columns3 },
  { value: "calendar", icon: CalendarDays },
];

export function TasksView({ tasks }: { tasks: Task[] }) {
  const [scope, setScope] = useState<Scope>("inbox");
  const [layout, setLayout] = useState<Layout>("list");
  const [sortMode, setSortMode] = useState<SortMode>("smart");
  const [priorityFilter, setPriorityFilter] = useState<Set<Priority>>(new Set());
  const [labelFilter, setLabelFilter] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addDefaultDate, setAddDefaultDate] = useState<string | null>(null);
  const [toast, setToast] = useState<{ taskId: string; undo: CompletionResult; message: string } | null>(null);
  const [boardStart, setBoardStart] = useState(() => new Date());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [, startTransition] = useTransition();

  const selectedTask = tasks.find((t) => t.id === selectedId) ?? null;

  const allLabels = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) for (const tag of t.tags) set.add(tag);
    return Array.from(set).sort();
  }, [tasks]);

  const scoped = useMemo(() => {
    const startToday = startOfDay(new Date());
    const active = tasks.filter((t) => !t.done);
    if (scope === "today") {
      return active.filter((t) => t.due_at && new Date(t.due_at) < addDays(startToday, 1));
    }
    if (scope === "upcoming") {
      return active.filter((t) => t.due_at && new Date(t.due_at) >= startToday);
    }
    return active;
  }, [tasks, scope]);

  const filtered = useMemo(() => {
    return scoped.filter((t) => {
      if (priorityFilter.size > 0 && !priorityFilter.has(t.priority)) return false;
      if (labelFilter.size > 0 && !t.tags.some((tag) => labelFilter.has(tag))) return false;
      return true;
    });
  }, [scoped, priorityFilter, labelFilter]);

  const sorted = useMemo(() => sortTasks(filtered, sortMode), [filtered, sortMode]);

  const boardDays = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(boardStart, i)), [boardStart]);

  function shiftBoard(delta: number) {
    setBoardStart((d) => addDays(d, delta * 14));
  }

  function shiftCalendarMonth(delta: number) {
    setCalendarMonth((m) => addMonths(m, delta));
  }

  function resetToToday() {
    setBoardStart(new Date());
    setCalendarMonth(new Date());
  }

  function openCreate(defaultDate?: string | null) {
    setAddDefaultDate(defaultDate ?? null);
    setAddOpen(true);
  }

  function handleToggleComplete(taskId: string) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (task.done) {
      startTransition(() => updateTask(taskId, { done: false }));
      return;
    }
    startTransition(async () => {
      const result = await completeTask(taskId);
      setToast({
        taskId,
        undo: result,
        message: result.recurred ? "Task completed — will repeat" : "Task completed",
      });
    });
  }

  function handleUndo() {
    if (!toast) return;
    startTransition(() => uncompleteTask(toast.taskId, toast.undo));
    setToast(null);
  }

  function handleReschedule(taskId: string, isoDate: string) {
    startTransition(() => updateTask(taskId, { due_at: isoDate }));
  }

  function togglePriority(p: Priority) {
    setPriorityFilter((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  function toggleLabel(l: string) {
    setLabelFilter((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return next;
    });
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-1 border border-alabaster rounded-lg p-1">
          {(["inbox", "today", "upcoming"] as Scope[]).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`px-3 py-1.5 rounded-md text-small capitalize transition-fast ${
                scope === s ? "bg-carbon text-white dark:bg-tuscan dark:text-carbon" : "hover:bg-bg"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {scope === "upcoming" && (
            <div className="flex gap-1 border border-alabaster rounded-lg p-1">
              {LAYOUTS.map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setLayout(value)}
                  aria-label={value}
                  className={`p-1.5 rounded-md transition-fast ${
                    layout === value ? "bg-carbon text-white dark:bg-tuscan dark:text-carbon" : "hover:bg-bg"
                  }`}
                >
                  <Icon size={15} />
                </button>
              ))}
            </div>
          )}

          {scope === "upcoming" && (layout === "board" || layout === "calendar") && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => (layout === "board" ? shiftBoard(-1) : shiftCalendarMonth(-1))}
                aria-label="Previous"
                className="p-1.5 rounded-md border border-alabaster hover:bg-bg transition-fast"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={resetToToday}
                className="px-2.5 py-1.5 rounded-md border border-alabaster text-small hover:bg-bg transition-fast min-w-[92px] text-center"
              >
                {layout === "calendar" ? format(calendarMonth, "MMMM yyyy") : "Today"}
              </button>
              <button
                onClick={() => (layout === "board" ? shiftBoard(1) : shiftCalendarMonth(1))}
                aria-label="Next"
                className="p-1.5 rounded-md border border-alabaster hover:bg-bg transition-fast"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}

          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="text-small border border-alabaster rounded-lg px-2 py-1.5 bg-transparent"
          >
            {SORT_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <div className="relative">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="text-small border border-alabaster rounded-lg px-2.5 py-1.5 flex items-center gap-1 hover:bg-bg transition-fast"
            >
              Filter
              {(priorityFilter.size > 0 || labelFilter.size > 0) && <span className="w-1.5 h-1.5 rounded-full bg-tuscan" />}
              <ChevronDown size={13} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-xl border border-alabaster bg-bg-secondary p-3 shadow-lg">
                <p className="text-label text-graphite mb-1.5">Priority</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      onClick={() => togglePriority(p)}
                      className={`px-2 py-1 rounded-md text-caption border transition-fast ${
                        priorityFilter.has(p) ? PRIORITY_BADGE_CLASS[p] : "border-alabaster hover:bg-bg"
                      }`}
                    >
                      {PRIORITY_LABEL[p]}
                    </button>
                  ))}
                </div>
                {allLabels.length > 0 && (
                  <>
                    <p className="text-label text-graphite mb-1.5">Label</p>
                    <div className="flex flex-wrap gap-1.5">
                      {allLabels.map((l) => (
                        <button
                          key={l}
                          onClick={() => toggleLabel(l)}
                          className={`px-2 py-1 rounded-md text-caption border transition-fast ${
                            labelFilter.has(l)
                              ? "bg-carbon text-white border-carbon dark:bg-tuscan dark:text-carbon dark:border-tuscan"
                              : "border-alabaster hover:bg-bg"
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <Button onClick={() => openCreate()} className="flex items-center gap-1.5">
            <Plus size={16} /> Add Task
          </Button>
        </div>
      </div>

      {scope === "today" && (
        <p className="text-h3 mb-4">
          Today <span className="text-graphite font-normal">· {sorted.length} Tasks</span>
        </p>
      )}

      {(scope !== "upcoming" || layout === "list") && (
        <TaskListLayout
          tasks={sorted}
          scope={scope}
          onTaskClick={setSelectedId}
          onToggleComplete={handleToggleComplete}
          onAddTask={openCreate}
        />
      )}
      {scope === "upcoming" && layout === "board" && (
        <TaskBoardLayout tasks={sorted} days={boardDays} onTaskClick={setSelectedId} onAddTask={openCreate} onReschedule={handleReschedule} />
      )}
      {scope === "upcoming" && layout === "calendar" && (
        <TaskCalendarLayout tasks={sorted} month={calendarMonth} onTaskClick={setSelectedId} onReschedule={handleReschedule} />
      )}

      <TaskCreateModal open={addOpen} onClose={() => setAddOpen(false)} defaultDueDate={addDefaultDate} />
      <TaskDetailPanel task={selectedTask} onClose={() => setSelectedId(null)} />
      {toast && (
        <Toast message={toast.message} action={{ label: "Undo", onClick: handleUndo }} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
