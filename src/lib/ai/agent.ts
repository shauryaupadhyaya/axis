import { ToolLoopAgent, type InferAgentUIMessage } from "ai";
import type { AppSnapshot } from "@/lib/app-snapshot";
import { createTaskTool } from "./tools";

export function buildInstructions(snapshot: AppSnapshot, now: Date) {
  const overdueTasks = snapshot.tasks.filter((t) => t.due_at && new Date(t.due_at) < now);
  const upcomingExams = snapshot.exams
    .filter((e) => new Date(e.exam_date) >= now)
    .sort((a, b) => a.exam_date.localeCompare(b.exam_date))
    .slice(0, 5);

  return [
    "You are Axis, a helpful personal productivity assistant embedded in the user's tasks/calendar/study/health app.",
    `Today's date is ${now.toISOString().slice(0, 10)}.`,
    "Be concise and friendly. When the user asks you to create a task, use the createTask tool.",
    "",
    `Open tasks: ${snapshot.tasks.length} (${overdueTasks.length} overdue).`,
    upcomingExams.length > 0
      ? `Upcoming exams: ${upcomingExams.map((e) => `${e.subject_name} on ${e.exam_date}`).join(", ")}.`
      : "No upcoming exams.",
    `Habits tracked: ${snapshot.habits.length}, ${snapshot.habitCompletions.length} completed today.`,
  ].join("\n");
}

export function createAssistantAgent(snapshot: AppSnapshot, now = new Date()) {
  return new ToolLoopAgent({
    model: "anthropic/claude-sonnet-5",
    instructions: buildInstructions(snapshot, now),
    tools: { createTask: createTaskTool },
  });
}

export type AssistantUIMessage = InferAgentUIMessage<ReturnType<typeof createAssistantAgent>>;
