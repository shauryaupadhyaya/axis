"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/supabase/require-user";
import { toISODate } from "@/lib/scores";
import type { HabitFrequency } from "@/lib/types";

export async function createHabit(name: string, frequency: HabitFrequency) {
  const { supabase, userId } = await requireUserId();
  const trimmed = name.trim();
  if (!trimmed) return;
  await supabase.from("habits").insert({ user_id: userId, name: trimmed, frequency });
  revalidatePath("/habits");
  revalidatePath("/dashboard");
}

export async function updateHabitFrequency(habitId: string, frequency: HabitFrequency) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("habits").update({ frequency }).eq("id", habitId).eq("user_id", userId);
  revalidatePath("/habits");
}

export async function deleteHabit(habitId: string) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("habits").delete().eq("id", habitId).eq("user_id", userId);
  revalidatePath("/habits");
  revalidatePath("/dashboard");
}

export async function toggleHabitDate(habitId: string, dateIso: string, completed: boolean) {
  const { supabase, userId } = await requireUserId();
  if (completed) {
    await supabase
      .from("habit_completions")
      .upsert(
        { habit_id: habitId, user_id: userId, completed_at: dateIso, status: "completed" },
        { onConflict: "habit_id,completed_at" }
      );
  } else {
    await supabase.from("habit_completions").delete().eq("habit_id", habitId).eq("completed_at", dateIso);
  }
  revalidatePath("/habits");
  revalidatePath("/dashboard");
}

export async function toggleHabitToday(habitId: string, completed: boolean) {
  await toggleHabitDate(habitId, toISODate(new Date()), completed);
}
