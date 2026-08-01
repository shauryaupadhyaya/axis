import type {
  BodyMeasurement,
  ProgressPhoto,
  SkincareCompletion,
  SkincareStep,
  WaterLog,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from "@/lib/types";
import { toISODate } from "@/lib/scores";
import { computeWorkoutStats } from "@/lib/gym/analytics";
import { computeMuscleRecoveryPercent } from "@/lib/gym/recovery";
import { DAILY_PERIODS } from "@/lib/skincare";

function waterPercentForDay(waterLogs: WaterLog[], goalMl: number, day: string): number {
  if (goalMl <= 0) return 0;
  const total = waterLogs.filter((w) => w.logged_at.slice(0, 10) === day).reduce((s, w) => s + w.amount_ml, 0);
  return Math.min(100, (total / goalMl) * 100);
}

function skincarePercentForDay(steps: SkincareStep[], completions: SkincareCompletion[], day: string): number {
  const dailySteps = steps.filter((s) => DAILY_PERIODS.includes(s.period));
  if (dailySteps.length === 0) return 0;
  const completedIds = new Set(completions.filter((c) => c.completed_at === day).map((c) => c.step_id));
  const done = dailySteps.filter((s) => completedIds.has(s.id)).length;
  return (done / dailySteps.length) * 100;
}

function gymPercentForDay(workouts: Workout[], day: string): number {
  return workouts.some((w) => w.scheduled_date === day && w.status === "completed") ? 100 : 0;
}

export interface HealthScoreInputs {
  waterLogs: WaterLog[];
  waterGoalMl: number;
  skincareSteps: SkincareStep[];
  skincareCompletions: SkincareCompletion[];
  workouts: Workout[];
  workoutExercises: WorkoutExercise[];
  workoutSets: WorkoutSet[];
  progressPhotos: ProgressPhoto[];
  bodyMeasurements: BodyMeasurement[];
}

export interface HealthScoreBreakdown {
  overall: number;
  workoutConsistency: number;
  waterConsistency: number;
  skincareConsistency: number;
  progressTrackingConsistency: number;
  recoveryScore: number;
}

/** Blends five sub-scores (25/25/25/15/10 weighting) into one 0-100 Health Score. */
export function computeHealthScoreBreakdown(inputs: HealthScoreInputs, now = new Date()): HealthScoreBreakdown {
  const stats = computeWorkoutStats(inputs.workouts, inputs.workoutExercises, inputs.workoutSets);
  const workoutConsistency = stats.consistencyScore;

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    return toISODate(d);
  });
  const waterConsistency = Math.round(
    last7.reduce((sum, d) => sum + (waterPercentForDay(inputs.waterLogs, inputs.waterGoalMl, d) >= 100 ? 100 : 0), 0) / 7
  );
  const skincareConsistency = Math.round(
    last7.reduce((sum, d) => sum + skincarePercentForDay(inputs.skincareSteps, inputs.skincareCompletions, d), 0) / 7
  );

  const lastPhoto = [...inputs.progressPhotos].sort((a, b) => (a.taken_at < b.taken_at ? 1 : -1))[0];
  const lastMeasurement = [...inputs.bodyMeasurements].sort((a, b) => (a.logged_date < b.logged_date ? 1 : -1))[0];
  const lastTrackedDate = [lastPhoto?.taken_at, lastMeasurement?.logged_date].filter(Boolean).sort().pop();
  let progressTrackingConsistency = 30;
  if (lastTrackedDate) {
    const daysSince = Math.floor((now.getTime() - new Date(lastTrackedDate).getTime()) / (1000 * 60 * 60 * 24));
    progressTrackingConsistency = Math.round(Math.max(0, 100 - daysSince * 5));
  }

  const recovery = computeMuscleRecoveryPercent(inputs.workoutExercises, inputs.workoutSets, now);
  const recoveryScore = recovery.length > 0 ? Math.round(recovery.reduce((s, r) => s + r.percent, 0) / recovery.length) : 100;

  const overall = Math.round(
    workoutConsistency * 0.25 + waterConsistency * 0.25 + skincareConsistency * 0.25 + progressTrackingConsistency * 0.15 + recoveryScore * 0.1
  );

  return { overall, workoutConsistency, waterConsistency, skincareConsistency, progressTrackingConsistency, recoveryScore };
}

export interface TrendPoint {
  label: string;
  score: number;
}

export function computeWeeklyTrend(inputs: HealthScoreInputs, now = new Date()): TrendPoint[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const day = toISODate(d);
    const water = waterPercentForDay(inputs.waterLogs, inputs.waterGoalMl, day);
    const skincare = skincarePercentForDay(inputs.skincareSteps, inputs.skincareCompletions, day);
    const gym = gymPercentForDay(inputs.workouts, day);
    return { label: d.toLocaleDateString("en-US", { weekday: "short" }), score: Math.round((water + skincare + gym) / 3) };
  });
}

export function computeMonthlyTrend(inputs: HealthScoreInputs, now = new Date()): TrendPoint[] {
  const weeks = 8;
  return Array.from({ length: weeks }, (_, i) => {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - (weeks - 1 - i) * 7);
    const days = Array.from({ length: 7 }, (_, j) => {
      const d = new Date(weekEnd);
      d.setDate(d.getDate() - j);
      return toISODate(d);
    });
    const avg =
      days.reduce((sum, day) => {
        const water = waterPercentForDay(inputs.waterLogs, inputs.waterGoalMl, day);
        const skincare = skincarePercentForDay(inputs.skincareSteps, inputs.skincareCompletions, day);
        const gym = gymPercentForDay(inputs.workouts, day);
        return sum + (water + skincare + gym) / 3;
      }, 0) / days.length;
    return { label: `${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`, score: Math.round(avg) };
  });
}
