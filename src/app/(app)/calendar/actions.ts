"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/supabase/require-user";
import type { CalendarEventKind } from "@/lib/types";

export async function createCalendarEvent(title: string, dateIso: string, type: CalendarEventKind, notes: string | null) {
  const { supabase, userId } = await requireUserId();
  const trimmed = title.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from("calendar_events")
    .insert({ user_id: userId, title: trimmed, event_date: dateIso, event_type: type, notes })
    .select("id")
    .single();
  revalidatePath("/calendar");
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function updateCalendarEvent(
  eventId: string,
  updates: Partial<{ title: string; notes: string | null; event_type: CalendarEventKind }>
) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("calendar_events").update(updates).eq("id", eventId).eq("user_id", userId);
  revalidatePath("/calendar");
}

export async function rescheduleCalendarEvent(eventId: string, dateIso: string) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("calendar_events").update({ event_date: dateIso }).eq("id", eventId).eq("user_id", userId);
  revalidatePath("/calendar");
}

export async function deleteCalendarEvent(eventId: string) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("calendar_events").delete().eq("id", eventId).eq("user_id", userId);
  revalidatePath("/calendar");
}

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
