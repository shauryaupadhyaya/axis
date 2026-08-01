import type { UserSettings, WaterContainer, WaterLog } from "@/lib/types";
import { toISODate } from "@/lib/scores";

export interface ContainerPreset {
  id: string;
  name: string;
  volumeMl: number;
  icon: "glass-sm" | "glass-md" | "glass-lg" | "bottle" | "sports-bottle" | "mug" | "smart-bottle";
}

/** Preset container library per the spec — static, not user-editable. */
export const CONTAINER_PRESETS: ContainerPreset[] = [
  { id: "preset-small-glass", name: "Small Glass", volumeMl: 150, icon: "glass-sm" },
  { id: "preset-medium-glass", name: "Medium Glass", volumeMl: 250, icon: "glass-md" },
  { id: "preset-large-glass", name: "Large Glass", volumeMl: 400, icon: "glass-lg" },
  { id: "preset-bottle", name: "Water Bottle", volumeMl: 500, icon: "bottle" },
  { id: "preset-sports-bottle", name: "Sports Bottle", volumeMl: 750, icon: "sports-bottle" },
  { id: "preset-mug", name: "Mug", volumeMl: 300, icon: "mug" },
  { id: "preset-smart-bottle", name: "Smart Bottle", volumeMl: 1000, icon: "smart-bottle" },
];

const ACTIVITY_BONUS_ML: Record<UserSettings["activity_level"], number> = {
  sedentary: 0,
  light: 250,
  moderate: 500,
  active: 750,
  very_active: 1000,
};

/**
 * Heuristic hydration target: ~35ml per kg bodyweight (a standard rule of
 * thumb), plus an activity-level bonus, plus extra on days a workout was
 * logged. Falls back to a sensible default when the user hasn't filled in
 * their profile yet. Clamped to a safe 1.5L–6L range.
 */
export function computeSmartWaterGoal(settings: UserSettings | null, workedOutToday: boolean): number {
  if (!settings?.weight_kg) return 3000;
  const base = settings.weight_kg * 35;
  const activityBonus = ACTIVITY_BONUS_ML[settings.activity_level] ?? 0;
  const workoutBonus = workedOutToday ? 500 : 0;
  return Math.round(Math.min(6000, Math.max(1500, base + activityBonus + workoutBonus)) / 50) * 50;
}

export function totalForDay(logs: WaterLog[], isoDate: string): number {
  return logs.filter((l) => l.logged_at.slice(0, 10) === isoDate).reduce((sum, l) => sum + l.amount_ml, 0);
}

/** Consecutive days ending today/yesterday where intake met the goal. */
export function computeWaterStreak(logs: WaterLog[], goalMl: number, today = new Date()): number {
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  if (totalForDay(logs, toISODate(cursor)) < goalMl) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (totalForDay(logs, toISODate(cursor)) >= goalMl) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface DayBucket {
  day: string;
  amountMl: number;
}

export function bucketByDay(logs: WaterLog[], days: number, today = new Date()): DayBucket[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    const day = toISODate(d);
    return { day, amountMl: totalForDay(logs, day) };
  });
}

export interface MonthBucket {
  month: string; // YYYY-MM
  amountMl: number;
}

export function bucketByMonth(logs: WaterLog[], months: number, today = new Date()): MonthBucket[] {
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (months - 1 - i), 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const amountMl = logs
      .filter((l) => l.logged_at.slice(0, 7) === monthKey)
      .reduce((sum, l) => sum + l.amount_ml, 0);
    return { month: monthKey, amountMl };
  });
}

export function allContainers(custom: WaterContainer[]): Array<{ id: string; name: string; volumeMl: number; icon: string }> {
  return [
    ...CONTAINER_PRESETS.map((p) => ({ id: p.id, name: p.name, volumeMl: p.volumeMl, icon: p.icon })),
    ...custom.map((c) => ({ id: c.id, name: c.name, volumeMl: c.volume_ml, icon: c.icon })),
  ];
}
