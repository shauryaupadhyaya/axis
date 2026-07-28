"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/supabase/require-user";
import { toISODate } from "@/lib/scores";
import type { WorkoutStatus } from "@/lib/types";

// Workouts
export async function createWorkout(name: string, scheduledDate: string) {
  const { supabase, userId } = await requireUserId();
  const trimmed = name.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from("workouts")
    .insert({ user_id: userId, name: trimmed, scheduled_date: scheduledDate })
    .select("id")
    .single();
  revalidatePath("/health");
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function updateWorkoutStatus(workoutId: string, status: WorkoutStatus) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("workouts").update({ status }).eq("id", workoutId).eq("user_id", userId);
  revalidatePath("/health");
  revalidatePath(`/health/workouts/${workoutId}`);
}

export async function addExercise(workoutId: string, name: string, muscleGroup: string) {
  const { supabase, userId } = await requireUserId();
  const trimmed = name.trim();
  if (!trimmed) return;
  const { data: existing } = await supabase
    .from("workout_exercises")
    .select("id")
    .eq("workout_id", workoutId);
  await supabase.from("workout_exercises").insert({
    workout_id: workoutId,
    user_id: userId,
    name: trimmed,
    muscle_group: muscleGroup.trim() || "General",
    position: existing?.length ?? 0,
  });
  revalidatePath(`/health/workouts/${workoutId}`);
}

export async function logSet(
  workoutExerciseId: string,
  setNumber: number,
  weight: number,
  reps: number
) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("workout_sets").insert({
    workout_exercise_id: workoutExerciseId,
    user_id: userId,
    set_number: setNumber,
    weight,
    reps,
    completed: true,
    logged_at: new Date().toISOString(),
  });
  revalidatePath("/health");
}

// Water
export async function logWater(amountMl: number) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("water_logs").insert({ user_id: userId, amount_ml: amountMl });
  revalidatePath("/health");
  revalidatePath("/dashboard");
}

export async function updateWaterGoal(goalMl: number) {
  const { supabase, userId } = await requireUserId();
  await supabase
    .from("user_settings")
    .upsert({ user_id: userId, water_goal_ml: goalMl }, { onConflict: "user_id" });
  revalidatePath("/health");
  revalidatePath("/dashboard");
}

// Skincare
export async function addSkincareStep(period: "am" | "pm", name: string) {
  const { supabase, userId } = await requireUserId();
  const trimmed = name.trim();
  if (!trimmed) return;
  const { data: existing } = await supabase
    .from("skincare_steps")
    .select("id")
    .eq("user_id", userId)
    .eq("period", period);
  await supabase
    .from("skincare_steps")
    .insert({ user_id: userId, period, name: trimmed, position: existing?.length ?? 0 });
  revalidatePath("/health");
}

export async function removeSkincareStep(stepId: string) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("skincare_steps").delete().eq("id", stepId).eq("user_id", userId);
  revalidatePath("/health");
}

export async function toggleSkincareStepToday(stepId: string, completed: boolean) {
  const { supabase, userId } = await requireUserId();
  const today = toISODate(new Date());
  if (completed) {
    await supabase
      .from("skincare_completions")
      .upsert(
        { step_id: stepId, user_id: userId, completed_at: today },
        { onConflict: "step_id,completed_at" }
      );
  } else {
    await supabase
      .from("skincare_completions")
      .delete()
      .eq("step_id", stepId)
      .eq("completed_at", today);
  }
  revalidatePath("/health");
}
