import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkoutSession } from "@/components/health/WorkoutSession";
import type { Workout, WorkoutExercise, WorkoutSet } from "@/lib/types";

export default async function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [workoutRes, exercisesRes, setsRes] = await Promise.all([
    supabase.from("workouts").select("*").eq("id", id).single(),
    supabase.from("workout_exercises").select("*").eq("workout_id", id).order("position"),
    supabase.from("workout_sets").select("*"),
  ]);

  if (!workoutRes.data) notFound();

  const exercises = (exercisesRes.data as WorkoutExercise[]) ?? [];
  const exerciseIds = new Set(exercises.map((e) => e.id));
  const allSets = (setsRes.data as WorkoutSet[]) ?? [];
  const sets = allSets.filter((s) => exerciseIds.has(s.workout_exercise_id));

  // previousBest in WorkoutSession needs sibling workout_exercises rows sharing the same name to compare against.
  const allExercisesRes = await supabase.from("workout_exercises").select("*");

  return (
    <WorkoutSession
      workout={workoutRes.data as Workout}
      exercises={exercises}
      sets={sets}
      allSets={allSets}
      allExercises={(allExercisesRes.data as WorkoutExercise[]) ?? exercises}
    />
  );
}
