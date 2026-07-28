"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { SkincareCompletion, SkincarePeriod, SkincareStep } from "@/lib/types";
import { toISODate } from "@/lib/scores";
import { addSkincareStep, removeSkincareStep, toggleSkincareStepToday } from "@/app/(app)/health/actions";

function computeStreak(completedDates: Set<string>): number {
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!completedDates.has(toISODate(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (completedDates.has(toISODate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function SkincareTab({
  steps,
  completions,
}: {
  steps: SkincareStep[];
  completions: SkincareCompletion[];
}) {
  const [, startTransition] = useTransition();
  const [newStepName, setNewStepName] = useState<Record<SkincarePeriod, string>>({ am: "", pm: "" });
  const today = toISODate(new Date());

  const completionsByStep = new Map<string, Set<string>>();
  for (const c of completions) {
    if (!completionsByStep.has(c.step_id)) completionsByStep.set(c.step_id, new Set());
    completionsByStep.get(c.step_id)!.add(c.completed_at);
  }

  const allCompletedDates = new Set(completions.map((c) => c.completed_at));
  const streak = computeStreak(allCompletedDates);

  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return toISODate(d);
  });

  function renderPeriod(period: SkincarePeriod, label: string) {
    const periodSteps = steps.filter((s) => s.period === period);
    return (
      <Card>
        <h3 className="text-h3 mb-3">{label}</h3>
        <ul className="flex flex-col gap-2 mb-3">
          {periodSteps.map((step) => {
            const done = completionsByStep.get(step.id)?.has(today) ?? false;
            return (
              <li key={step.id} className="flex items-center gap-2">
                <button
                  onClick={() => startTransition(() => toggleSkincareStepToday(step.id, !done))}
                  className={`w-5 h-5 rounded-full border-2 shrink-0 transition-fast ${
                    done ? "bg-success border-success" : "border-alabaster"
                  }`}
                  aria-label={done ? "Mark not done" : "Mark done"}
                />
                <span className={`flex-1 text-body ${done ? "opacity-50" : ""}`}>{step.name}</span>
                <button
                  aria-label="Remove step"
                  onClick={() => startTransition(() => removeSkincareStep(step.id))}
                >
                  <X size={14} className="text-graphite" />
                </button>
              </li>
            );
          })}
          {periodSteps.length === 0 && <p className="text-small text-graphite">No steps yet.</p>}
        </ul>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newStepName[period].trim()) return;
            startTransition(() => addSkincareStep(period, newStepName[period]));
            setNewStepName((s) => ({ ...s, [period]: "" }));
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="Add step…"
            value={newStepName[period]}
            onChange={(e) => setNewStepName((s) => ({ ...s, [period]: e.target.value }))}
            className="flex-1"
          />
          <Button type="submit" variant="icon" aria-label={`Add ${period} step`}>
            <Plus size={16} />
          </Button>
        </form>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {renderPeriod("am", "AM routine")}
        {renderPeriod("pm", "PM routine")}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-h3">Completion (30 days)</h3>
          <span className="text-mono text-graphite">{streak} day streak</span>
        </div>
        <div className="grid grid-cols-10 gap-1.5">
          {last30.map((day) => (
            <div
              key={day}
              title={day}
              className={`w-full aspect-square rounded ${
                allCompletedDates.has(day) ? "bg-success" : "bg-alabaster/20"
              }`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
