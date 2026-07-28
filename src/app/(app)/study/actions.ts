"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/supabase/require-user";
import type { ChapterStatus } from "@/lib/types";

export async function addSubject(name: string, examDate: string) {
  const { supabase, userId } = await requireUserId();
  const trimmed = name.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from("exams")
    .insert({ user_id: userId, subject_name: trimmed, exam_date: examDate })
    .select("id")
    .single();
  revalidatePath("/study");
  if (error) throw new Error(error.message);
  return data.id as string;
}

async function syncExamChapterCounts(subjectId: string, userId: string) {
  const { supabase } = await requireUserId();
  const { data: chapters } = await supabase
    .from("chapters")
    .select("status")
    .eq("subject_id", subjectId)
    .eq("user_id", userId);
  const total = chapters?.length ?? 0;
  const mastered = chapters?.filter((c) => c.status === "mastered").length ?? 0;
  await supabase
    .from("exams")
    .update({ chapters_total: total, chapters_mastered: mastered })
    .eq("id", subjectId)
    .eq("user_id", userId);
}

export async function addChapter(subjectId: string, name: string) {
  const { supabase, userId } = await requireUserId();
  const trimmed = name.trim();
  if (!trimmed) return;
  await supabase.from("chapters").insert({ subject_id: subjectId, user_id: userId, name: trimmed });
  await syncExamChapterCounts(subjectId, userId);
  revalidatePath(`/study/${subjectId}`);
}

export async function updateChapterStatus(subjectId: string, chapterId: string, status: ChapterStatus) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("chapters").update({ status }).eq("id", chapterId).eq("user_id", userId);
  await syncExamChapterCounts(subjectId, userId);
  revalidatePath(`/study/${subjectId}`);
}

export async function deleteChapter(subjectId: string, chapterId: string) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("chapters").delete().eq("id", chapterId).eq("user_id", userId);
  await syncExamChapterCounts(subjectId, userId);
  revalidatePath(`/study/${subjectId}`);
}

export async function logRevisionSession(subjectId: string, chapterId: string, minutes: number) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("study_sessions").insert({
    user_id: userId,
    subject_id: subjectId,
    chapter_id: chapterId,
    minutes,
  });
  await supabase
    .from("chapters")
    .update({ last_revised_at: new Date().toISOString() })
    .eq("id", chapterId)
    .eq("user_id", userId);
  revalidatePath(`/study/${subjectId}`);
  revalidatePath("/dashboard");
}

export async function logChapterStudy(subjectId: string, chapterId: string, minutes: number) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("study_sessions").insert({
    user_id: userId,
    subject_id: subjectId,
    chapter_id: chapterId,
    minutes,
  });
  revalidatePath(`/study/${subjectId}`);
  revalidatePath("/dashboard");
}
