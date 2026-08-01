"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Plus, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TemplateBuilder } from "@/components/health/gym/TemplateBuilder";
import { GymInsights } from "@/components/health/gym/GymInsights";
import type { ExerciseFavorite, Workout, WorkoutExercise, WorkoutSet, WorkoutTemplate, WorkoutTemplateExercise } from "@/lib/types";
import { createWorkout, deleteWorkout } from "@/app/(app)/health/actions";
import { toISODate } from "@/lib/scores";
import { totalVolume } from "@/lib/gym";

const HISTORY_PAGE_SIZE = 8;

interface WorkoutsTabProps {
  workouts: Workout[];
  exercises: WorkoutExercise[];
  sets: WorkoutSet[];
  templates?: WorkoutTemplate[];
  templateExercises?: WorkoutTemplateExercise[];
  favorites?: ExerciseFavorite[];
}

export function WorkoutsTab({
  workouts,
  exercises,
  sets,
  templates = [],
  templateExercises = [],
  favorites = [],
}: WorkoutsTabProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState<string | null>(toISODate(new Date()));
  const [, startTransition] = useTransition();
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [confirmDeleteWorkout, setConfirmDeleteWorkout] = useState<string | null>(null);
  const favoriteIds = new Set(favorites.map((f) => f.exercise_id));

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !date) return;
    startTransition(async () => {
      const id = await createWorkout(name, date);
      if (id) router.push(`/health/workouts/${id}`);
    });
    setName("");
    setAdding(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-h2">Workout history</h2>
              <Button onClick={() => setAdding((v) => !v)} className="flex items-center gap-1.5">
                <Plus size={16} /> New workout
              </Button>
            </div>

            {adding && (
              <Card className="mb-4 max-w-sm">
                <form onSubmit={handleAdd} className="flex flex-col gap-3">
                  <Input autoFocus label="Workout name" value={name} onChange={(e) => setName(e.target.value)} />
                  <DatePicker label="Date" value={date} onChange={setDate} />
                  <Button type="submit">Create</Button>
                </form>
              </Card>
            )}

            {workouts.length === 0 ? (
              <p className="text-small text-graphite py-8 text-center">No workouts scheduled yet.</p>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {(showAllHistory ? workouts : workouts.slice(0, HISTORY_PAGE_SIZE)).map((workout) => {
                    const workoutExercises = exercises.filter((e) => e.workout_id === workout.id);
                    const workoutExerciseIds = new Set(workoutExercises.map((e) => e.id));
                    const workoutSets = sets.filter((s) => workoutExerciseIds.has(s.workout_exercise_id));
                    const muscleGroups = [...new Set(workoutExercises.map((e) => e.muscle_group))];
                    const volume = totalVolume(workoutSets);
                    const durationMin =
                      workout.started_at && workout.ended_at
                        ? Math.round((new Date(workout.ended_at).getTime() - new Date(workout.started_at).getTime()) / 60000)
                        : null;
                    return (
                      <Card key={workout.id} className="group cursor-pointer" onClick={() => router.push(`/health/workouts/${workout.id}`)}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-h3">{workout.name}</h3>
                            <p className="text-caption text-graphite">
                              {new Date(workout.scheduled_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
                              {muscleGroups.join(", ") || "No exercises yet"} · {workoutExercises.length} exercises
                            </p>
                            <p className="text-caption text-graphite">
                              {volume}kg volume{durationMin !== null ? ` · ${durationMin} min` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {workout.status === "completed" && <Check size={18} className="text-success" />}
                            {workout.status === "scheduled" && <Clock size={18} className="text-graphite" />}
                            {workout.status === "skipped" && <X size={18} className="text-danger" />}
                            <button
                              aria-label="Delete workout"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteWorkout(workout.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-graphite hover:text-danger transition-fast"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                {!showAllHistory && workouts.length > HISTORY_PAGE_SIZE && (
                  <button onClick={() => setShowAllHistory(true)} className="text-small text-tuscan mt-3">
                    View all {workouts.length} workouts
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <TemplateBuilder templates={templates} templateExercises={templateExercises} favoriteIds={favoriteIds} />
      </div>

      <GymInsights workouts={workouts} exercises={exercises} sets={sets} />

      <ConfirmDialog
        open={confirmDeleteWorkout !== null}
        title="Delete this workout?"
        message="This will permanently delete the workout and everything logged in it."
        onCancel={() => setConfirmDeleteWorkout(null)}
        onConfirm={() => confirmDeleteWorkout && startTransition(() => deleteWorkout(confirmDeleteWorkout))}
      />
    </div>
  );
}
