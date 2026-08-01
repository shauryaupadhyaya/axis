import { createClient } from "@/lib/supabase/server";
import { SubjectsList } from "@/components/study/SubjectsList";
import type { Chapter, Exam, Homework, Subject } from "@/lib/types";

export default async function StudyPage() {
  const supabase = await createClient();
  const [subjectsRes, examsRes, chaptersRes, homeworkRes] = await Promise.all([
    supabase.from("subjects").select("*").order("created_at", { ascending: true }),
    supabase.from("exams").select("*").order("exam_date", { ascending: true }),
    supabase.from("chapters").select("*"),
    supabase.from("homework").select("*"),
  ]);

  return (
    <SubjectsList
      subjects={(subjectsRes.data as Subject[]) ?? []}
      exams={(examsRes.data as Exam[]) ?? []}
      chapters={(chaptersRes.data as Chapter[]) ?? []}
      homework={(homeworkRes.data as Homework[]) ?? []}
    />
  );
}
