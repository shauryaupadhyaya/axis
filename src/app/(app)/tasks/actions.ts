"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/supabase/require-user";
import type { Priority, TaskBoardStatus } from "@/lib/types";

export async function createTask(title: string) {
  const { supabase, userId } = await requireUserId();
  const trimmed = title.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from("tasks")
    .insert({ user_id: userId, title: trimmed })
    .select("id")
    .single();
  revalidatePath("/tasks");
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function updateTask(
  taskId: string,
  patch: Partial<{
    title: string;
    description: string;
    due_at: string | null;
    priority: Priority;
    tags: string[];
  }>
) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("tasks").update(patch).eq("id", taskId).eq("user_id", userId);
  revalidatePath("/tasks");
}

export async function toggleTaskDone(taskId: string, done: boolean) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("tasks").update({ done }).eq("id", taskId).eq("user_id", userId);
  revalidatePath("/tasks");
}

export async function deleteTask(taskId: string) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", userId);
  revalidatePath("/tasks");
}

export async function moveTaskBoardStatus(taskId: string, status: TaskBoardStatus) {
  const { supabase, userId } = await requireUserId();
  const patch =
    status === "completed"
      ? { done: true, in_progress: false }
      : status === "in_progress"
        ? { done: false, in_progress: true }
        : { done: false, in_progress: false };
  await supabase.from("tasks").update(patch).eq("id", taskId).eq("user_id", userId);
  revalidatePath("/tasks");
}

export async function addSubtask(taskId: string, title: string) {
  const { supabase, userId } = await requireUserId();
  const trimmed = title.trim();
  if (!trimmed) return;
  await supabase.from("task_subtasks").insert({ task_id: taskId, user_id: userId, title: trimmed });
  revalidatePath("/tasks");
}

export async function toggleSubtask(subtaskId: string, done: boolean) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("task_subtasks").update({ done }).eq("id", subtaskId).eq("user_id", userId);
  revalidatePath("/tasks");
}

export async function deleteSubtask(subtaskId: string) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("task_subtasks").delete().eq("id", subtaskId).eq("user_id", userId);
  revalidatePath("/tasks");
}
