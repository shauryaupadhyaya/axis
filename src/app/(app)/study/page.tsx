import { createClient } from "@/lib/supabase/server";
import { SubjectsList } from "@/components/study/SubjectsList";
import type { Exam } from "@/lib/types";

export default async function StudyPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("exams").select("*").order("exam_date", { ascending: true });

  return <SubjectsList exams={(data as Exam[]) ?? []} />;
}
