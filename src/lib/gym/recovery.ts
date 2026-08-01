import type { WorkoutExercise, WorkoutSet } from "@/lib/types";

export interface MuscleRecoveryState {
  muscleGroup: string;
  percent: number; // 0-100
  hoursSinceTrained: number | null;
  insight: string;
}

/**
 * Heuristic recovery model: each muscle group needs a base 48h to recover,
 * extended by how much volume/intensity was thrown at it last session (up
 * to +36h for a very heavy, high-RPE session). Percent recovered scales
 * linearly with elapsed time against that window.
 */
export function computeMuscleRecoveryPercent(
  exercises: WorkoutExercise[],
  sets: WorkoutSet[],
  now = new Date()
): MuscleRecoveryState[] {
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));
  const byMuscle = new Map<string, { lastTime: number; volume: number; maxRpe: number }>();

  for (const set of sets) {
    if (!set.completed || !set.logged_at) continue;
    const exercise = exerciseById.get(set.workout_exercise_id);
    if (!exercise) continue;
    const time = new Date(set.logged_at).getTime();
    const existing = byMuscle.get(exercise.muscle_group);
    const setVolume = set.weight * set.reps;
    if (!existing || time > existing.lastTime) {
      // new most-recent session for this muscle: reset volume accumulation to same-day sets
      const sameDaySets = sets.filter((s) => {
        const ex = exerciseById.get(s.workout_exercise_id);
        return (
          ex?.muscle_group === exercise.muscle_group &&
          s.completed &&
          s.logged_at &&
          new Date(s.logged_at).toDateString() === new Date(time).toDateString()
        );
      });
      const volume = sameDaySets.reduce((sum, s) => sum + s.weight * s.reps, 0);
      const maxRpe = Math.max(0, ...sameDaySets.map((s) => s.rpe ?? 0));
      byMuscle.set(exercise.muscle_group, { lastTime: time, volume, maxRpe });
    } else if (existing) {
      existing.volume += setVolume;
    }
  }

  const muscleGroups = new Set(exercises.map((e) => e.muscle_group));
  return Array.from(muscleGroups).map((muscleGroup) => {
    const state = byMuscle.get(muscleGroup);
    if (!state) {
      return { muscleGroup, percent: 100, hoursSinceTrained: null, insight: `${muscleGroup} hasn't been trained yet.` };
    }
    const hoursSince = (now.getTime() - state.lastTime) / (1000 * 60 * 60);
    const volumeFactor = Math.min(24, (state.volume / 3000) * 24);
    const intensityFactor = state.maxRpe >= 8 ? 12 : state.maxRpe >= 6 ? 6 : 0;
    const recoveryWindowHours = 48 + volumeFactor + intensityFactor;
    const percent = Math.round(Math.max(0, Math.min(100, (hoursSince / recoveryWindowHours) * 100)));

    let insight: string;
    if (percent >= 95) insight = `${muscleGroup} fully recovered — ready to train.`;
    else if (percent >= 70) insight = `${muscleGroup} mostly recovered.`;
    else if (percent >= 40) {
      const hoursLeft = Math.max(1, Math.round(recoveryWindowHours - hoursSince));
      insight = `${muscleGroup} needs another ${hoursLeft}h.`;
    } else insight = `${muscleGroup} may be overtrained — consider resting it.`;

    return { muscleGroup, percent, hoursSinceTrained: Math.round(hoursSince), insight };
  });
}
