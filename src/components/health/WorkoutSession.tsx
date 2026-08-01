"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Minus, Plus, SkipForward, Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ExerciseLibraryModal } from "@/components/health/gym/ExerciseLibraryModal";
import type { Workout, WorkoutExercise, WorkoutSet } from "@/lib/types";
import type { Exercise } from "@/lib/gym/exercise-library";
import { totalVolume } from "@/lib/gym";
import { addExercise, finishWorkout, logSet, startWorkoutTimer } from "@/app/(app)/health/actions";

const REST_SECONDS = 90;

function formatElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function WorkoutSession({
  workout,
  exercises,
  sets,
  allSets,
  allExercises,
}: {
  workout: Workout;
  exercises: WorkoutExercise[];
  sets: WorkoutSet[];
  allSets: WorkoutSet[];
  allExercises: WorkoutExercise[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [draft, setDraft] = useState<Record<string, { weight: number; reps: number; rpe: number | ""; rir: number | "" }>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [favoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!workout.started_at) startTransition(() => startWorkoutTimer(workout.id));
    startRef.current = workout.started_at ? new Date(workout.started_at).getTime() : Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startRef.current) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (restRemaining === null || restRemaining <= 0) return;
    const id = setTimeout(() => setRestRemaining((r) => (r !== null && r > 0 ? r - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [restRemaining]);

  function getDraft(exerciseId: string) {
    return draft[exerciseId] ?? { weight: 0, reps: 0, rpe: "", rir: "" };
  }

  function updateDraft(exerciseId: string, patch: Partial<{ weight: number; reps: number; rpe: number | ""; rir: number | "" }>) {
    setDraft((d) => ({ ...d, [exerciseId]: { ...getDraft(exerciseId), ...patch } }));
  }

  function previousBest(exercise: WorkoutExercise) {
    const priorSets = allSets.filter((s) => {
      if (s.workout_exercise_id === exercise.id) return false; // this session's own exercise row is excluded via name match below
      return s.completed && s.weight > 0;
    });
    // match by exercise name across other workouts
    const sameName = allExercises
      .filter((e) => e.name === exercise.name && e.id !== exercise.id)
      .map((e) => e.id);
    const candidates = priorSets.filter((s) => sameName.includes(s.workout_exercise_id));
    if (candidates.length === 0) return null;
    return [...candidates].sort((a, b) => b.weight - a.weight)[0];
  }

  function isPr(exercise: WorkoutExercise, weight: number) {
    const best = previousBest(exercise);
    return !best || weight > best.weight;
  }

  function handleLogSet(exercise: WorkoutExercise) {
    const d = getDraft(exercise.id);
    const existingSets = sets.filter((s) => s.workout_exercise_id === exercise.id);
    startTransition(() =>
      logSet(exercise.id, existingSets.length + 1, d.weight, d.reps, {
        rpe: d.rpe === "" ? null : d.rpe,
        rir: d.rir === "" ? null : d.rir,
      })
    );
    setRestRemaining(REST_SECONDS);
  }

  function handleDuplicateLast(exercise: WorkoutExercise) {
    const existingSets = sets.filter((s) => s.workout_exercise_id === exercise.id);
    const last = existingSets[existingSets.length - 1];
    if (!last) return;
    startTransition(() => logSet(exercise.id, existingSets.length + 1, last.weight, last.reps, { rpe: last.rpe, rir: last.rir }));
    setRestRemaining(REST_SECONDS);
  }

  function handleSelectExercise(ex: Exercise) {
    startTransition(() => addExercise(workout.id, ex.name, ex.primaryMuscle, ex.id));
    setPickerOpen(false);
  }

  const volume = totalVolume(sets);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 flex items-center gap-3 px-5 py-4 border-b border-alabaster bg-bg">
        <button onClick={() => router.push("/health")} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-h2 flex-1">{workout.name}</h1>
        <span className="text-mono text-display">{formatElapsed(elapsed)}</span>
      </header>

      <div className="p-5 flex flex-col gap-4">
        {restRemaining !== null && (
          <div className="rounded-lg bg-tuscan/20 border border-tuscan px-4 py-2 text-center animate-pop-in">
            <span className="text-mono text-h3">Rest: {formatElapsed(restRemaining)}</span>
          </div>
        )}

        {exercises.map((exercise) => {
          const exerciseSets = sets.filter((s) => s.workout_exercise_id === exercise.id);
          const d = getDraft(exercise.id);
          const prevBest = previousBest(exercise);
          return (
            <Card key={exercise.id}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-h3">{exercise.name}</h3>
                {d.weight > 0 && isPr(exercise, d.weight) && (
                  <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-tuscan text-carbon font-semibold uppercase">
                    <Trophy size={10} /> PR pace
                  </span>
                )}
              </div>
              <p className="text-caption text-graphite mb-1">
                {exerciseSets.length} sets logged · {exercise.muscle_group}
              </p>
              {prevBest && (
                <p className="text-caption text-graphite mb-3">
                  Previous best: <span className="text-mono">{prevBest.weight}kg × {prevBest.reps}</span>
                </p>
              )}

              {exerciseSets.length > 0 && (
                <div className="mb-3">
                  {exerciseSets.map((set) => (
                    <div key={set.id} className="flex items-center gap-3 py-1.5 text-small opacity-60">
                      <span className="w-10">Set {set.set_number}</span>
                      <span className="text-mono">{set.weight}kg</span>
                      <span className="text-mono">{set.reps} reps</span>
                      {set.rpe != null && <span className="text-mono text-[11px]">RPE {set.rpe}</span>}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-3 flex-wrap">
                <div>
                  <label className="text-label text-graphite mb-1 block">Weight (kg)</label>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateDraft(exercise.id, { weight: Math.max(0, d.weight - 2.5) })} className="w-7 h-7 rounded border border-alabaster flex items-center justify-center">
                      <Minus size={14} />
                    </button>
                    <span className="text-mono w-12 text-center">{d.weight}</span>
                    <button onClick={() => updateDraft(exercise.id, { weight: d.weight + 2.5 })} className="w-7 h-7 rounded border border-alabaster flex items-center justify-center">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-label text-graphite mb-1 block">Reps</label>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateDraft(exercise.id, { reps: Math.max(0, d.reps - 1) })} className="w-7 h-7 rounded border border-alabaster flex items-center justify-center">
                      <Minus size={14} />
                    </button>
                    <span className="text-mono w-12 text-center">{d.reps}</span>
                    <button onClick={() => updateDraft(exercise.id, { reps: d.reps + 1 })} className="w-7 h-7 rounded border border-alabaster flex items-center justify-center">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <Input
                  label="RPE"
                  type="number"
                  value={d.rpe}
                  onChange={(e) => updateDraft(exercise.id, { rpe: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="w-16"
                />
                <Input
                  label="RIR"
                  type="number"
                  value={d.rir}
                  onChange={(e) => updateDraft(exercise.id, { rir: e.target.value === "" ? "" : Number(e.target.value) })}
                  className="w-16"
                />
                <Button onClick={() => handleLogSet(exercise)} className="flex-1 min-w-[120px]">
                  Log set
                </Button>
                {exerciseSets.length > 0 && (
                  <button
                    onClick={() => handleDuplicateLast(exercise)}
                    aria-label="Duplicate last set"
                    className="w-9 h-9 rounded-md border border-alabaster flex items-center justify-center"
                  >
                    <Copy size={14} />
                  </button>
                )}
              </div>
            </Card>
          );
        })}

        <Button variant="secondary" onClick={() => setPickerOpen(true)} className="flex items-center justify-center gap-2">
          <Plus size={16} /> Add exercise from library
        </Button>

        <div className="flex items-center justify-between">
          <span className="text-mono text-graphite">Volume: {volume}kg</span>
          {workout.status !== "completed" && (
            <Button onClick={() => startTransition(() => finishWorkout(workout.id))} className="flex items-center gap-2">
              <SkipForward size={14} /> Finish workout
            </Button>
          )}
        </div>
      </div>

      {pickerOpen && (
        <ExerciseLibraryModal favoriteIds={favoriteIds} onClose={() => setPickerOpen(false)} onSelect={handleSelectExercise} />
      )}
    </div>
  );
}
