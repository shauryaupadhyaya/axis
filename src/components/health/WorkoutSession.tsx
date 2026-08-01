"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, Check, Copy, Minus, Pencil, Plus, SkipForward, Trash2, Trophy, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ExerciseLibraryModal } from "@/components/health/gym/ExerciseLibraryModal";
import type { Workout, WorkoutExercise, WorkoutSet } from "@/lib/types";
import type { Exercise } from "@/lib/gym/exercise-library";
import { totalVolume } from "@/lib/gym";
import {
  addExercise,
  deleteWorkout,
  deleteWorkoutSet,
  finishWorkout,
  logSet,
  removeWorkoutExercise,
  reorderWorkoutExercises,
  startWorkoutTimer,
  updateWorkoutSet,
} from "@/app/(app)/health/actions";

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
  const [draft, setDraft] = useState<Record<string, { weight: number; reps: number }>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [favoriteIds] = useState<Set<string>>(new Set());
  const [editingSet, setEditingSet] = useState<{ id: string; weight: number; reps: number } | null>(null);
  const [confirmDeleteSet, setConfirmDeleteSet] = useState<string | null>(null);
  const [confirmRemoveExercise, setConfirmRemoveExercise] = useState<string | null>(null);
  const [confirmDeleteWorkout, setConfirmDeleteWorkout] = useState(false);

  const orderedExercises = [...exercises].sort((a, b) => a.position - b.position);

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
    return draft[exerciseId] ?? { weight: 0, reps: 0 };
  }

  function updateDraft(exerciseId: string, patch: Partial<{ weight: number; reps: number }>) {
    setDraft((d) => ({ ...d, [exerciseId]: { ...getDraft(exerciseId), ...patch } }));
  }

  function previousBest(exercise: WorkoutExercise) {
    const priorSets = allSets.filter((s) => s.workout_exercise_id !== exercise.id && s.completed && s.weight > 0);
    const sameName = allExercises.filter((e) => e.name === exercise.name && e.id !== exercise.id).map((e) => e.id);
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
    startTransition(() => logSet(exercise.id, existingSets.length + 1, d.weight, d.reps));
    setRestRemaining(REST_SECONDS);
  }

  function handleDuplicateLast(exercise: WorkoutExercise) {
    const existingSets = sets.filter((s) => s.workout_exercise_id === exercise.id);
    const last = existingSets[existingSets.length - 1];
    if (!last) return;
    startTransition(() => logSet(exercise.id, existingSets.length + 1, last.weight, last.reps));
    setRestRemaining(REST_SECONDS);
  }

  function handleSelectExercise(ex: Exercise) {
    startTransition(() => addExercise(workout.id, ex.name, ex.primaryMuscle, ex.id));
    setPickerOpen(false);
  }

  function handleMove(exerciseId: string, direction: "up" | "down") {
    const index = orderedExercises.findIndex((e) => e.id === exerciseId);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= orderedExercises.length) return;
    const reordered = [...orderedExercises];
    [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];
    startTransition(() => reorderWorkoutExercises(reordered.map((e) => e.id)));
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
        <button
          onClick={() => setConfirmDeleteWorkout(true)}
          aria-label="Delete workout"
          className="text-graphite hover:text-danger transition-fast"
        >
          <Trash2 size={18} />
        </button>
      </header>

      <div className="p-5 flex flex-col gap-4">
        {restRemaining !== null && (
          <div className="rounded-lg bg-tuscan/20 border border-tuscan px-4 py-2 text-center animate-pop-in">
            <span className="text-mono text-h3">Rest: {formatElapsed(restRemaining)}</span>
          </div>
        )}

        {orderedExercises.map((exercise, index) => {
          const exerciseSets = sets.filter((s) => s.workout_exercise_id === exercise.id);
          const d = getDraft(exercise.id);
          const prevBest = previousBest(exercise);
          return (
            <Card key={exercise.id}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="text-h3 min-w-0 truncate">{exercise.name}</h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  {d.weight > 0 && isPr(exercise, d.weight) && (
                    <span className="hidden sm:flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-tuscan text-carbon font-semibold uppercase">
                      <Trophy size={10} /> PR pace
                    </span>
                  )}
                  <button
                    onClick={() => handleMove(exercise.id, "up")}
                    disabled={index === 0}
                    aria-label="Move exercise up"
                    className="w-6 h-6 rounded border border-alabaster flex items-center justify-center disabled:opacity-30"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    onClick={() => handleMove(exercise.id, "down")}
                    disabled={index === orderedExercises.length - 1}
                    aria-label="Move exercise down"
                    className="w-6 h-6 rounded border border-alabaster flex items-center justify-center disabled:opacity-30"
                  >
                    <ArrowDown size={12} />
                  </button>
                  <button
                    onClick={() => setConfirmRemoveExercise(exercise.id)}
                    aria-label="Remove exercise"
                    className="w-6 h-6 rounded border border-alabaster flex items-center justify-center text-graphite hover:text-danger"
                  >
                    <X size={12} />
                  </button>
                </div>
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
                  {exerciseSets.map((set, setIndex) =>
                    editingSet?.id === set.id ? (
                      <div key={set.id} className="flex items-center gap-2 py-1.5 text-small">
                        <span className="w-10 shrink-0">Set {setIndex + 1}</span>
                        <input
                          type="number"
                          value={editingSet.weight}
                          onChange={(e) => setEditingSet({ ...editingSet, weight: Number(e.target.value) })}
                          className="w-16 px-1.5 py-1 rounded border border-alabaster bg-bg text-mono text-small"
                        />
                        <span className="text-caption text-graphite">kg ×</span>
                        <input
                          type="number"
                          value={editingSet.reps}
                          onChange={(e) => setEditingSet({ ...editingSet, reps: Number(e.target.value) })}
                          className="w-14 px-1.5 py-1 rounded border border-alabaster bg-bg text-mono text-small"
                        />
                        <button
                          aria-label="Save set"
                          onClick={() => {
                            startTransition(() => updateWorkoutSet(set.id, { weight: editingSet.weight, reps: editingSet.reps }));
                            setEditingSet(null);
                          }}
                          className="text-success"
                        >
                          <Check size={16} />
                        </button>
                        <button aria-label="Cancel edit" onClick={() => setEditingSet(null)} className="text-graphite">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div key={set.id} className="group flex items-center gap-3 py-1.5 text-small">
                        <span className="w-10 opacity-60">Set {setIndex + 1}</span>
                        <span className="text-mono opacity-60">{set.weight}kg</span>
                        <span className="text-mono opacity-60">{set.reps} reps</span>
                        <span className="flex-1" />
                        <button
                          aria-label="Edit set"
                          onClick={() => setEditingSet({ id: set.id, weight: set.weight, reps: set.reps })}
                          className="opacity-0 group-hover:opacity-100 text-graphite hover:text-text transition-fast"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          aria-label="Delete set"
                          onClick={() => setConfirmDeleteSet(set.id)}
                          className="opacity-0 group-hover:opacity-100 text-graphite hover:text-danger transition-fast"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )
                  )}
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
          <Plus size={16} /> Add exercise
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

      <ConfirmDialog
        open={confirmDeleteSet !== null}
        title="Delete this set?"
        message="This log entry will be permanently removed."
        onCancel={() => setConfirmDeleteSet(null)}
        onConfirm={() => confirmDeleteSet && startTransition(() => deleteWorkoutSet(confirmDeleteSet))}
      />
      <ConfirmDialog
        open={confirmRemoveExercise !== null}
        title="Remove this exercise?"
        message="All sets logged for this exercise in this workout will be removed too."
        onCancel={() => setConfirmRemoveExercise(null)}
        onConfirm={() => confirmRemoveExercise && startTransition(() => removeWorkoutExercise(confirmRemoveExercise))}
      />
      <ConfirmDialog
        open={confirmDeleteWorkout}
        title="Delete this workout?"
        message="This will permanently delete the workout and everything logged in it."
        onCancel={() => setConfirmDeleteWorkout(false)}
        onConfirm={() => {
          startTransition(() => deleteWorkout(workout.id));
          router.push("/health");
        }}
      />
    </div>
  );
}
