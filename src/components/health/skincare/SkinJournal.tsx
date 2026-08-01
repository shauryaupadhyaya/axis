"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { SkinJournalEntry } from "@/lib/types";
import { toISODate } from "@/lib/scores";
import { saveSkinJournalEntry } from "@/app/(app)/health/actions";

const METRICS: Array<{ key: keyof Pick<SkinJournalEntry, "acne" | "redness" | "dryness" | "oiliness" | "irritation" | "sensitivity">; label: string }> = [
  { key: "acne", label: "Acne" },
  { key: "redness", label: "Redness" },
  { key: "dryness", label: "Dryness" },
  { key: "oiliness", label: "Oiliness" },
  { key: "irritation", label: "Irritation" },
  { key: "sensitivity", label: "Sensitivity" },
];

const MOODS = ["😊", "🙂", "😐", "😕", "😣"];

export function SkinJournal({ entries }: { entries: SkinJournalEntry[] }) {
  const [, startTransition] = useTransition();
  const today = toISODate(new Date());
  const todayEntry = entries.find((e) => e.logged_date === today) ?? null;

  const [values, setValues] = useState({
    acne: todayEntry?.acne ?? 0,
    redness: todayEntry?.redness ?? 0,
    dryness: todayEntry?.dryness ?? 0,
    oiliness: todayEntry?.oiliness ?? 0,
    irritation: todayEntry?.irritation ?? 0,
    sensitivity: todayEntry?.sensitivity ?? 0,
    mood: todayEntry?.mood ?? "",
    notes: todayEntry?.notes ?? "",
  });
  const [saved, setSaved] = useState(false);

  return (
    <Card>
      <h3 className="text-h3 mb-3">Skin journal</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {METRICS.map((m) => (
          <div key={m.key}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-caption text-graphite">{m.label}</label>
              <span className="text-mono text-caption">{values[m.key]}</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={values[m.key]}
              onChange={(e) => {
                setSaved(false);
                setValues((v) => ({ ...v, [m.key]: Number(e.target.value) }));
              }}
              className="w-full accent-[var(--tuscan-sun)]"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-4">
        <span className="text-caption text-graphite mr-1">Mood</span>
        {MOODS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              setSaved(false);
              setValues((v) => ({ ...v, mood: emoji }));
            }}
            className={`text-lg w-8 h-8 rounded-full flex items-center justify-center transition-fast ${
              values.mood === emoji ? "bg-tuscan/30" : "hover:bg-bg"
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <textarea
        placeholder="Notes for today…"
        value={values.notes}
        onChange={(e) => {
          setSaved(false);
          setValues((v) => ({ ...v, notes: e.target.value }));
        }}
        rows={2}
        className="w-full mt-3 text-small px-3 py-2 rounded-md border border-alabaster bg-linen dark:bg-bg-secondary resize-none"
      />

      <Button
        className="mt-3"
        onClick={() =>
          startTransition(() => {
            saveSkinJournalEntry(values);
            setSaved(true);
          })
        }
      >
        {saved ? "Saved ✓" : "Save today's entry"}
      </Button>
    </Card>
  );
}
