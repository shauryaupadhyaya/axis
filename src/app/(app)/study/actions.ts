"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/supabase/require-user";
import type { ChapterStatus, FlashcardStatus, HomeworkStatus, Priority } from "@/lib/types";

// ============ Subjects ============
export async function createSubject(name: string) {
  const { supabase, userId } = await requireUserId();
  const trimmed = name.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from("subjects")
    .insert({ user_id: userId, name: trimmed })
    .select("id")
    .single();
  revalidatePath("/study");
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function renameSubject(subjectId: string, name: string) {
  const { supabase, userId } = await requireUserId();
  const trimmed = name.trim();
  if (!trimmed) return;
  await supabase.from("subjects").update({ name: trimmed }).eq("id", subjectId).eq("user_id", userId);
  revalidatePath("/study");
  revalidatePath(`/study/${subjectId}`);
}

export async function deleteSubject(subjectId: string) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("subjects").delete().eq("id", subjectId).eq("user_id", userId);
  revalidatePath("/study");
}

// ============ Chapters ============
export async function addChapter(subjectId: string, name: string) {
  const { supabase, userId } = await requireUserId();
  const trimmed = name.trim();
  if (!trimmed) return null;
  const { data: existing } = await supabase.from("chapters").select("id").eq("subject_id", subjectId);
  const { data, error } = await supabase
    .from("chapters")
    .insert({ subject_id: subjectId, user_id: userId, name: trimmed, position: existing?.length ?? 0 })
    .select("id")
    .single();
  revalidatePath(`/study/${subjectId}`);
  if (error) throw new Error(error.message);
  return data.id as string;
}

/** Bulk-insert chapters generated from a syllabus (or any batch add), preserving order. */
export async function addChaptersBulk(subjectId: string, names: string[]) {
  const { supabase, userId } = await requireUserId();
  const cleaned = names.map((n) => n.trim()).filter(Boolean);
  if (cleaned.length === 0) return;
  const { data: existing } = await supabase.from("chapters").select("id").eq("subject_id", subjectId);
  const startPosition = existing?.length ?? 0;
  await supabase.from("chapters").insert(
    cleaned.map((name, i) => ({ subject_id: subjectId, user_id: userId, name, position: startPosition + i }))
  );
  revalidatePath(`/study/${subjectId}`);
}

export async function renameChapter(subjectId: string, chapterId: string, name: string) {
  const { supabase, userId } = await requireUserId();
  const trimmed = name.trim();
  if (!trimmed) return;
  await supabase.from("chapters").update({ name: trimmed }).eq("id", chapterId).eq("user_id", userId);
  revalidatePath(`/study/${subjectId}`);
}

export async function updateChapterStatus(subjectId: string, chapterId: string, status: ChapterStatus) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("chapters").update({ status }).eq("id", chapterId).eq("user_id", userId);
  revalidatePath(`/study/${subjectId}`);
}

export async function deleteChapter(subjectId: string, chapterId: string) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("chapters").delete().eq("id", chapterId).eq("user_id", userId);
  revalidatePath(`/study/${subjectId}`);
}

export async function reorderChapters(subjectId: string, orderedChapterIds: string[]) {
  const { supabase, userId } = await requireUserId();
  await Promise.all(
    orderedChapterIds.map((id, position) =>
      supabase.from("chapters").update({ position }).eq("id", id).eq("user_id", userId)
    )
  );
  revalidatePath(`/study/${subjectId}`);
}

export async function mergeChapters(subjectId: string, sourceChapterId: string, targetChapterId: string) {
  const { supabase, userId } = await requireUserId();
  // Re-home everything that referenced the source chapter onto the target, then drop the source.
  await Promise.all([
    supabase.from("notes").update({ chapter_id: targetChapterId }).eq("chapter_id", sourceChapterId).eq("user_id", userId),
    supabase.from("homework").update({ chapter_id: targetChapterId }).eq("chapter_id", sourceChapterId).eq("user_id", userId),
    supabase.from("study_sessions").update({ chapter_id: targetChapterId }).eq("chapter_id", sourceChapterId).eq("user_id", userId),
    supabase.from("flashcards").update({ chapter_id: targetChapterId }).eq("chapter_id", sourceChapterId).eq("user_id", userId),
    supabase.from("study_attachments").update({ chapter_id: targetChapterId }).eq("chapter_id", sourceChapterId).eq("user_id", userId),
  ]);
  await supabase.from("chapters").delete().eq("id", sourceChapterId).eq("user_id", userId);
  revalidatePath(`/study/${subjectId}`);
}

