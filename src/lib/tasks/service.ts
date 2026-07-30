import type { requireUserId } from "@/lib/supabase/require-user";
import type { Priority, RecurrenceRule } from "@/lib/types";
import { computeNextOccurrence } from "./recurrence";

type Ctx = Awaited<ReturnType<typeof requireUserId>>;

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  due_at?: string | null;
  priority?: Priority;
  tags?: string[];
  parent_task_id?: string | null;
  recurrence?: RecurrenceRule | null;
  reminder_at?: string | null;
}

export async function createTask({ supabase, userId }: Ctx, input: CreateTaskInput) {
  const title = input.title.trim();
  if (!title) return null;
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      title,
      description: input.description ?? null,
      due_at: input.due_at ?? null,
      priority: input.priority ?? "medium",
      tags: input.tags ?? [],
      parent_task_id: input.parent_task_id ?? null,
      recurrence: input.recurrence ?? null,
      reminder_at: input.reminder_at ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  due_at?: string | null;
  priority?: Priority;
  tags?: string[];
  recurrence?: RecurrenceRule | null;
  reminder_at?: string | null;
  /** Plain checkbox toggle (non-recurring-aware). Use completeTask/uncompleteTask for the recurrence-aware path. */
  done?: boolean;
}

export async function updateTask({ supabase, userId }: Ctx, taskId: string, patch: UpdateTaskInput) {
  const { error } = await supabase.from("tasks").update(patch).eq("id", taskId).eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export interface CompletionResult {
  recurred: boolean;
  previousDueAt: string | null;
}

/** Completing a recurring task advances due_at to the next occurrence instead of marking it done. */
export async function completeTask({ supabase, userId }: Ctx, taskId: string): Promise<CompletionResult> {
  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("due_at, recurrence")
    .eq("id", taskId)
    .eq("user_id", userId)
    .single();
  if (fetchError || !task) throw new Error(fetchError?.message ?? "Task not found");

  const now = new Date().toISOString();

  if (task.recurrence && task.due_at) {
    const next = computeNextOccurrence(new Date(task.due_at), task.recurrence as RecurrenceRule);
    const { error } = await supabase
      .from("tasks")
      .update({ due_at: next.toISOString(), completed_at: now, done: false })
      .eq("id", taskId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { recurred: true, previousDueAt: task.due_at };
  }

  const { error } = await supabase
    .from("tasks")
    .update({ done: true, completed_at: now })
    .eq("id", taskId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return { recurred: false, previousDueAt: null };
}

/** Reverts a completion within the undo window (see completeTask). */
export async function uncompleteTask({ supabase, userId }: Ctx, taskId: string, undo: CompletionResult) {
  const patch = undo.recurred
    ? { due_at: undo.previousDueAt, completed_at: null }
    : { done: false, completed_at: null };
  const { error } = await supabase.from("tasks").update(patch).eq("id", taskId).eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function stopRecurrence({ supabase, userId }: Ctx, taskId: string) {
  const { error } = await supabase.from("tasks").update({ recurrence: null }).eq("id", taskId).eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function deleteTask({ supabase, userId }: Ctx, taskId: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function listOpenTasks({ supabase, userId }: Ctx, opts?: { includeDone?: boolean }) {
  let query = supabase
    .from("tasks")
    .select("id, title, due_at, priority, done, recurrence, parent_task_id")
    .eq("user_id", userId)
    .is("parent_task_id", null)
    .order("due_at", { ascending: true, nullsFirst: false });
  if (!opts?.includeDone) query = query.eq("done", false);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addSubtask(ctx: Ctx, parentTaskId: string, title: string) {
  return createTask(ctx, { title, parent_task_id: parentTaskId });
}

export async function addComment({ supabase, userId }: Ctx, taskId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from("task_comments")
    .insert({ task_id: taskId, user_id: userId, body: trimmed })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteComment({ supabase, userId }: Ctx, commentId: string) {
  const { error } = await supabase.from("task_comments").delete().eq("id", commentId).eq("user_id", userId);
  if (error) throw new Error(error.message);
}
