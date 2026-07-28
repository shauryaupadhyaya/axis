"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Workout, WorkoutExercise, WorkoutSet } from "@/lib/types";
import { totalVolume } from "@/lib/gym";
import { addExercise, logSet, updateWorkoutStatus } from "@/app/(app)/health/actions";

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
}: {
  workout: Workout;
  exercises: WorkoutExercise[];
  sets: WorkoutSet[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [elapsed, setElapsed] = useState(0);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [draft, setDraft] = useState<Record<string, { weight: number; reps: number }>>({});
  const [newExercise, setNewExercise] = useState({ name: "", muscleGroup: "" });

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
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

  function handleLogSet(exercise: WorkoutExercise) {
    const { weight, reps } = getDraft(exercise.id);
    const existingSets = sets.filter((s) => s.workout_exercise_id === exercise.id);
    startTransition(() => logSet(exercise.id, existingSets.length + 1, weight, reps));
    setRestRemaining(REST_SECONDS);
  }

  function handleAddExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!newExercise.name.trim()) return;
    startTransition(() => addExercise(workout.id, newExercise.name, newExercise.muscleGroup));
    setNewExercise({ name: "", muscleGroup: "" });
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
          <div className="rounded-lg bg-tuscan/20 border border-tuscan px-4 py-2 text-center">
            <span className="text-mono text-h3">Rest: {formatElapsed(restRemaining)}</span>
          </div>
        )}

        {exercises.map((exercise) => {
          const exerciseSets = sets.filter((s) => s.workout_exercise_id === exercise.id);
          const d = getDraft(exercise.id);
          return (
            <Card key={exercise.id}>
              <h3 className="text-h3 mb-1">{exercise.name}</h3>
              <p className="text-caption text-graphite mb-3">
                {exerciseSets.length} sets logged · {exercise.muscle_group}
              </p>

              {exerciseSets.length > 0 && (
                <div className="mb-3">
                  {exerciseSets.map((set) => (
                    <div key={set.id} className="flex items-center gap-3 py-1.5 text-small opacity-60">
                      <span className="w-10">Set {set.set_number}</span>
                      <span className="text-mono">{set.weight}kg</span>
                      <span className="text-mono">{set.reps} reps</span>
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
                <Button onClick={() => handleLogSet(exercise)} className="flex-1 min-w-[120px]">
                  Log set
                </Button>
              </div>
            </Card>
          );
        })}

        <Card>
          <h3 className="text-h3 mb-3">Add exercise</h3>
          <form onSubmit={handleAddExercise} className="flex gap-2 flex-wrap">
            <Input
              placeholder="Exercise name"
              value={newExercise.name}
              onChange={(e) => setNewExercise((n) => ({ ...n, name: e.target.value }))}
              className="flex-1 min-w-[160px]"
            />
            <Input
              placeholder="Muscle group"
              value={newExercise.muscleGroup}
              onChange={(e) => setNewExercise((n) => ({ ...n, muscleGroup: e.target.value }))}
              className="flex-1 min-w-[140px]"
            />
            <Button type="submit" variant="icon" aria-label="Add exercise">
              <Plus size={16} />
            </Button>
          </form>
        </Card>

        <div className="flex items-center justify-between">
          <span className="text-mono text-graphite">Volume: {volume}kg</span>
          {workout.status !== "completed" && (
            <Button onClick={() => startTransition(() => updateWorkoutStatus(workout.id, "completed"))}>
              Finish workout
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
