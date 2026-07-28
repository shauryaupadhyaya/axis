"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import type { Workout, WorkoutExercise, WorkoutSet } from "@/lib/types";
import { computeMuscleRecovery, computePersonalRecords } from "@/lib/gym";
import { createWorkout } from "@/app/(app)/health/actions";
import { toISODate } from "@/lib/scores";

interface WorkoutsTabProps {
  workouts: Workout[];
  exercises: WorkoutExercise[];
  sets: WorkoutSet[];
}

export function WorkoutsTab({ workouts, exercises, sets }: WorkoutsTabProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState<string | null>(toISODate(new Date()));
  const [, startTransition] = useTransition();

  const prs = computePersonalRecords(exercises, sets);
  const recovery = computeMuscleRecovery(exercises, sets);

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-h2">Workouts</h2>
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
            {workouts.map((workout) => {
              const workoutExercises = exercises.filter((e) => e.workout_id === workout.id);
              const muscleGroups = [...new Set(workoutExercises.map((e) => e.muscle_group))];
              return (
                <Card
                  key={workout.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/health/workouts/${workout.id}`)}
                >
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

      <div className="flex flex-col gap-5">
        <Card>
          <h3 className="text-h3 mb-3">Personal records</h3>
          {prs.length === 0 ? (
            <p className="text-small text-graphite py-2">Log sets to see PRs.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {prs.map((pr) => (
                <li key={pr.exerciseName} className="flex items-center justify-between">
                  <div>
                    <p className="text-body">{pr.exerciseName}</p>
                    <p className="text-caption text-graphite">
                      {new Date(pr.achievedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-mono">{pr.maxWeight}kg</span>
                    {pr.isRecent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-tuscan text-carbon font-semibold uppercase">
                        New PR
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3 className="text-h3 mb-3">Muscle recovery</h3>
          {recovery.length === 0 ? (
            <p className="text-small text-graphite py-2">No exercises logged yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recovery.map((m) => (
                <li key={m.muscleGroup} className="flex items-center justify-between">
                  <span className="text-body">{m.muscleGroup}</span>
                  <span
                    className={`text-mono px-2 py-0.5 rounded ${
                      m.daysSinceLastTrained === null
                        ? "bg-alabaster text-graphite"
                        : m.daysSinceLastTrained <= 1
                          ? "bg-danger text-white"
                          : m.daysSinceLastTrained <= 3
                            ? "bg-warning text-white"
                            : "bg-success text-white"
                    }`}
                  >
                    {m.daysSinceLastTrained === null ? "—" : `${m.daysSinceLastTrained}d`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
