import { createClient } from "@/lib/supabase/server";
import { HealthTabs } from "@/components/health/HealthTabs";
import { DEFAULT_WATER_GOAL_ML } from "@/lib/constants";
import { toISODate } from "@/lib/scores";
import type {
  BodyMeasurement,
  ExerciseFavorite,
  ProgressPhoto,
  SkincareCompletion,
  SkincareProduct,
  SkincareStep,
  SkinJournalEntry,
  UserSettings,
  WaterContainer,
  WaterLog,
  Workout,
  WorkoutExercise,
  WorkoutSet,
  WorkoutTemplate,
  WorkoutTemplateExercise,
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

  const [
    workoutsRes,
    exercisesRes,
    setsRes,
    waterRes,
    settingsRes,
    stepsRes,
    completionsRes,
    containersRes,
    productsRes,
    journalRes,
  ] = await Promise.all([
    supabase.from("workouts").select("*").order("scheduled_date", { ascending: false }),
    supabase.from("workout_exercises").select("*"),
    supabase.from("workout_sets").select("*"),
    supabase.from("water_logs").select("*"),
    supabase.from("user_settings").select("*").maybeSingle(),
    supabase.from("skincare_steps").select("*").order("position"),
    supabase.from("skincare_completions").select("*"),
    supabase.from("water_containers").select("*").order("position"),
    supabase.from("skincare_products").select("*").order("created_at", { ascending: false }),
    supabase.from("skin_journal").select("*").order("logged_date", { ascending: false }).limit(60),
  ]);

  const [templatesRes, templateExercisesRes, favoritesRes, photosRes, measurementsRes] = await Promise.all([
    supabase.from("workout_templates").select("*").order("created_at", { ascending: false }),
    supabase.from("workout_template_exercises").select("*").order("position"),
    supabase.from("exercise_favorites").select("*"),
    supabase.from("progress_photos").select("*").order("taken_at", { ascending: false }),
    supabase.from("body_measurements").select("*").order("logged_date", { ascending: false }).limit(60),
  ]);

  const settings = settingsRes.data as UserSettings | null;
  const today = toISODate(new Date());
  const workedOutToday = ((workoutsRes.data as Workout[] | null) ?? []).some(
    (w) => w.scheduled_date === today && w.status === "completed"
  );

  return (
    <HealthTabs
      workouts={(workoutsRes.data as Workout[]) ?? []}
      workoutExercises={(exercisesRes.data as WorkoutExercise[]) ?? []}
      workoutSets={(setsRes.data as WorkoutSet[]) ?? []}
      waterLogs={(waterRes.data as WaterLog[]) ?? []}
      waterGoalMl={settings?.water_goal_ml ?? DEFAULT_WATER_GOAL_ML}
      waterContainers={(containersRes.data as WaterContainer[]) ?? []}
      userSettings={settings}
      workedOutToday={workedOutToday}
      skincareSteps={(stepsRes.data as SkincareStep[]) ?? []}
      skincareCompletions={(completionsRes.data as SkincareCompletion[]) ?? []}
      skincareProducts={(productsRes.data as SkincareProduct[]) ?? []}
      skinJournalEntries={(journalRes.data as SkinJournalEntry[]) ?? []}
      workoutTemplates={(templatesRes.data as WorkoutTemplate[]) ?? []}
      workoutTemplateExercises={(templateExercisesRes.data as WorkoutTemplateExercise[]) ?? []}
      exerciseFavorites={(favoritesRes.data as ExerciseFavorite[]) ?? []}
      progressPhotos={(photosRes.data as ProgressPhoto[]) ?? []}
      bodyMeasurements={(measurementsRes.data as BodyMeasurement[]) ?? []}
    />
  );
}
