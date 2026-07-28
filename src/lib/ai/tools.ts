import { tool } from "ai";
import { z } from "zod";
import { requireUserId } from "@/lib/supabase/require-user";

export const createTaskTool = tool({
  description: "Create a new task for the user, optionally with a due date.",
  inputSchema: z.object({
    title: z.string().describe("The task title"),
    dueDate: z.string().optional().describe("ISO date (YYYY-MM-DD) the task is due, if mentioned"),
  }),
  execute: async ({ title, dueDate }) => {
    const { supabase, userId } = await requireUserId();
    const { data, error } = await supabase
      .from("tasks")
      .insert({ user_id: userId, title, due_at: dueDate ?? null })
      .select("id")
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, taskId: data.id as string, title, dueDate: dueDate ?? null };
  },
});
