import { createClient } from "@/lib/supabase/server";
import { HealthTabs } from "@/components/health/HealthTabs";
import { DEFAULT_WATER_GOAL_ML } from "@/lib/constants";
import type {
  SkincareCompletion,
  SkincareStep,
  UserSettings,
  WaterLog,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from "@/lib/types";

const DEFAULT_SKINCARE_STEPS: Array<{ period: "am" | "pm"; name: string; position: number }> = [
  { period: "am", name: "Facewash", position: 0 },
  { period: "am", name: "Moisturizer", position: 1 },
  { period: "am", name: "Sunscreen", position: 2 },
  { period: "pm", name: "Facewash", position: 0 },
  { period: "pm", name: "Treatment", position: 1 },
  { period: "pm", name: "Cream", position: 2 },
];

export default async function HealthPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { count } = await supabase
      .from("skincare_steps")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (!count) {
      await supabase
        .from("skincare_steps")
        .insert(DEFAULT_SKINCARE_STEPS.map((s) => ({ ...s, user_id: user.id })));
    }
  }

  const [workoutsRes, exercisesRes, setsRes, waterRes, settingsRes, stepsRes, completionsRes] =
    await Promise.all([
      supabase.from("workouts").select("*").order("scheduled_date", { ascending: false }),
      supabase.from("workout_exercises").select("*"),
      supabase.from("workout_sets").select("*"),
      supabase.from("water_logs").select("*"),
      supabase.from("user_settings").select("*").maybeSingle(),
      supabase.from("skincare_steps").select("*").order("position"),
      supabase.from("skincare_completions").select("*"),
    ]);

  return (
    <HealthTabs
      workouts={(workoutsRes.data as Workout[]) ?? []}
      workoutExercises={(exercisesRes.data as WorkoutExercise[]) ?? []}
      workoutSets={(setsRes.data as WorkoutSet[]) ?? []}
      waterLogs={(waterRes.data as WaterLog[]) ?? []}
      waterGoalMl={(settingsRes.data as UserSettings | null)?.water_goal_ml ?? DEFAULT_WATER_GOAL_ML}
      skincareSteps={(stepsRes.data as SkincareStep[]) ?? []}
      skincareCompletions={(completionsRes.data as SkincareCompletion[]) ?? []}
    />
  );
}