export async function splitChapter(subjectId: string, chapterId: string, newChapterNames: string[]) {
  const { supabase, userId } = await requireUserId();
  const cleaned = newChapterNames.map((n) => n.trim()).filter(Boolean);
  if (cleaned.length === 0) return;
  const { data: existing } = await supabase.from("chapters").select("id").eq("subject_id", subjectId);
  const startPosition = existing?.length ?? 0;
  await supabase.from("chapters").insert(
    cleaned.map((name, i) => ({ subject_id: subjectId, user_id: userId, name, position: startPosition + i }))
  );
  await supabase.from("chapters").delete().eq("id", chapterId).eq("user_id", userId);
  revalidatePath(`/study/${subjectId}`);
}

// ============ Revision ============
export const REVISION_STATUS_ORDER: ChapterStatus[] = [
  "not_started",
  "learning",
  "in_progress",
  "revised_once",
  "revised_twice",
  "mastered",
];

export async function logRevisionSession(subjectId: string, chapterId: string, minutes: number) {
  const { supabase, userId } = await requireUserId();
  const { data: chapter } = await supabase
    .from("chapters")
    .select("status, revision_count")
    .eq("id", chapterId)
    .eq("user_id", userId)
    .single();

  const nextCount = (chapter?.revision_count ?? 0) + 1;
  let nextStatus: ChapterStatus = chapter?.status ?? "not_started";
  if (nextStatus !== "mastered") {
    nextStatus = nextCount >= 2 ? "revised_twice" : "revised_once";
  }

  await Promise.all([
    supabase.from("study_sessions").insert({ user_id: userId, subject_id: subjectId, chapter_id: chapterId, minutes }),
    supabase
      .from("chapters")
      .update({ last_revised_at: new Date().toISOString(), revision_count: nextCount, status: nextStatus })
      .eq("id", chapterId)
      .eq("user_id", userId),
  ]);
  revalidatePath(`/study/${subjectId}`);
  revalidatePath("/dashboard");
}

// ============ Study sessions ============
export async function logChapterStudy(subjectId: string, chapterId: string | null, minutes: number) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("study_sessions").insert({ user_id: userId, subject_id: subjectId, chapter_id: chapterId, minutes });
  revalidatePath(`/study/${subjectId}`);
  revalidatePath("/study");
  revalidatePath("/dashboard");
}

