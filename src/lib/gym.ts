import type { WorkoutExercise, WorkoutSet } from "@/lib/types";

export interface PersonalRecord {
  exerciseName: string;
  maxWeight: number;
  achievedAt: string;
  isRecent: boolean; // achieved within the last 7 days
}

/** Best (max weight) completed set per exercise name, across all workouts. */
export function computePersonalRecords(
  exercises: WorkoutExercise[],
  sets: WorkoutSet[]
): PersonalRecord[] {
  const exerciseNameById = new Map(exercises.map((e) => [e.id, e.name]));
  const bestByName = new Map<string, PersonalRecord>();

  for (const set of sets) {
    if (!set.completed || !set.logged_at) continue;
    const name = exerciseNameById.get(set.workout_exercise_id);
    if (!name) continue;
    const existing = bestByName.get(name);
    if (!existing || set.weight > existing.maxWeight) {
      bestByName.set(name, {
        exerciseName: name,
        maxWeight: set.weight,
        achievedAt: set.logged_at,
        isRecent: Date.now() - new Date(set.logged_at).getTime() < 7 * 24 * 60 * 60 * 1000,
      });
    }
  }

  return Array.from(bestByName.values()).sort((a, b) => b.maxWeight - a.maxWeight);
}

export interface MuscleRecovery {
  muscleGroup: string;
  daysSinceLastTrained: number | null;
}

/** Days since a muscle group was last touched by a completed set, across all workouts. */
export function computeMuscleRecovery(
  exercises: WorkoutExercise[],
  sets: WorkoutSet[]
): MuscleRecovery[] {
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));
  const lastTrainedByMuscle = new Map<string, number>();

  for (const set of sets) {
    if (!set.completed || !set.logged_at) continue;
    const exercise = exerciseById.get(set.workout_exercise_id);
    if (!exercise) continue;
    const time = new Date(set.logged_at).getTime();
    const existing = lastTrainedByMuscle.get(exercise.muscle_group);
    if (!existing || time > existing) {
      lastTrainedByMuscle.set(exercise.muscle_group, time);
    }
  }

  const muscleGroups = new Set(exercises.map((e) => e.muscle_group));
  return Array.from(muscleGroups).map((muscleGroup) => {
    const lastTime = lastTrainedByMuscle.get(muscleGroup);
    return {
      muscleGroup,
      daysSinceLastTrained: lastTime ? Math.floor((Date.now() - lastTime) / (1000 * 60 * 60 * 24)) : null,
    };
  });
}

export function totalVolume(sets: WorkoutSet[]): number {
  return sets.filter((s) => s.completed).reduce((sum, s) => sum + s.weight * s.reps, 0);
}

/** Auto-generated name for a finished workout left unnamed, based on time of day. */
export function generateWorkoutName(date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "Morning Workout";
  if (hour >= 12 && hour < 14) return "Lunch Workout";
  if (hour >= 14 && hour < 18) return "Afternoon Workout";
  if (hour >= 18 && hour < 21) return "Evening Workout";
  return "Night Workout";
}
