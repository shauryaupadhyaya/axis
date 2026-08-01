"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/supabase/require-user";
import { toISODate } from "@/lib/scores";
import type { SkincarePeriod, SkincareStepType, WorkoutStatus } from "@/lib/types";

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

export async function toggleExerciseFavorite(exerciseId: string, favorited: boolean) {
  const { supabase, userId } = await requireUserId();
  if (favorited) {
    await supabase.from("exercise_favorites").upsert(
      { user_id: userId, exercise_id: exerciseId },
      { onConflict: "user_id,exercise_id" }
    );
  } else {
    await supabase.from("exercise_favorites").delete().eq("user_id", userId).eq("exercise_id", exerciseId);
  }
  revalidatePath("/health");
}

export async function updateWorkoutStatus(workoutId: string, status: WorkoutStatus) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("workouts").update({ status }).eq("id", workoutId).eq("user_id", userId);
  revalidatePath("/health");
  revalidatePath(`/health/workouts/${workoutId}`);
}

export async function addExercise(workoutId: string, name: string, muscleGroup: string, exerciseId?: string) {
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
    exercise_id: exerciseId ?? null,
  });
  revalidatePath(`/health/workouts/${workoutId}`);
}

export async function logSet(
  workoutExerciseId: string,
  setNumber: number,
  weight: number,
  reps: number,
  extra?: { rpe?: number | null; rir?: number | null; tempo?: string | null; notes?: string | null }
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
    rpe: extra?.rpe ?? null,
    rir: extra?.rir ?? null,
    tempo: extra?.tempo ?? null,
    notes: extra?.notes ?? null,
  });
  revalidatePath("/health");
}

export async function startWorkoutTimer(workoutId: string) {
  const { supabase, userId } = await requireUserId();
  await supabase
    .from("workouts")
    .update({ started_at: new Date().toISOString() })
    .eq("id", workoutId)
    .eq("user_id", userId)
    .is("started_at", null);
}

export async function finishWorkout(workoutId: string) {
  const { supabase, userId } = await requireUserId();
  await supabase
    .from("workouts")
    .update({ status: "completed", ended_at: new Date().toISOString() })
    .eq("id", workoutId)
    .eq("user_id", userId);
  revalidatePath("/health");
}

// Templates
export async function createWorkoutTemplate(name: string, description?: string) {
  const { supabase, userId } = await requireUserId();
  const trimmed = name.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from("workout_templates")
    .insert({ user_id: userId, name: trimmed, description: description || null })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/health");
  return data.id as string;
}

export async function removeWorkoutTemplate(templateId: string) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("workout_templates").delete().eq("id", templateId).eq("user_id", userId);
  revalidatePath("/health");
}

export async function addTemplateExercise(
  templateId: string,
  exerciseId: string | null,
  name: string,
  muscleGroup: string
) {
  const { supabase, userId } = await requireUserId();
  const { data: existing } = await supabase
    .from("workout_template_exercises")
    .select("id")
    .eq("template_id", templateId);
  await supabase.from("workout_template_exercises").insert({
    template_id: templateId,
    user_id: userId,
    exercise_id: exerciseId,
    custom_name: exerciseId ? null : name,
    muscle_group: muscleGroup,
    position: existing?.length ?? 0,
  });
  revalidatePath("/health");
}

export async function removeTemplateExercise(id: string) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("workout_template_exercises").delete().eq("id", id).eq("user_id", userId);
  revalidatePath("/health");
}

export async function startWorkoutFromTemplate(templateId: string, templateName: string, scheduledDate: string) {
  const { supabase, userId } = await requireUserId();
  const { data: workout, error } = await supabase
    .from("workouts")
    .insert({ user_id: userId, name: templateName, scheduled_date: scheduledDate, template_id: templateId, started_at: new Date().toISOString() })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const { data: templateExercises } = await supabase
    .from("workout_template_exercises")
    .select("*")
    .eq("template_id", templateId)
    .order("position");

  if (templateExercises && templateExercises.length > 0) {
    await supabase.from("workout_exercises").insert(
      templateExercises.map((te, i) => ({
        workout_id: workout.id,
        user_id: userId,
        name: te.custom_name ?? te.exercise_id ?? "Exercise",
        muscle_group: te.muscle_group,
        position: i,
        exercise_id: te.exercise_id,
        set_type: te.set_type,
        group_key: te.group_key,
      }))
    );
  }
  revalidatePath("/health");
  return workout.id as string;
}

// Water
export async function logWater(amountMl: number) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("water_logs").insert({ user_id: userId, amount_ml: amountMl });
  revalidatePath("/health");
  revalidatePath("/dashboard");
}

export async function deleteWaterLog(logId: string) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("water_logs").delete().eq("id", logId).eq("user_id", userId);
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

export async function updateHydrationProfile(profile: {
  age: number | null;
  weightKg: number | null;
  heightCm: number | null;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
}) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("user_settings").upsert(
    {
      user_id: userId,
      age: profile.age,
      weight_kg: profile.weightKg,
      height_cm: profile.heightCm,
      activity_level: profile.activityLevel,
    },
    { onConflict: "user_id" }
  );
  revalidatePath("/health");
}

