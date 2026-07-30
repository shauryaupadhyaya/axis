"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/supabase/require-user";
import type { Priority, RecurrenceRule } from "@/lib/types";
import * as taskService from "@/lib/tasks/service";
import type { CompletionResult } from "@/lib/tasks/service";

export async function createTask(input: {
  title: string;
  description?: string | null;
  due_at?: string | null;
  priority?: Priority;
  tags?: string[];
  parent_task_id?: string | null;
  recurrence?: RecurrenceRule | null;
  reminder_at?: string | null;
}) {
  const ctx = await requireUserId();
  const id = await taskService.createTask(ctx, input);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return id;
}

export async function updateTask(
  taskId: string,
  patch: Partial<{
    title: string;
    description: string | null;
    due_at: string | null;
    priority: Priority;
    tags: string[];
    recurrence: RecurrenceRule | null;
    reminder_at: string | null;
    done: boolean;
  }>
) {
  const ctx = await requireUserId();
  await taskService.updateTask(ctx, taskId, patch);
  revalidatePath("/tasks");
}

/** Recurring-aware completion: advances due_at instead of marking done when the task repeats. */
export async function completeTask(taskId: string): Promise<CompletionResult> {
  const ctx = await requireUserId();
  const result = await taskService.completeTask(ctx, taskId);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return result;
}

export async function uncompleteTask(taskId: string, undo: CompletionResult) {
  const ctx = await requireUserId();
  await taskService.uncompleteTask(ctx, taskId, undo);
  revalidatePath("/tasks");
}

export async function stopRecurrence(taskId: string) {
  const ctx = await requireUserId();
  await taskService.stopRecurrence(ctx, taskId);
  revalidatePath("/tasks");
}

export async function deleteTask(taskId: string) {
  const ctx = await requireUserId();
  await taskService.deleteTask(ctx, taskId);
  revalidatePath("/tasks");
}

export async function addSubtask(parentTaskId: string, title: string) {
  const ctx = await requireUserId();
  const id = await taskService.addSubtask(ctx, parentTaskId, title);
  revalidatePath("/tasks");
  return id;
}

export async function addComment(taskId: string, body: string) {
  const ctx = await requireUserId();
  const comment = await taskService.addComment(ctx, taskId, body);
  revalidatePath("/tasks");
  return comment;
}

export async function deleteComment(commentId: string) {
  const ctx = await requireUserId();
  await taskService.deleteComment(ctx, commentId);
  revalidatePath("/tasks");
}
