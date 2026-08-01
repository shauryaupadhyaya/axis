import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubjectDetail } from "@/components/study/SubjectDetail";
import type { Chapter, Exam, Homework, StudySession, Subject } from "@/lib/types";

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId: subjectId } = await params;
  const supabase = await createClient();

  const [subjectRes, examsRes, chaptersRes, sessionsRes, homeworkRes] = await Promise.all([
    supabase.from("subjects").select("*").eq("id", subjectId).single(),
    supabase.from("exams").select("*").eq("subject_id", subjectId).order("exam_date"),
    supabase.from("chapters").select("*").eq("subject_id", subjectId).order("position"),
    supabase.from("study_sessions").select("*").eq("subject_id", subjectId).order("logged_at"),
    supabase.from("homework").select("*").eq("subject_id", subjectId).order("due_at"),
  ]);

  if (!subjectRes.data) notFound();

  return (
    <SubjectDetail
      subject={subjectRes.data as Subject}
      exams={(examsRes.data as Exam[]) ?? []}
      chapters={(chaptersRes.data as Chapter[]) ?? []}
      studySessions={(sessionsRes.data as StudySession[]) ?? []}
      homework={(homeworkRes.data as Homework[]) ?? []}
    />
  );
}
