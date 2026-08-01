import type { WorkoutExercise, WorkoutSet } from "@/lib/types";

export interface Suggestion {
  id: string;
  kind: "progression" | "deload" | "imbalance";
  message: string;
}

const PUSH_MUSCLES = new Set(["Chest", "Front Delts", "Side Delts", "Triceps"]);
const PULL_MUSCLES = new Set(["Back", "Lats", "Rear Delts", "Biceps", "Traps"]);

/**
 * Transparent rule-based suggestions (not ML) — surfaced under a "Smart
 * suggestions" label so users know these are heuristics, not real AI.
 */
export function computeSmartSuggestions(exercises: WorkoutExercise[], sets: WorkoutSet[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));

  const byName = new Map<string, { exerciseId: string; sets: WorkoutSet[] }>();
  for (const s of sets) {
    if (!s.completed || !s.logged_at) continue;
    const exercise = exerciseById.get(s.workout_exercise_id);
    if (!exercise) continue;
    const entry = byName.get(exercise.name) ?? { exerciseId: exercise.id, sets: [] };
    entry.sets.push(s);
    byName.set(exercise.name, entry);
  }

  for (const [name, { sets: exSets }] of byName) {
    const bySessionDate = new Map<string, WorkoutSet[]>();
    for (const s of exSets) {
      const day = s.logged_at!.slice(0, 10);
      bySessionDate.set(day, [...(bySessionDate.get(day) ?? []), s]);
    }
    const sessions = [...bySessionDate.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 2);
    if (sessions.length < 2) continue;

    const avgRpe = (setList: WorkoutSet[]) => {
      const rpes = setList.map((s) => s.rpe).filter((r): r is number => r != null);
      return rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null;
    };
    const topWeight = (setList: WorkoutSet[]) => Math.max(...setList.map((s) => s.weight));

    const [recent, prior] = sessions;
    const recentRpe = avgRpe(recent[1]);
    const priorRpe = avgRpe(prior[1]);

    if (recentRpe !== null && priorRpe !== null && recentRpe <= 7 && priorRpe <= 7) {
      suggestions.push({
        id: `progress-${name}`,
        kind: "progression",
        message: `${name}: last two sessions felt easy (RPE ≤7) — try adding 2.5kg next time.`,
      });
    } else if (recentRpe !== null && priorRpe !== null && recentRpe >= 9 && priorRpe >= 9) {
      suggestions.push({
        id: `deload-${name}`,
        kind: "deload",
        message: `${name}: two straight sessions at RPE 9+ — consider a deload (reduce weight ~10%) next time.`,
      });
    } else if (topWeight(recent[1]) < topWeight(prior[1])) {
      suggestions.push({
        id: `deload-drop-${name}`,
        kind: "deload",
        message: `${name}: top weight dropped session over session — check recovery before pushing further.`,
      });
    }
  }

  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  let pushVolume = 0;
  let pullVolume = 0;
  for (const s of sets) {
    if (!s.completed || !s.logged_at || new Date(s.logged_at) < fourWeeksAgo) continue;
    const exercise = exerciseById.get(s.workout_exercise_id);
    if (!exercise) continue;
    const v = s.weight * s.reps;
    if (PUSH_MUSCLES.has(exercise.muscle_group)) pushVolume += v;
    if (PULL_MUSCLES.has(exercise.muscle_group)) pullVolume += v;
  }
  if (pushVolume > 0 && pullVolume > 0) {
    const ratio = pushVolume / pullVolume;
    if (ratio > 1.4) {
      suggestions.push({ id: "imbalance-push", kind: "imbalance", message: "Push volume is notably higher than pull over the last 4 weeks — add more back/biceps work." });
    } else if (ratio < 0.7) {
      suggestions.push({ id: "imbalance-pull", kind: "imbalance", message: "Pull volume is notably higher than push over the last 4 weeks — add more chest/shoulder work." });
    }
  }

  return suggestions.slice(0, 6);
}