// ============ Pomodoro ============
export async function startPomodoro(plannedMinutes: number, subjectId?: string, chapterId?: string, noteId?: string) {
  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("pomodoro_sessions")
    .insert({
      user_id: userId,
      subject_id: subjectId ?? null,
      chapter_id: chapterId ?? null,
      note_id: noteId ?? null,
      planned_minutes: plannedMinutes,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function completePomodoro(pomodoroId: string, actualMinutes: number, subjectId?: string, chapterId?: string) {
  const { supabase, userId } = await requireUserId();
  await supabase
    .from("pomodoro_sessions")
    .update({ actual_minutes: actualMinutes, completed: true, ended_at: new Date().toISOString() })
    .eq("id", pomodoroId)
    .eq("user_id", userId);
  if (actualMinutes > 0) {
    await supabase
      .from("study_sessions")
      .insert({ user_id: userId, subject_id: subjectId ?? null, chapter_id: chapterId ?? null, minutes: actualMinutes });
  }
  revalidatePath("/study");
  revalidatePath("/dashboard");
  if (subjectId) revalidatePath(`/study/${subjectId}`);
}

export async function discardPomodoro(pomodoroId: string) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("pomodoro_sessions").delete().eq("id", pomodoroId).eq("user_id", userId);
}

// ============ Homework ============
export async function createHomework(
  subjectId: string,
  title: string,
  extra?: { description?: string; dueAt?: string | null; priority?: Priority; chapterId?: string | null }
) {
  const { supabase, userId } = await requireUserId();
  const trimmed = title.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from("homework")
    .insert({
      user_id: userId,
      subject_id: subjectId,
      title: trimmed,
      description: extra?.description || null,
      due_at: extra?.dueAt ?? null,
      priority: extra?.priority ?? "medium",
      chapter_id: extra?.chapterId ?? null,
    })
    .select("id")
    .single();
  revalidatePath(`/study/${subjectId}`);
  revalidatePath("/study");
  revalidatePath("/calendar");
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function updateHomework(
  subjectId: string,
  homeworkId: string,
  updates: Partial<{
    title: string;
    description: string;
    due_at: string | null;
    priority: Priority;
    status: HomeworkStatus;
    chapter_id: string | null;
  }>
) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("homework").update(updates).eq("id", homeworkId).eq("user_id", userId);
  revalidatePath(`/study/${subjectId}`);
  revalidatePath("/study");
  revalidatePath("/calendar");
}

export async function setHomeworkStatus(subjectId: string, homeworkId: string, status: HomeworkStatus) {
  await updateHomework(subjectId, homeworkId, { status });
}

export async function rescheduleHomework(subjectId: string, homeworkId: string, dueDateIso: string) {
  await updateHomework(subjectId, homeworkId, { due_at: dueDateIso });
}

export async function deleteHomework(subjectId: string, homeworkId: string) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("homework").delete().eq("id", homeworkId).eq("user_id", userId);
  revalidatePath(`/study/${subjectId}`);
  revalidatePath("/study");
  revalidatePath("/calendar");
}

// ============ Exams ============
export async function createExam(
  subjectId: string,
  name: string,
  examDate: string,
  extra?: { chaptersCovered?: string[]; weightage?: number | null; notes?: string | null }
) {
  const { supabase, userId } = await requireUserId();
  const trimmed = name.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from("exams")
    .insert({
      user_id: userId,
      subject_id: subjectId,
      name: trimmed,
      exam_date: examDate,
      chapters_covered: extra?.chaptersCovered ?? [],
      weightage: extra?.weightage ?? null,
      notes: extra?.notes ?? null,
    })
    .select("id")
    .single();
  revalidatePath(`/study/${subjectId}`);
  revalidatePath("/study");
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function updateExam(
  subjectId: string,
  examId: string,
  updates: Partial<{ name: string; exam_date: string; chapters_covered: string[]; weightage: number | null; notes: string | null }>
) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("exams").update(updates).eq("id", examId).eq("user_id", userId);
  revalidatePath(`/study/${subjectId}`);
  revalidatePath("/study");
}

export async function deleteExam(subjectId: string, examId: string) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("exams").delete().eq("id", examId).eq("user_id", userId);
  revalidatePath(`/study/${subjectId}`);
  revalidatePath("/study");
}

// ============ Flashcards ============
export async function createFlashcard(front: string, back: string, opts?: { subjectId?: string; chapterId?: string; noteId?: string }) {
  const { supabase, userId } = await requireUserId();
  if (!front.trim() || !back.trim()) return null;
  const { data, error } = await supabase
    .from("flashcards")
    .insert({
      user_id: userId,
      subject_id: opts?.subjectId ?? null,
      chapter_id: opts?.chapterId ?? null,
      note_id: opts?.noteId ?? null,
      front: front.trim(),
      back: back.trim(),
    })
    .select("id")
    .single();
  if (opts?.subjectId) revalidatePath(`/study/${opts.subjectId}`);
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function reviewFlashcard(flashcardId: string, status: FlashcardStatus) {
  const { supabase, userId } = await requireUserId();
  const { data: card } = await supabase.from("flashcards").select("review_count").eq("id", flashcardId).eq("user_id", userId).single();
  await supabase
    .from("flashcards")
    .update({ status, review_count: (card?.review_count ?? 0) + 1, last_reviewed_at: new Date().toISOString() })
    .eq("id", flashcardId)
    .eq("user_id", userId);
}

export async function deleteFlashcard(flashcardId: string) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("flashcards").delete().eq("id", flashcardId).eq("user_id", userId);
}
