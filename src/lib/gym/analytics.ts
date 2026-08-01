import type { Workout, WorkoutExercise, WorkoutSet } from "@/lib/types";
import { toISODate } from "@/lib/scores";

function completedSets(sets: WorkoutSet[]) {
  return sets.filter((s) => s.completed && s.logged_at);
}

function volumeInRange(sets: WorkoutSet[], fromIso: string, toIso: string): number {
  return completedSets(sets)
    .filter((s) => {
      const d = s.logged_at!.slice(0, 10);
      return d >= fromIso && d <= toIso;
    })
    .reduce((sum, s) => sum + s.weight * s.reps, 0);
}

export interface VolumeSummary {
  today: number;
  week: number;
  month: number;
  lifetime: number;
}

export function computeVolumeSummary(sets: WorkoutSet[], now = new Date()): VolumeSummary {
  const today = toISODate(now);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 29);
  const epoch = "0000-01-01";

  return {
    today: volumeInRange(sets, today, today),
    week: volumeInRange(sets, toISODate(weekAgo), today),
    month: volumeInRange(sets, toISODate(monthAgo), today),
    lifetime: volumeInRange(sets, epoch, today),
  };
}

export interface TrainingTimeSummary {
  totalHours: number;
  averageSessionMinutes: number;
  weekHours: number;
  monthHours: number;
}

export function computeTrainingTime(workouts: Workout[], now = new Date()): TrainingTimeSummary {
  const finished = workouts.filter((w) => w.started_at && w.ended_at);
  const durations = finished.map((w) => (new Date(w.ended_at!).getTime() - new Date(w.started_at!).getTime()) / 60000);
  const totalMinutes = durations.reduce((a, b) => a + b, 0);

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 29);

  const weekMinutes = finished
    .filter((w) => new Date(w.started_at!) >= weekAgo)
    .reduce((sum, w) => sum + (new Date(w.ended_at!).getTime() - new Date(w.started_at!).getTime()) / 60000, 0);
  const monthMinutes = finished
    .filter((w) => new Date(w.started_at!) >= monthAgo)
    .reduce((sum, w) => sum + (new Date(w.ended_at!).getTime() - new Date(w.started_at!).getTime()) / 60000, 0);

  return {
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    averageSessionMinutes: durations.length ? Math.round(totalMinutes / durations.length) : 0,
    weekHours: Math.round((weekMinutes / 60) * 10) / 10,
    monthHours: Math.round((monthMinutes / 60) * 10) / 10,
  };
}

export interface WorkoutStats {
  workoutsCompleted: number;
  exercisesCompleted: number;
  setsCompleted: number;
  repsCompleted: number;
  estimatedCalories: number;
  consistencyScore: number; // % of last 30 days with a completed workout... normalized over weeks trained
}

/** ~5.5 kcal per kg of volume lifted — a rough MET-based estimate, not clinical. */
export function computeWorkoutStats(workouts: Workout[], exercises: WorkoutExercise[], sets: WorkoutSet[]): WorkoutStats {
  const done = completedSets(sets);
  const repsCompleted = done.reduce((sum, s) => sum + s.reps, 0);
  const volume = done.reduce((sum, s) => sum + s.weight * s.reps, 0);
  const completedWorkouts = workouts.filter((w) => w.status === "completed");

  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const recentCompleted = completedWorkouts.filter((w) => new Date(w.scheduled_date) >= fourWeeksAgo);
  // 3 workouts/week is treated as a fully consistent baseline.
  const consistencyScore = Math.min(100, Math.round((recentCompleted.length / 12) * 100));

  return {
    workoutsCompleted: completedWorkouts.length,
    exercisesCompleted: exercises.length,
    setsCompleted: done.length,
    repsCompleted,
    estimatedCalories: Math.round(volume * 0.055),
    consistencyScore,
  };
}

export interface TrophyCard {
  id: string;
  label: string;
  value: string;
  exerciseName?: string;
  achievedAt: string;
}

export function computeTrophies(exercises: WorkoutExercise[], sets: WorkoutSet[], workouts: Workout[]): TrophyCard[] {
  const done = completedSets(sets);
  const trophies: TrophyCard[] = [];
  const exerciseName = new Map(exercises.map((e) => [e.id, e.name]));

  const heaviest = [...done].sort((a, b) => b.weight - a.weight)[0];
  if (heaviest) {
    trophies.push({
      id: "heaviest",
      label: "Heaviest weight",
      value: `${heaviest.weight}kg`,
      exerciseName: exerciseName.get(heaviest.workout_exercise_id),
      achievedAt: heaviest.logged_at!,
    });
  }

  const mostReps = [...done].sort((a, b) => b.reps - a.reps)[0];
  if (mostReps) {
    trophies.push({
      id: "most-reps",
      label: "Most reps in a set",
      value: `${mostReps.reps} reps`,
      exerciseName: exerciseName.get(mostReps.workout_exercise_id),
      achievedAt: mostReps.logged_at!,
    });
  }

  const byExerciseVolume = new Map<string, { volume: number; set: WorkoutSet }>();
  for (const s of done) {
    const v = s.weight * s.reps;
    const existing = byExerciseVolume.get(s.workout_exercise_id);
    if (!existing || v > existing.volume) byExerciseVolume.set(s.workout_exercise_id, { volume: v, set: s });
  }
  const highestVolume = [...byExerciseVolume.values()].sort((a, b) => b.volume - a.volume)[0];
  if (highestVolume) {
    trophies.push({
      id: "highest-volume-set",
      label: "Highest volume set",
      value: `${highestVolume.volume}kg`,
      exerciseName: exerciseName.get(highestVolume.set.workout_exercise_id),
      achievedAt: highestVolume.set.logged_at!,
    });
  }

  const longest = [...workouts]
    .filter((w) => w.started_at && w.ended_at)
    .sort(
      (a, b) =>
        new Date(b.ended_at!).getTime() - new Date(b.started_at!).getTime() - (new Date(a.ended_at!).getTime() - new Date(a.started_at!).getTime())
    )[0];
  if (longest) {
    const minutes = Math.round((new Date(longest.ended_at!).getTime() - new Date(longest.started_at!).getTime()) / 60000);
    trophies.push({ id: "longest-workout", label: "Longest workout", value: `${minutes} min`, exerciseName: longest.name, achievedAt: longest.started_at! });
  }

  return trophies;
}
