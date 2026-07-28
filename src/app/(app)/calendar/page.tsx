import { createClient } from "@/lib/supabase/server";
import { CalendarView } from "@/components/calendar/CalendarView";
import type { Exam, Habit, HabitCompletion, StudySession, Task, Workout } from "@/lib/types";

export default async function CalendarPage() {
  const supabase = await createClient();

  const [tasksRes, workoutsRes, examsRes, studyRes, habitsRes, completionsRes] = await Promise.all([
    supabase.from("tasks").select("*"),
    supabase.from("workouts").select("*"),
    supabase.from("exams").select("*"),
    supabase.from("study_sessions").select("*"),
    supabase.from("habits").select("*"),
    supabase.from("habit_completions").select("*"),
  ]);

  return (
    <CalendarView
      tasks={(tasksRes.data as Task[]) ?? []}
      workouts={(workoutsRes.data as Workout[]) ?? []}
      exams={(examsRes.data as Exam[]) ?? []}
      studySessions={(studyRes.data as StudySession[]) ?? []}
      habits={(habitsRes.data as Habit[]) ?? []}
      habitCompletions={(completionsRes.data as HabitCompletion[]) ?? []}
    />
  );
}
