import { requireUserId } from "@/lib/supabase/require-user";
import type { CalendarEventRow, Exam, Habit, HabitCompletion, Homework, Subject, Task } from "@/lib/types";

export interface AppSnapshot {
  tasks: Task[];
  homework: Homework[];
  subjects: Subject[];
  exams: Exam[];
  calendarEvents: CalendarEventRow[];
  habits: Habit[];
  habitCompletions: HabitCompletion[];
}

/** Shared per-request data fetch used by both the notification center and the AI assistant. */
export async function getAppSnapshot(): Promise<AppSnapshot> {
  const { supabase } = await requireUserId();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString().slice(0, 10);

  const [tasksRes, homeworkRes, subjectsRes, examsRes, eventsRes, habitsRes, completionsRes] = await Promise.all([
    supabase.from("tasks").select("*").eq("done", false).is("parent_task_id", null),
    supabase.from("homework").select("*").neq("status", "completed"),
    supabase.from("subjects").select("*"),
    supabase.from("exams").select("*"),
    supabase.from("calendar_events").select("*"),
    supabase.from("habits").select("*"),
    supabase.from("habit_completions").select("*").eq("completed_at", todayIso),
  ]);

  return {
    tasks: (tasksRes.data as Task[]) ?? [],
    homework: (homeworkRes.data as Homework[]) ?? [],
    subjects: (subjectsRes.data as Subject[]) ?? [],
    exams: (examsRes.data as Exam[]) ?? [],
    calendarEvents: (eventsRes.data as CalendarEventRow[]) ?? [],
    habits: (habitsRes.data as Habit[]) ?? [],
    habitCompletions: (completionsRes.data as HabitCompletion[]) ?? [],
  };
}
