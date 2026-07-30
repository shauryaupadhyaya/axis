"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { RecurrenceFreq, RecurrenceRule } from "@/lib/types";
import { DAY_CODES, RECURRENCE_PRESETS, formatRecurrence, type DayCode } from "@/lib/tasks/recurrence";

interface RecurrencePickerProps {
  value: RecurrenceRule | null;
  onChange: (rule: RecurrenceRule | null) => void;
}

const FREQ_OPTIONS: { value: RecurrenceFreq; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

function rulesEqual(a: RecurrenceRule | null, b: RecurrenceRule | null): boolean {
  if (!a || !b) return a === b;
  if (a.freq !== b.freq || a.interval !== b.interval || a.byMonthDay !== b.byMonthDay) return false;
  const aDays = a.byDay ?? [];
  const bDays = b.byDay ?? [];
  if (aDays.length !== bDays.length) return false;
  return aDays.every((d) => bDays.includes(d));
}

export function RecurrencePicker({ value, onChange }: RecurrencePickerProps) {
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);

  const isCustomActive = value !== null && !RECURRENCE_PRESETS.some((p) => rulesEqual(p.rule, value));

  function updateCustom(patch: Partial<RecurrenceRule>) {
    const base: RecurrenceRule = value ?? { freq: "daily", interval: 1 };
    onChange({ ...base, ...patch });
  }

  function toggleDay(day: DayCode) {
    const base: RecurrenceRule = value?.freq === "weekly" ? value : { freq: "weekly", interval: 1 };
    const current = base.byDay ?? [];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    onChange({ ...base, byDay: next });
  }

  return (
    <div className="relative inline-block">
      <label className="text-label text-graphite mb-1.5 block">Repeat</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-body px-3 py-2.5 rounded-lg border border-alabaster bg-linen dark:bg-bg-secondary hover:bg-bg transition-fast text-left w-full"
      >
        {value ? formatRecurrence(value) : "Does not repeat"}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 p-3 rounded-xl border border-alabaster bg-linen dark:bg-bg-secondary shadow-[0_8px_16px_var(--shadow-color-hover)] w-[300px] flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setCustomOpen(false);
              setOpen(false);
            }}
            className={cn(
              "px-3 py-1.5 rounded-md text-small text-left transition-fast border",
              value === null
                ? "bg-carbon text-white border-carbon dark:bg-tuscan dark:text-carbon dark:border-tuscan"
                : "border-alabaster hover:bg-bg"
            )}
          >
            Does not repeat
          </button>

          <div className="flex flex-wrap gap-1.5">
            {RECURRENCE_PRESETS.map((preset) => {
              const active = rulesEqual(value, preset.rule);
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    onChange(preset.rule);
                    setCustomOpen(false);
                    setOpen(false);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-small transition-fast border",
                    active
                      ? "bg-carbon text-white border-carbon dark:bg-tuscan dark:text-carbon dark:border-tuscan"
                      : "border-alabaster hover:bg-bg"
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setCustomOpen((v) => !v)}
              className={cn(
                "px-3 py-1.5 rounded-md text-small transition-fast border",
                isCustomActive
                  ? "bg-carbon text-white border-carbon dark:bg-tuscan dark:text-carbon dark:border-tuscan"
                  : "border-alabaster hover:bg-bg"
              )}
            >
              Custom
            </button>
          </div>

          {customOpen && (
            <div className="flex flex-col gap-2 pt-2 border-t border-alabaster">
              <div className="flex items-center gap-2">
                <span className="text-small text-graphite">Every</span>
                <input
                  type="number"
                  min={1}
                  value={value?.interval ?? 1}
                  onChange={(e) => updateCustom({ interval: Math.max(1, Number(e.target.value) || 1) })}
                  className="w-16 text-body px-2 py-1.5 rounded-lg border border-alabaster bg-linen dark:bg-bg-secondary"
                />
                <select
                  value={value?.freq ?? "daily"}
                  onChange={(e) => updateCustom({ freq: e.target.value as RecurrenceFreq })}
                  className="flex-1 text-body px-2 py-1.5 rounded-lg border border-alabaster bg-linen dark:bg-bg-secondary"
                >
                  {FREQ_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {value?.freq === "weekly" && (
                <div className="flex flex-wrap gap-1">
                  {DAY_CODES.map((day) => {
                    const active = value.byDay?.includes(day) ?? false;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={cn(
                          "w-8 h-8 rounded-md text-caption transition-fast border",
                          active
                            ? "bg-carbon text-white border-carbon dark:bg-tuscan dark:text-carbon dark:border-tuscan"
                            : "border-alabaster hover:bg-bg"
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
