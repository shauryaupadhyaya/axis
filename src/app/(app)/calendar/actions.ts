"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/supabase/require-user";

export async function rescheduleTask(taskId: string, dueDateIso: string) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("tasks").update({ due_at: dueDateIso }).eq("id", taskId).eq("user_id", userId);
  revalidatePath("/calendar");
  revalidatePath("/tasks");
}

export async function rescheduleWorkout(workoutId: string, scheduledDateIso: string) {
  const { supabase, userId } = await requireUserId();
  await supabase
    .from("workouts")
    .update({ scheduled_date: scheduledDateIso })
    .eq("id", workoutId)
    .eq("user_id", userId);
  revalidatePath("/calendar");
  revalidatePath("/health");
}
