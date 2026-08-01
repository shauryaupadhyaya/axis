"use client";

import { useState, useTransition } from "react";
import { Play, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RoutineExecutionModal } from "./RoutineExecutionModal";
import type { SkincareCompletion, SkincarePeriod, SkincareProduct, SkincareStep, SkincareStepType } from "@/lib/types";
import { toISODate } from "@/lib/scores";
import { addSkincareStep, removeSkincareStep, toggleSkincareStepToday } from "@/app/(app)/health/actions";

const STEP_TYPES: SkincareStepType[] = [
  "cleanser",
  "toner",
  "serum",
  "moisturizer",
  "sunscreen",
  "retinol",
  "exfoliant",
  "mask",
  "other",
];

export function RoutineSection({
  period,
  label,
  steps,
  completions,
  products,
}: {
  period: SkincarePeriod;
  label: string;
  steps: SkincareStep[];
  completions: SkincareCompletion[];
  products: SkincareProduct[];
}) {
  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    stepType: "other" as SkincareStepType,
    durationSeconds: 60,
    instructions: "",
    productId: "",
  });
  const today = toISODate(new Date());
  const completedToday = new Set(completions.filter((c) => c.completed_at === today).map((c) => c.step_id));

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-h3">{label}</h3>
        <div className="flex items-center gap-2">
          {steps.length > 0 && (
            <button
              onClick={() => setExecuting(true)}
              className="flex items-center gap-1 text-caption px-2.5 py-1.5 rounded-md bg-tuscan/20 hover:bg-tuscan/30 transition-fast"
            >
              <Play size={12} /> Start
            </button>
          )}
          <button aria-label="Add step" onClick={() => setAdding((v) => !v)}>
            <Plus size={16} />
          </button>
        </div>
      </div>

      <ul className="flex flex-col gap-2 mb-2">
        {steps.map((step) => {
          const done = completedToday.has(step.id);
          const product = products.find((p) => p.id === step.product_id);
          return (
            <li key={step.id} className="flex items-center gap-2">
              <button
                onClick={() => startTransition(() => toggleSkincareStepToday(step.id, !done))}
                className={`w-5 h-5 rounded-full border-2 shrink-0 transition-fast ${
                  done ? "bg-success border-success" : "border-alabaster"
                }`}
                aria-label={done ? "Mark not done" : "Mark done"}
              />
              <div className="flex-1 min-w-0">
                <span className={`text-body block ${done ? "opacity-50" : ""}`}>{step.name}</span>
                {product && <span className="text-[10px] text-graphite">{product.name}</span>}
              </div>
              <span className="text-[10px] text-graphite text-mono">{step.duration_seconds}s</span>
              <button aria-label="Remove step" onClick={() => startTransition(() => removeSkincareStep(step.id))}>
                <X size={14} className="text-graphite" />
              </button>
            </li>
          );
        })}
        {steps.length === 0 && !adding && <p className="text-small text-graphite">No steps yet.</p>}
      </ul>

      {adding && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.name.trim()) return;
            startTransition(() =>
              addSkincareStep(period, draft.name, {
                stepType: draft.stepType,
                durationSeconds: draft.durationSeconds,
                instructions: draft.instructions || undefined,
                productId: draft.productId || null,
              })
            );
            setDraft({ name: "", stepType: "other", durationSeconds: 60, instructions: "", productId: "" });
            setAdding(false);
          }}
          className="flex flex-col gap-2 mt-2 p-3 rounded-lg bg-bg"
        >
          <Input
            placeholder="Step name (e.g. Cleanser)"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            autoFocus
          />
          <div className="flex gap-2 flex-wrap">
            <select
              value={draft.stepType}
              onChange={(e) => setDraft((d) => ({ ...d, stepType: e.target.value as SkincareStepType }))}
              className="text-small px-2 py-2 rounded-md border border-alabaster bg-linen dark:bg-bg-secondary flex-1 min-w-[120px]"
            >
              {STEP_TYPES.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t}
                </option>
              ))}
            </select>
            <Input
              type="number"
              placeholder="Duration (s)"
              value={draft.durationSeconds}
              onChange={(e) => setDraft((d) => ({ ...d, durationSeconds: Number(e.target.value) }))}
              className="w-28"
            />
            {products.length > 0 && (
              <select
                value={draft.productId}
                onChange={(e) => setDraft((d) => ({ ...d, productId: e.target.value }))}
                className="text-small px-2 py-2 rounded-md border border-alabaster bg-linen dark:bg-bg-secondary flex-1 min-w-[120px]"
              >
                <option value="">No product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <Input
            placeholder="Instructions (optional)"
            value={draft.instructions}
            onChange={(e) => setDraft((d) => ({ ...d, instructions: e.target.value }))}
          />
          <Button type="submit">Add step</Button>
        </form>
      )}

      {executing && (
        <RoutineExecutionModal steps={steps} title={label} onClose={() => setExecuting(false)} />
      )}
    </Card>
  );
}
