import { tool } from "ai";
import { z } from "zod";
import { requireUserId } from "@/lib/supabase/require-user";
import * as taskService from "@/lib/tasks/service";
import type { RecurrenceRule } from "@/lib/types";

const priorityInput = z.enum(["low", "medium", "high", "urgent"]).describe("Task priority.");

const recurrenceInput = z
  .object({
    freq: z
      .enum(["daily", "weekly", "monthly", "yearly", "weekdays"])
      .describe("How often the task repeats."),
    interval: z
      .number()
      .int()
      .min(1)
      .describe("Repeat every N units of freq, e.g. 1 = every week, 2 = every 2 weeks."),
    byDay: z
      .array(z.enum(["SU", "MO", "TU", "WE", "TH", "FR", "SA"]))
      .optional()
      .describe("For weekly recurrence, which days of the week, e.g. ['MO'] for 'every Monday'."),
    byMonthDay: z
      .number()
      .int()
      .min(1)
      .max(31)
      .optional()
      .describe("For monthly recurrence, the day of the month it repeats on."),
  })
  .describe(
    "Recurrence rule, e.g. 'every Monday' -> {freq:'weekly', interval:1, byDay:['MO']}, 'every 2 weeks' -> {freq:'weekly', interval:2}."
  );

function combineDueAt(dueDate?: string, dueTime?: string): string | null {
  if (!dueDate) return null;
  const combined = new Date(`${dueDate}T${dueTime ?? "00:00"}:00`);
  return Number.isNaN(combined.getTime()) ? dueDate : combined.toISOString();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export const listTasksTool = tool({
  description:
    "List the user's open (not yet completed) top-level tasks with their ids, titles, due dates, priorities, and recurrence. " +
    "You MUST call this first to resolve a task's id from its name or description before calling updateTask, completeTask, deleteTask, or addSubtask — you cannot guess a task id.",
  inputSchema: z.object({
    includeDone: z.boolean().optional().describe("Set true to also include already-completed tasks."),
  }),
  execute: async ({ includeDone }) => {
    try {
      const ctx = await requireUserId();
      const tasks = await taskService.listOpenTasks(ctx, { includeDone });
      return { success: true, tasks };
    } catch (error) {
      return { success: false, error: errorMessage(error) };
    }
  },
});

export const createTaskTool = tool({
  description: "Create a new task for the user, optionally with a due date/time, priority, labels, recurrence, or as a subtask of an existing task.",
  inputSchema: z.object({
    title: z.string().describe("The task title"),
    dueDate: z.string().optional().describe("ISO date (YYYY-MM-DD) the task is due, if mentioned"),
    dueTime: z.string().optional().describe("Time of day the task is due, as HH:mm (24-hour), if mentioned"),
    priority: priorityInput.optional(),
    labels: z.array(z.string()).optional().describe("Free-form labels/tags for the task"),
    recurrence: recurrenceInput.optional(),
    parentTaskId: z
      .string()
      .optional()
      .describe("If set, creates this task as a subtask under the task with this id (obtained via listTasks)."),
  }),
  execute: async ({ title, dueDate, dueTime, priority, labels, recurrence, parentTaskId }) => {
    try {
      const ctx = await requireUserId();
      const taskId = await taskService.createTask(ctx, {
        title,
        due_at: combineDueAt(dueDate, dueTime),
        priority,
        tags: labels,
        recurrence: recurrence as RecurrenceRule | undefined,
        parent_task_id: parentTaskId ?? null,
      });
      if (!taskId) return { success: false, error: "Task title was empty" };
      return {
        success: true,
        taskId,
        title,
        dueDate: dueDate ?? null,
        priority: priority ?? null,
        labels: labels ?? [],
        recurrence: recurrence ?? null,
        parentTaskId: parentTaskId ?? null,
      };
    } catch (error) {
      return { success: false, error: errorMessage(error) };
    }
  },
});

export const updateTaskTool = tool({
  description:
    "Update an existing task's title, due date/time, priority, labels, or recurrence. " +
    "The taskId must first be resolved via listTasks — never guess it.",
  inputSchema: z.object({
    taskId: z.string().describe("The id of the task to update, obtained via listTasks"),
    title: z.string().optional(),
    dueDate: z.string().optional().describe("ISO date (YYYY-MM-DD) the task is due"),
    dueTime: z.string().optional().describe("Time of day the task is due, as HH:mm (24-hour)"),
    priority: priorityInput.optional(),
    labels: z.array(z.string()).optional().describe("Replaces the task's existing labels/tags"),
    recurrence: recurrenceInput.optional(),
  }),
  execute: async ({ taskId, title, dueDate, dueTime, priority, labels, recurrence }) => {
    try {
      const ctx = await requireUserId();
      const patch: taskService.UpdateTaskInput = {};
      if (title !== undefined) patch.title = title;
      if (priority !== undefined) patch.priority = priority;
      if (labels !== undefined) patch.tags = labels;
      if (recurrence !== undefined) patch.recurrence = recurrence as RecurrenceRule;
      if (dueDate !== undefined) patch.due_at = combineDueAt(dueDate, dueTime);
      await taskService.updateTask(ctx, taskId, patch);
      return { success: true, taskId, ...patch };
    } catch (error) {
      return { success: false, error: errorMessage(error) };
    }
  },
});

export const completeTaskTool = tool({
  description:
    "Mark a task as done. If the task recurs, this instead advances it to its next occurrence rather than closing it for good. " +
    "The taskId must first be resolved via listTasks — never guess it.",
  inputSchema: z.object({
    taskId: z.string().describe("The id of the task to complete, obtained via listTasks"),
  }),
  execute: async ({ taskId }) => {
    try {
      const ctx = await requireUserId();
      const result = await taskService.completeTask(ctx, taskId);
      return { success: true, taskId, recurred: result.recurred };
    } catch (error) {
      return { success: false, error: errorMessage(error) };
    }
  },
});

export const deleteTaskTool = tool({
  description: "Permanently delete a task. The taskId must first be resolved via listTasks — never guess it.",
  inputSchema: z.object({
    taskId: z.string().describe("The id of the task to delete, obtained via listTasks"),
  }),
  execute: async ({ taskId }) => {
    try {
      const ctx = await requireUserId();
      await taskService.deleteTask(ctx, taskId);
      return { success: true, taskId };
    } catch (error) {
      return { success: false, error: errorMessage(error) };
    }
  },
});

export const addSubtaskTool = tool({
  description:
    "Add a subtask under an existing parent task. The parentTaskId must first be resolved via listTasks — never guess it.",
  inputSchema: z.object({
    parentTaskId: z.string().describe("The id of the parent task, obtained via listTasks"),
    title: z.string().describe("The subtask title"),
  }),
  execute: async ({ parentTaskId, title }) => {
    try {
      const ctx = await requireUserId();
      const subtaskId = await taskService.addSubtask(ctx, parentTaskId, title);
      if (!subtaskId) return { success: false, error: "Subtask title was empty" };
      return { success: true, subtaskId, parentTaskId, title };
    } catch (error) {
      return { success: false, error: errorMessage(error) };
    }
  },
});
