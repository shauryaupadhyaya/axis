import type { Chapter, ChapterStatus, Exam, Homework, HomeworkStatus, Note, PomodoroSession, StudySession } from "@/lib/types";
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

/** Hours logged within the trailing `days` window (7 for week, 30 for month, 365 for year). */
export function hoursInWindow(sessions: StudySession[], days: number, now = new Date()): number {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  const inWindow = sessions.filter((s) => new Date(s.logged_at) >= cutoff);
  return totalHours(inWindow);
}

export function averageSessionMinutes(sessions: StudySession[]): number {
  if (sessions.length === 0) return 0;
  return Math.round(sessions.reduce((sum, s) => sum + s.minutes, 0) / sessions.length);
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

// ============ Study streak + heatmap ============

export interface StudyActivityInputs {
  studySessions: StudySession[];
  pomodoroSessions: PomodoroSession[];
  notes: Note[];
  homework: Homework[];
}

/** A day "counts" when a Pomodoro completed, a study session was logged, a note was updated, or homework was completed. */
export function buildStudyActivityDates({ studySessions, pomodoroSessions, notes, homework }: StudyActivityInputs): Set<string> {
  const dates = new Set<string>();
  for (const s of studySessions) dates.add(s.logged_at.slice(0, 10));
  for (const p of pomodoroSessions) {
    if (p.completed && p.ended_at) dates.add(p.ended_at.slice(0, 10));
  }
  for (const n of notes) dates.add(n.updated_at.slice(0, 10));
  for (const h of homework) {
    if (h.completed_at) dates.add(h.completed_at.slice(0, 10));
  }
  return dates;
}

export interface StudyStreak {
  current: number;
  longest: number;
  /** 0-100: fraction of days-so-far in the current calendar month with activity. */
  monthProgress: number;
}

export function computeStudyStreak(activityDates: Set<string>, now = new Date()): StudyStreak {
  // Current streak: consecutive days ending today or yesterday (today can still be "in progress").
  let current = 0;
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  if (!activityDates.has(toISODate(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (activityDates.has(toISODate(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Longest streak ever, from the full set of active dates.
  const sorted = [...activityDates].sort();
  let longest = 0;
  let run = 0;
  let prevTime: number | null = null;
  for (const d of sorted) {
    const t = new Date(d).getTime();
    if (prevTime !== null && Math.round((t - prevTime) / 86400000) === 1) run += 1;
    else run = 1;
    longest = Math.max(longest, run);
    prevTime = t;
  }

  const dayOfMonth = now.getDate();
  let activeDaysThisMonth = 0;
  for (let d = 1; d <= dayOfMonth; d++) {
    const date = new Date(now.getFullYear(), now.getMonth(), d);
    if (activityDates.has(toISODate(date))) activeDaysThisMonth += 1;
  }
  const monthProgress = Math.round((activeDaysThisMonth / dayOfMonth) * 100);

  return { current, longest, monthProgress };
}

export interface HeatmapCell {
  date: string;
  minutes: number;
  sessions: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

function intensityFor(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0;
  if (minutes < 20) return 1;
  if (minutes < 45) return 2;
  if (minutes < 90) return 3;
  return 4;
}

/** GitHub-style heatmap cells for the trailing `days` window (7 for week, ~30 for month, ~365 for year). */
export function buildStudyHeatmap(studySessions: StudySession[], days: number, now = new Date()): HeatmapCell[] {
  const byDay = new Map<string, { minutes: number; sessions: number }>();
  for (const s of studySessions) {
    const day = s.logged_at.slice(0, 10);
    const existing = byDay.get(day) ?? { minutes: 0, sessions: 0 };
    existing.minutes += s.minutes;
    existing.sessions += 1;
    byDay.set(day, existing);
  }

  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    const date = toISODate(d);
    const entry = byDay.get(date) ?? { minutes: 0, sessions: 0 };
    return { date, minutes: entry.minutes, sessions: entry.sessions, intensity: intensityFor(entry.minutes) };
  });
}
