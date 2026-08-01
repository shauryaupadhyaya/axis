import type { SkincareCompletion, SkincarePeriod, SkincareStep, SkinJournalEntry } from "@/lib/types";
import { toISODate } from "@/lib/scores";

export const PERIOD_LABELS: Record<SkincarePeriod, string> = {
  am: "Morning",
  pm: "Evening",
  weekly: "Weekly",
  monthly: "Monthly",
  mask: "Face mask",
  eye_mask: "Under-eye mask",
  hair: "Hair treatment",
  lip: "Lip treatment",
  foot: "Foot treatment",
  nail: "Nail treatment",
  custom: "Custom",
};

export const DAILY_PERIODS: SkincarePeriod[] = ["am", "pm"];
export const SPECIALIZED_PERIODS: SkincarePeriod[] = ["mask", "eye_mask", "hair", "lip", "foot", "nail"];
export const SCHEDULED_PERIODS: SkincarePeriod[] = ["weekly", "monthly", "custom"];

/** Consecutive-day streak of "did at least one daily-routine step" ending today or yesterday. */
export function computeSkincareStreak(steps: SkincareStep[], completions: SkincareCompletion[]): number {
  const dailyStepIds = new Set(steps.filter((s) => DAILY_PERIODS.includes(s.period)).map((s) => s.id));
  const completedDates = new Set(completions.filter((c) => dailyStepIds.has(c.step_id)).map((c) => c.completed_at));

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

export function todaysCompletionPercent(
  steps: SkincareStep[],
  completions: SkincareCompletion[],
  today = toISODate(new Date())
): number {
  const dailySteps = steps.filter((s) => DAILY_PERIODS.includes(s.period));
  if (dailySteps.length === 0) return 0;
  const completedIds = new Set(completions.filter((c) => c.completed_at === today).map((c) => c.step_id));
  const done = dailySteps.filter((s) => completedIds.has(s.id)).length;
  return Math.round((done / dailySteps.length) * 100);
}

/** 0-100: blends the latest skin-journal condition reading with routine completion. */
export function computeSkinScore(latestEntry: SkinJournalEntry | null, completionPercent: number): number {
  const conditionScore = latestEntry
    ? 100 -
      ((latestEntry.acne +
        latestEntry.redness +
        latestEntry.dryness +
        latestEntry.oiliness +
        latestEntry.irritation +
        latestEntry.sensitivity) /
        6) *
        10
    : 70;
  return Math.round(conditionScore * 0.5 + completionPercent * 0.5);
}

export interface Achievement {
  id: string;
  label: string;
  threshold: number;
  unlocked: boolean;
}

export function computeAchievements(streak: number): Achievement[] {
  return [
    { id: "streak-7", label: "7-day streak", threshold: 7, unlocked: streak >= 7 },
    { id: "streak-30", label: "30-day streak", threshold: 30, unlocked: streak >= 30 },
    { id: "streak-100", label: "100-day streak", threshold: 100, unlocked: streak >= 100 },
    { id: "consistency-master", label: "Consistency master", threshold: 60, unlocked: streak >= 60 },
  ];
}

export function groupStepsByPeriod(steps: SkincareStep[]): Map<SkincarePeriod, SkincareStep[]> {
  const map = new Map<SkincarePeriod, SkincareStep[]>();
  for (const step of steps) {
    const list = map.get(step.period) ?? [];
    list.push(step);
    map.set(
      step.period,
      [...list].sort((a, b) => a.position - b.position)
    );
  }
  return map;
}
