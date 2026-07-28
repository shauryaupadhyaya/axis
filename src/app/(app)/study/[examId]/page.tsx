import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubjectDetail } from "@/components/study/SubjectDetail";
import type { Chapter, Exam, Homework, StudySession } from "@/lib/types";

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const supabase = await createClient();

  const [examRes, chaptersRes, sessionsRes, homeworkRes] = await Promise.all([
    supabase.from("exams").select("*").eq("id", examId).single(),
    supabase.from("chapters").select("*").eq("subject_id", examId).order("position"),
    supabase.from("study_sessions").select("*").eq("subject_id", examId).order("logged_at"),
    supabase.from("homework").select("*").eq("subject_id", examId).order("due_at"),
  ]);

  if (!examRes.data) notFound();

  return (
    <SubjectDetail
      exam={examRes.data as Exam}
      chapters={(chaptersRes.data as Chapter[]) ?? []}
      studySessions={(sessionsRes.data as StudySession[]) ?? []}
      homework={(homeworkRes.data as Homework[]) ?? []}
    />
  );
}
