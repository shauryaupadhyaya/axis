import type { HabitCompletion } from "@/lib/types";

/** Consecutive-day streak ending today or yesterday (a miss today doesn't zero it until tomorrow). */
export function computeStreak(completions: HabitCompletion[], today = new Date()): number {
  const completedDates = new Set(
    completions.filter((c) => c.status === "completed").map((c) => c.completed_at)
  );

  let streak = 0;
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);

  // allow today to be incomplete without breaking the streak
  if (!completedDates.has(toISODate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (completedDates.has(toISODate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/** Longest historical run of consecutive completed days, across all completions. */
export function computeBestStreak(completions: HabitCompletion[]): number {
  const completedDates = [...new Set(completions.filter((c) => c.status === "completed").map((c) => c.completed_at))].sort();
  if (completedDates.length === 0) return 0;

  let best = 1;
  let current = 1;
  for (let i = 1; i < completedDates.length; i++) {
    const prev = new Date(completedDates[i - 1]);
    const curr = new Date(completedDates[i]);
    const dayDiff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    current = dayDiff === 1 ? current + 1 : 1;
    best = Math.max(best, current);
  }
  return best;
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function daysUntil(dateStr: string, today = new Date()): number {
  const target = new Date(dateStr);
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function computeProductivityScore(tasksDone: number, tasksTotal: number): number {
  if (tasksTotal === 0) return 0;
  return Math.round((tasksDone / tasksTotal) * 100);
}

export function computeStudyScore(minutesLogged: number, goalMinutes: number): number {
  if (goalMinutes === 0) return 0;
  return Math.min(100, Math.round((minutesLogged / goalMinutes) * 100));
}

export function computeHealthScore(
  waterMl: number,
  waterGoalMl: number,
  workoutCompleted: boolean
): number {
  const waterScore = waterGoalMl > 0 ? Math.min(100, (waterMl / waterGoalMl) * 100) : 0;
  const workoutScore = workoutCompleted ? 100 : 0;
  return Math.round(waterScore * 0.6 + workoutScore * 0.4);
}
