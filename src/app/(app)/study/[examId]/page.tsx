import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubjectDetail } from "@/components/study/SubjectDetail";
import type { Chapter, Exam, Flashcard, Homework, Note, StudyAttachment, StudySession, Subject } from "@/lib/types";

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId: subjectId } = await params;
  const supabase = await createClient();

  const [subjectRes, examsRes, chaptersRes, sessionsRes, homeworkRes, flashcardsRes, notesRes, attachmentsRes] = await Promise.all([
    supabase.from("subjects").select("*").eq("id", subjectId).single(),
    supabase.from("exams").select("*").eq("subject_id", subjectId).order("exam_date"),
    supabase.from("chapters").select("*").eq("subject_id", subjectId).order("position"),
    supabase.from("study_sessions").select("*").eq("subject_id", subjectId).order("logged_at"),
    supabase.from("homework").select("*").eq("subject_id", subjectId).order("due_at"),
    supabase.from("flashcards").select("*").eq("subject_id", subjectId).order("created_at", { ascending: false }),
    supabase.from("notes").select("*").not("chapter_id", "is", null),
    supabase.from("study_attachments").select("*"),
  ]);

  if (!subjectRes.data) notFound();

  const chapterIds = new Set(((chaptersRes.data as Chapter[]) ?? []).map((c) => c.id));
  const chapterNotes = ((notesRes.data as Note[]) ?? []).filter((n) => n.chapter_id && chapterIds.has(n.chapter_id));
  const chapterAttachments = ((attachmentsRes.data as StudyAttachment[]) ?? []).filter((a) => chapterIds.has(a.chapter_id));

  return (
    <SubjectDetail
      subject={subjectRes.data as Subject}
      exams={(examsRes.data as Exam[]) ?? []}
      chapters={(chaptersRes.data as Chapter[]) ?? []}
      studySessions={(sessionsRes.data as StudySession[]) ?? []}
      homework={(homeworkRes.data as Homework[]) ?? []}
      flashcards={(flashcardsRes.data as Flashcard[]) ?? []}
      notes={chapterNotes}
      attachments={chapterAttachments}
    />
  );
}
