import { createClient } from "@/lib/supabase/server";
import { CalendarView } from "@/components/calendar/CalendarView";
import type {
  CalendarEventRow,
  Exam,
  Habit,
  HabitCompletion,
  Homework,
  StudySession,
  Subject,
  Task,
  Workout,
} from "@/lib/types";

export default async function CalendarPage() {
  const supabase = await createClient();

  const [tasksRes, workoutsRes, examsRes, subjectsRes, studyRes, habitsRes, completionsRes, homeworkRes, eventsRes] =
    await Promise.all([
      supabase.from("tasks").select("*").is("parent_task_id", null),
      supabase.from("workouts").select("*"),
      supabase.from("exams").select("*"),
      supabase.from("subjects").select("*"),
      supabase.from("study_sessions").select("*"),
      supabase.from("habits").select("*"),
      supabase.from("habit_completions").select("*"),
      supabase.from("homework").select("*"),
      supabase.from("calendar_events").select("*"),
    ]);

  return (
    <CalendarView
      tasks={(tasksRes.data as Task[]) ?? []}
      workouts={(workoutsRes.data as Workout[]) ?? []}
      exams={(examsRes.data as Exam[]) ?? []}
      subjects={(subjectsRes.data as Subject[]) ?? []}
      studySessions={(studyRes.data as StudySession[]) ?? []}
      habits={(habitsRes.data as Habit[]) ?? []}
      habitCompletions={(completionsRes.data as HabitCompletion[]) ?? []}
      homework={(homeworkRes.data as Homework[]) ?? []}
      calendarEvents={(eventsRes.data as CalendarEventRow[]) ?? []}
    />
  );
}
