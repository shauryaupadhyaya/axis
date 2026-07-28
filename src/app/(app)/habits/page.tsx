import { createClient } from "@/lib/supabase/server";
import { HabitsPageView } from "@/components/habits/HabitsPageView";
import type { Habit, HabitCompletion } from "@/lib/types";

export default async function HabitsPage() {
  const supabase = await createClient();

  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 371);

  const [habitsRes, completionsRes] = await Promise.all([
    supabase.from("habits").select("*").order("created_at"),
    supabase
      .from("habit_completions")
      .select("*")
      .gte("completed_at", oneYearAgo.toISOString().slice(0, 10)),
  ]);

  return (
    <HabitsPageView
      habits={(habitsRes.data as Habit[]) ?? []}
      completions={(completionsRes.data as HabitCompletion[]) ?? []}
    />
  );
}
