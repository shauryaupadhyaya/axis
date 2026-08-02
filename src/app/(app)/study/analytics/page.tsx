import { createClient } from "@/lib/supabase/server";
import { AnalyticsView } from "@/components/study/AnalyticsView";
import type { Chapter, Exam, Homework, Note, PomodoroSession, StudySession, Subject } from "@/lib/types";

export default async function StudyAnalyticsPage() {
  const supabase = await createClient();

  const [subjectsRes, chaptersRes, homeworkRes, examsRes, sessionsRes, pomodoroRes, notesRes] = await Promise.all([
    supabase.from("subjects").select("*").order("created_at", { ascending: true }),
    supabase.from("chapters").select("*"),
    supabase.from("homework").select("*"),
    supabase.from("exams").select("*"),
    supabase.from("study_sessions").select("*"),
    supabase.from("pomodoro_sessions").select("*"),
    supabase.from("notes").select("*"),
  ]);

  return (
    <AnalyticsView
      subjects={(subjectsRes.data as Subject[]) ?? []}
      chapters={(chaptersRes.data as Chapter[]) ?? []}
      homework={(homeworkRes.data as Homework[]) ?? []}
      exams={(examsRes.data as Exam[]) ?? []}
      studySessions={(sessionsRes.data as StudySession[]) ?? []}
      pomodoroSessions={(pomodoroRes.data as PomodoroSession[]) ?? []}
      notes={(notesRes.data as Note[]) ?? []}
    />
  );
}
