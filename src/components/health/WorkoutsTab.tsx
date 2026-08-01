"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { TemplateBuilder } from "@/components/health/gym/TemplateBuilder";
import { GymInsights } from "@/components/health/gym/GymInsights";
import type { ExerciseFavorite, Workout, WorkoutExercise, WorkoutSet, WorkoutTemplate, WorkoutTemplateExercise } from "@/lib/types";
import { createWorkout } from "@/app/(app)/health/actions";
import { toISODate } from "@/lib/scores";

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
              <h2 className="text-h2">Recent workouts</h2>
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
              <div className="flex flex-col gap-3">
                {workouts.slice(0, 8).map((workout) => {
                  const workoutExercises = exercises.filter((e) => e.workout_id === workout.id);
                  const muscleGroups = [...new Set(workoutExercises.map((e) => e.muscle_group))];
                  return (
                    <Card key={workout.id} className="cursor-pointer" onClick={() => router.push(`/health/workouts/${workout.id}`)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-h3">{workout.name}</h3>
                          <p className="text-caption text-graphite">
                            {muscleGroups.join(", ") || "No exercises yet"} · {workoutExercises.length} exercises
                          </p>
                        </div>
                        {workout.status === "completed" && <Check size={18} className="text-success" />}
                        {workout.status === "scheduled" && <Clock size={18} className="text-graphite" />}
                        {workout.status === "skipped" && <X size={18} className="text-danger" />}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <TemplateBuilder templates={templates} templateExercises={templateExercises} favoriteIds={favoriteIds} />
      </div>

      <GymInsights workouts={workouts} exercises={exercises} sets={sets} />
    </div>
  );
}
