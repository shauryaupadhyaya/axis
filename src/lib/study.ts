import type { Chapter, ChapterStatus, Exam, Homework, HomeworkStatus, StudySession } from "@/lib/types";
import { toISODate } from "@/lib/scores";

export const CHAPTER_STATUS_ORDER: ChapterStatus[] = [
  "not_started",
  "learning",
  "in_progress",
  "revised_once",
  "revised_twice",
  "mastered",
];

export const CHAPTER_STATUS_LABEL: Record<ChapterStatus, string> = {
  not_started: "Not started",
  learning: "Learning",
  in_progress: "In progress",
  revised_once: "Revised once",
  revised_twice: "Revised twice",
  mastered: "Mastered",
};

export const CHAPTER_STATUS_DOT: Record<ChapterStatus, string> = {
  not_started: "bg-graphite",
  learning: "bg-info",
  in_progress: "bg-info",
  revised_once: "bg-warning",
  revised_twice: "bg-warning",
  mastered: "bg-success",
};

/** 0-100 mastery derived from status — a simple, non-stored, always-consistent formula. */
const MASTERY_BY_STATUS: Record<ChapterStatus, number> = {
  not_started: 0,
  learning: 20,
  in_progress: 40,
  revised_once: 65,
  revised_twice: 85,
  mastered: 100,
};
export function chapterMasteryPercent(status: ChapterStatus): number {
  return MASTERY_BY_STATUS[status];
}

export function chaptersCompletionPercent(chapters: Chapter[]): number {
  if (chapters.length === 0) return 0;
  return Math.round(chapters.reduce((sum, c) => sum + chapterMasteryPercent(c.status), 0) / chapters.length);
}

export function homeworkCompletionPercent(homework: Homework[]): number {
  if (homework.length === 0) return 100;
  const done = homework.filter((h) => h.status === "completed").length;
  return Math.round((done / homework.length) * 100);
}

export function revisionCompletionPercent(chapters: Chapter[]): number {
  if (chapters.length === 0) return 0;
  const revised = chapters.filter((c) => c.status === "revised_once" || c.status === "revised_twice" || c.status === "mastered").length;
  return Math.round((revised / chapters.length) * 100);
}

export interface ReadinessInputs {
  chapters: Chapter[];
  homework: Homework[];
  hoursLogged: number;
  targetHours?: number;
}

/** Subject-level readiness: chapters + revision + homework + a modest hours-studied factor, blended. */
export function computeSubjectReadiness({ chapters, homework, hoursLogged, targetHours = 20 }: ReadinessInputs): number {
  const chapterScore = chaptersCompletionPercent(chapters);
  const revisionScore = revisionCompletionPercent(chapters);
  const homeworkScore = homeworkCompletionPercent(homework);
  const hoursScore = Math.min(100, Math.round((hoursLogged / targetHours) * 100));
  return Math.round(chapterScore * 0.4 + revisionScore * 0.25 + homeworkScore * 0.15 + hoursScore * 0.2);
}

/** Exam-level readiness: same formula, scoped to only the chapters the exam covers (falls back to all chapters if none selected). */
export function computeExamReadiness(exam: Exam, chapters: Chapter[], homework: Homework[], hoursLogged: number): number {
  const covered = exam.chapters_covered.length > 0 ? chapters.filter((c) => exam.chapters_covered.includes(c.id)) : chapters;
  return computeSubjectReadiness({ chapters: covered, homework, hoursLogged });
}

export function totalHours(sessions: StudySession[]): number {
  return Math.round((sessions.reduce((sum, s) => sum + s.minutes, 0) / 60) * 10) / 10;
}

export interface HomeworkBuckets {
  overdue: Homework[];
  dueToday: Homework[];
  dueTomorrow: Homework[];
  upcoming: Homework[];
}

export function bucketHomework(homework: Homework[], now = new Date()): HomeworkBuckets {
  const today = toISODate(now);
  const tomorrow = toISODate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const pending = homework.filter((h) => h.status !== "completed");

  const overdue: Homework[] = [];
  const dueToday: Homework[] = [];
  const dueTomorrow: Homework[] = [];
  const upcoming: Homework[] = [];

  for (const h of pending) {
    if (!h.due_at) {
      upcoming.push(h);
      continue;
    }
    const due = h.due_at.slice(0, 10);
    if (due < today) overdue.push(h);
    else if (due === today) dueToday.push(h);
    else if (due === tomorrow) dueTomorrow.push(h);
    else upcoming.push(h);
  }
  return { overdue, dueToday, dueTomorrow, upcoming };
}

export function homeworkStatusLabel(status: HomeworkStatus): string {
  return { not_started: "Not started", in_progress: "In progress", completed: "Completed" }[status];
}