export async function addWaterContainer(name: string, volumeMl: number, icon: string) {
  const { supabase, userId } = await requireUserId();
  const trimmed = name.trim();
  if (!trimmed || volumeMl <= 0) return;
  const { data: existing } = await supabase.from("water_containers").select("id").eq("user_id", userId);
  await supabase
    .from("water_containers")
    .insert({ user_id: userId, name: trimmed, volume_ml: volumeMl, icon, position: existing?.length ?? 0 });
  revalidatePath("/health");
}

export async function removeWaterContainer(containerId: string) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("water_containers").delete().eq("id", containerId).eq("user_id", userId);
  revalidatePath("/health");
}

// Skincare
export async function addSkincareStep(
  period: SkincarePeriod,
  name: string,
  extra?: {
    routineName?: string;
    stepType?: SkincareStepType;
    durationSeconds?: number;
    instructions?: string;
    productId?: string | null;
    notes?: string;
  }
) {
  const { supabase, userId } = await requireUserId();
  const trimmed = name.trim();
  if (!trimmed) return;
  const { data: existing } = await supabase
    .from("skincare_steps")
    .select("id")
    .eq("user_id", userId)
    .eq("period", period);
  await supabase.from("skincare_steps").insert({
    user_id: userId,
    period,
    name: trimmed,
    position: existing?.length ?? 0,
    routine_name: extra?.routineName ?? null,
    step_type: extra?.stepType ?? "other",
    duration_seconds: extra?.durationSeconds ?? 60,
    instructions: extra?.instructions ?? null,
    product_id: extra?.productId ?? null,
    notes: extra?.notes ?? null,
  });
  revalidatePath("/health");
}

export async function updateSkincareStep(
  stepId: string,
  patch: Partial<{
    name: string;
    stepType: SkincareStepType;
    durationSeconds: number;
    instructions: string | null;
    productId: string | null;
    notes: string | null;
  }>
) {
  const { supabase, userId } = await requireUserId();
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.stepType !== undefined) update.step_type = patch.stepType;
  if (patch.durationSeconds !== undefined) update.duration_seconds = patch.durationSeconds;
  if (patch.instructions !== undefined) update.instructions = patch.instructions;
  if (patch.productId !== undefined) update.product_id = patch.productId;
  if (patch.notes !== undefined) update.notes = patch.notes;
  await supabase.from("skincare_steps").update(update).eq("id", stepId).eq("user_id", userId);
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

export async function addSkincareProduct(product: {
  name: string;
  brand?: string;
  productType: SkincareStepType;
  ingredients?: string;
  purchaseDate?: string | null;
  expiryDate?: string | null;
}) {
  const { supabase, userId } = await requireUserId();
  const trimmed = product.name.trim();
  if (!trimmed) return;
  await supabase.from("skincare_products").insert({
    user_id: userId,
    name: trimmed,
    brand: product.brand || null,
    product_type: product.productType,
    ingredients: product.ingredients || null,
    purchase_date: product.purchaseDate || null,
    expiry_date: product.expiryDate || null,
  });
  revalidatePath("/health");
}

export async function removeSkincareProduct(productId: string) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("skincare_products").delete().eq("id", productId).eq("user_id", userId);
  revalidatePath("/health");
}

// Body measurements
export async function saveBodyMeasurement(measurement: {
  weightKg?: number | null;
  bodyFatPct?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  armsCm?: number | null;
  thighsCm?: number | null;
  neckCm?: number | null;
}) {
  const { supabase, userId } = await requireUserId();
  const today = toISODate(new Date());
  await supabase.from("body_measurements").upsert(
    {
      user_id: userId,
      logged_date: today,
      weight_kg: measurement.weightKg ?? null,
      body_fat_pct: measurement.bodyFatPct ?? null,
      chest_cm: measurement.chestCm ?? null,
      waist_cm: measurement.waistCm ?? null,
      arms_cm: measurement.armsCm ?? null,
      thighs_cm: measurement.thighsCm ?? null,
      neck_cm: measurement.neckCm ?? null,
    },
    { onConflict: "user_id,logged_date" }
  );
  revalidatePath("/health");
}

export async function saveSkinJournalEntry(entry: {
  acne: number;
  redness: number;
  dryness: number;
  oiliness: number;
  irritation: number;
  sensitivity: number;
  mood?: string;
  notes?: string;
}) {
  const { supabase, userId } = await requireUserId();
  const today = toISODate(new Date());
  await supabase.from("skin_journal").upsert(
    {
      user_id: userId,
      logged_date: today,
      acne: entry.acne,
      redness: entry.redness,
      dryness: entry.dryness,
      oiliness: entry.oiliness,
      irritation: entry.irritation,
      sensitivity: entry.sensitivity,
      mood: entry.mood || null,
      notes: entry.notes || null,
    },
    { onConflict: "user_id,logged_date" }
  );
  revalidatePath("/health");
}
