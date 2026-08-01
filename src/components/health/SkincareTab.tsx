"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Badge } from "@/components/ui/Badge";
import { RoutineSection } from "./skincare/RoutineSection";
import { ProductDatabase } from "./skincare/ProductDatabase";
import { SkinJournal } from "./skincare/SkinJournal";
import type { SkincareCompletion, SkincarePeriod, SkincareProduct, SkincareStep, SkinJournalEntry } from "@/lib/types";
import { toISODate } from "@/lib/scores";
import {
  PERIOD_LABELS,
  SPECIALIZED_PERIODS,
  computeAchievements,
  computeSkinScore,
  computeSkincareStreak,
  groupStepsByPeriod,
  todaysCompletionPercent,
} from "@/lib/skincare";

export function SkincareTab({
  steps,
  completions,
  products = [],
  journalEntries = [],
}: {
  steps: SkincareStep[];
  completions: SkincareCompletion[];
  products?: SkincareProduct[];
  journalEntries?: SkinJournalEntry[];
}) {
  const [specializedOpen, setSpecializedOpen] = useState<Set<SkincarePeriod>>(
    () => new Set(SPECIALIZED_PERIODS.filter((p) => steps.some((s) => s.period === p)))
  );

  const grouped = groupStepsByPeriod(steps);
  const streak = computeSkincareStreak(steps, completions);
  const completionPct = todaysCompletionPercent(steps, completions);
  const latestJournal = [...journalEntries].sort((a, b) => (a.logged_date < b.logged_date ? 1 : -1))[0] ?? null;
  const skinScore = computeSkinScore(latestJournal, completionPct);
  const achievements = computeAchievements(streak);

  const allCompletedDates = new Set(completions.map((c) => c.completed_at));
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return toISODate(d);
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="flex flex-col items-center text-center">
          <ProgressRing percent={completionPct} size={100} />
          <p className="text-caption text-graphite mt-2">Today&apos;s completion</p>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center">
          <p className="text-display">{streak}</p>
          <p className="text-caption text-graphite">day streak</p>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center">
          <p className="text-display">{skinScore}</p>
          <p className="text-caption text-graphite">skin score</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <RoutineSection period="am" label={PERIOD_LABELS.am} steps={grouped.get("am") ?? []} completions={completions} products={products} />
        <RoutineSection period="pm" label={PERIOD_LABELS.pm} steps={grouped.get("pm") ?? []} completions={completions} products={products} />
      </div>

      <Card>
        <h3 className="text-h3 mb-3">Achievements</h3>
        <div className="flex flex-wrap gap-2">
          {achievements.map((a) => (
            <Badge key={a.id} variant={a.unlocked ? "success" : "neutral"} className={a.unlocked ? "animate-pop-in" : "opacity-50"}>
              {a.label}
            </Badge>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <RoutineSection period="weekly" label={PERIOD_LABELS.weekly} steps={grouped.get("weekly") ?? []} completions={completions} products={products} />
        <RoutineSection period="monthly" label={PERIOD_LABELS.monthly} steps={grouped.get("monthly") ?? []} completions={completions} products={products} />
      </div>

      <Card>
        <h3 className="text-h3 mb-3">Specialized care</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {SPECIALIZED_PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setSpecializedOpen((s) => new Set(s).add(p))}
              className={`text-caption px-3 py-1.5 rounded-full border transition-fast ${
                specializedOpen.has(p) ? "border-tuscan bg-tuscan/15" : "border-alabaster hover:bg-bg"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...specializedOpen].map((p) => (
            <RoutineSection key={p} period={p} label={PERIOD_LABELS[p]} steps={grouped.get(p) ?? []} completions={completions} products={products} />
          ))}
        </div>
      </Card>

      <SkinJournal entries={journalEntries} />
      <ProductDatabase products={products} />

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-h3">Completion (30 days)</h3>
        </div>
        <div className="grid grid-cols-10 gap-1.5">
          {last30.map((day) => (
            <div
              key={day}
              title={day}
              className={`w-full aspect-square rounded ${allCompletedDates.has(day) ? "bg-success" : "bg-alabaster/20"}`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
