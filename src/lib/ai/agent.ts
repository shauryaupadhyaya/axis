import { ToolLoopAgent, type InferAgentUIMessage } from "ai";
import type { AppSnapshot } from "@/lib/app-snapshot";
import {
  addSubtaskTool,
  completeTaskTool,
  createTaskTool,
  deleteTaskTool,
  listTasksTool,
  updateTaskTool,
} from "./tools";

export function buildInstructions(snapshot: AppSnapshot, now: Date) {
  const overdueTasks = snapshot.tasks.filter((t) => t.due_at && new Date(t.due_at) < now);
  const upcomingExams = snapshot.exams
    .filter((e) => new Date(e.exam_date) >= now)
    .sort((a, b) => a.exam_date.localeCompare(b.exam_date))
    .slice(0, 5);

  return [
    "You are Axis, a helpful personal productivity assistant embedded in the user's tasks/calendar/study/health app.",
    `Today's date is ${now.toISOString().slice(0, 10)}.`,
    "Be concise and friendly. You can list, create, update, complete, and delete tasks, and add subtasks, using the listTasks, createTask, updateTask, completeTask, deleteTask, and addSubtask tools.",
    "Before calling updateTask, completeTask, deleteTask, or addSubtask, always call listTasks first to resolve the target task's id from its name — you cannot guess ids.",
    "Completing a recurring task advances it to its next occurrence instead of closing it for good; mention that to the user when it happens.",
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
    tools: {
      listTasks: listTasksTool,
      createTask: createTaskTool,
      updateTask: updateTaskTool,
      completeTask: completeTaskTool,
      deleteTask: deleteTaskTool,
      addSubtask: addSubtaskTool,
    },
  });
}

export type AssistantUIMessage = InferAgentUIMessage<ReturnType<typeof createAssistantAgent>>;
