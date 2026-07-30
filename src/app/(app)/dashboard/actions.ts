"use server";

import { revalidatePath } from "next/cache";
import { toISODate } from "@/lib/scores";
import { requireUserId } from "@/lib/supabase/require-user";

export async function toggleTask(taskId: string, done: boolean) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("tasks").update({ done }).eq("id", taskId).eq("user_id", userId);
  revalidatePath("/dashboard");
}

export async function toggleHabitToday(habitId: string, completed: boolean) {
  const { supabase, userId } = await requireUserId();
  const today = toISODate(new Date());

  if (completed) {
    await supabase
      .from("habit_completions")
      .upsert(
        { habit_id: habitId, user_id: userId, completed_at: today, status: "completed" },
        { onConflict: "habit_id,completed_at" }
      );
  } else {
    await supabase
      .from("habit_completions")
      .delete()
      .eq("habit_id", habitId)
      .eq("completed_at", today);
  }
  revalidatePath("/dashboard");
}

export async function logWater(amountMl: number) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("water_logs").insert({ user_id: userId, amount_ml: amountMl });
  revalidatePath("/dashboard");
}
