import { createClient } from "@/lib/supabase/server";
import { SubjectsList } from "@/components/study/SubjectsList";
import type { Chapter, Exam, Homework, Note, PomodoroSession, StudySession, Subject } from "@/lib/types";

export default async function StudyPage() {
  const supabase = await createClient();
  const [subjectsRes, examsRes, chaptersRes, homeworkRes, studySessionsRes, pomodoroRes, notesRes] = await Promise.all([
    supabase.from("subjects").select("*").order("created_at", { ascending: true }),
    supabase.from("exams").select("*").order("exam_date", { ascending: true }),
    supabase.from("chapters").select("*"),
    supabase.from("homework").select("*"),
    supabase.from("study_sessions").select("*"),
    supabase.from("pomodoro_sessions").select("*"),
    supabase.from("notes").select("*"),
  ]);

  return (
    <SubjectsList
      subjects={(subjectsRes.data as Subject[]) ?? []}
      exams={(examsRes.data as Exam[]) ?? []}
      chapters={(chaptersRes.data as Chapter[]) ?? []}
      homework={(homeworkRes.data as Homework[]) ?? []}
      studySessions={(studySessionsRes.data as StudySession[]) ?? []}
      pomodoroSessions={(pomodoroRes.data as PomodoroSession[]) ?? []}
      notes={(notesRes.data as Note[]) ?? []}
    />
  );
}
