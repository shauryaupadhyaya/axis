"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { HabitHeatmap } from "./HabitHeatmap";
import type { Habit, HabitCompletion, HabitFrequency } from "@/lib/types";
import { computeBestStreak, computeStreak, toISODate } from "@/lib/scores";
import {
  createHabit,
  deleteHabit,
  toggleHabitToday,
  updateHabitFrequency,
} from "@/app/(app)/habits/actions";

export function HabitsPageView({
  habits,
  completions,
}: {
  habits: Habit[];
  completions: HabitCompletion[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<HabitFrequency>("daily");
  const [, startTransition] = useTransition();
  const today = toISODate(new Date());

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(() => createHabit(name, frequency));
    setName("");
    setFrequency("daily");
    setAddOpen(false);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-h1">Habits</h1>
        <Button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5">
          <Plus size={16} /> New habit
        </Button>
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="New habit"
        footer={
          <Button type="submit" form="new-habit-form" className="w-full">
            Create habit
          </Button>
        }
      >
        <form id="new-habit-form" onSubmit={handleAdd} className="flex flex-col gap-4">
          <Input autoFocus label="Habit name" value={name} onChange={(e) => setName(e.target.value)} />
          <div>
            <label className="text-label text-graphite mb-1.5 block">Frequency</label>
            <div className="flex gap-1.5">
              {(["daily", "weekly"] as HabitFrequency[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={`px-3 py-1.5 rounded-md text-small capitalize border transition-fast ${
                    frequency === f
                      ? "bg-carbon text-white border-carbon dark:bg-tuscan dark:text-carbon dark:border-tuscan"
                      : "border-alabaster hover:bg-bg"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {habits.length === 0 ? (
        <p className="text-small text-graphite py-8 text-center">No habits yet — add one to get started.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {habits.map((habit) => {
            const habitCompletions = completions.filter((c) => c.habit_id === habit.id);
            const doneToday = habitCompletions.some((c) => c.completed_at === today && c.status === "completed");
            const streak = computeStreak(habitCompletions);
            const bestStreak = computeBestStreak(habitCompletions);
            const expanded = expandedId === habit.id;
            const recentHistory = [...habitCompletions]
              .sort((a, b) => b.completed_at.localeCompare(a.completed_at))
              .slice(0, 30);

            return (
              <Card key={habit.id}>
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={doneToday}
                    onChange={(e) => startTransition(() => toggleHabitToday(habit.id, e.target.checked))}
                  />
                  <div className="flex-1">
                    <p className={`text-body ${doneToday ? "opacity-50" : ""}`}>{habit.name}</p>
                    <p className="text-caption text-graphite capitalize">{habit.frequency}</p>
                  </div>
                  <span className="text-mono text-graphite">{streak} 🔥</span>
                  <button
                    aria-label={expanded ? "Collapse" : "Expand"}
                    onClick={() => setExpandedId(expanded ? null : habit.id)}
                    className="w-8 h-8 rounded-md hover:bg-bg flex items-center justify-center transition-fast"
                  >
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {expanded && (
                  <div className="mt-4 pt-4 border-t border-alabaster flex flex-col gap-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-label text-graphite">Frequency</label>
                        {(["daily", "weekly"] as HabitFrequency[]).map((f) => (
                          <button
                            key={f}
                            onClick={() => startTransition(() => updateHabitFrequency(habit.id, f))}
                            className={`px-2.5 py-1 rounded-md text-small capitalize border transition-fast ${
                              habit.frequency === f
                                ? "bg-carbon text-white border-carbon dark:bg-tuscan dark:text-carbon dark:border-tuscan"
                                : "border-alabaster hover:bg-bg"
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-small text-graphite">
                          Best streak: <span className="text-mono text-text">{bestStreak}</span>
                        </span>
                        <button
                          aria-label="Delete habit"
                          onClick={() => {
                            if (confirm("Delete this habit? This cannot be undone.")) {
                              startTransition(() => deleteHabit(habit.id));
                            }
                          }}
                        >
                          <Trash2 size={14} className="text-graphite hover:text-danger transition-fast" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-label text-graphite mb-2">52-week history</p>
                      <HabitHeatmap completions={habitCompletions} />
                    </div>

                    <div>
                      <p className="text-label text-graphite mb-2">Last 30 days</p>
                      {recentHistory.length === 0 ? (
                        <p className="text-small text-graphite">No completions logged yet.</p>
                      ) : (
                        <ul className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                          {recentHistory.map((c) => (
                            <li key={c.id} className="flex items-center justify-between text-small">
                              <span className="text-mono text-graphite">
                                {new Date(c.completed_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  weekday: "short",
                                })}
                              </span>
                              <span className={c.status === "completed" ? "text-success" : "text-danger"}>
                                {c.status === "completed" ? "Completed" : "Skipped"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
