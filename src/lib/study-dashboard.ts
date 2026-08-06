import type { Chapter, Homework, Note, PomodoroSession, Subject, StudySession } from "@/lib/types";
import { toISODate } from "@/lib/scores";
import {
  buildStudyActivityDates,
  chaptersCompletionPercent,
  computeStudyStreak,
  homeworkCompletionPercent,
  revisionCompletionPercent,
} from "@/lib/study";

/** A day is "on target" once this many minutes of study are logged against it. */
const DAILY_STUDY_TARGET_MINUTES = 60;

function minutesForDay(sessions: StudySession[], day: string): number {
  return sessions.filter((s) => s.logged_at.slice(0, 10) === day).reduce((sum, s) => sum + s.minutes, 0);
}

export interface StudyScoreInputs {
  subjects: Subject[];
  chapters: Chapter[];
  homework: Homework[];
  studySessions: StudySession[];
  pomodoroSessions: PomodoroSession[];
  notes: Note[];
}

export interface StudyScoreBreakdown {
  overall: number;
  masteryScore: number;
  homeworkScore: number;
  revisionScore: number;
  consistencyScore: number;
}

/** Blends chapter mastery, homework completion, revision progress, and this-month consistency into one 0-100 Study Score. */
export function computeStudyScoreBreakdown(inputs: StudyScoreInputs, now = new Date()): StudyScoreBreakdown {
  const masteryScore = chaptersCompletionPercent(inputs.chapters);
  const homeworkScore = homeworkCompletionPercent(inputs.homework);
  const revisionScore = revisionCompletionPercent(inputs.chapters);

  const activityDates = buildStudyActivityDates({
    studySessions: inputs.studySessions,
    pomodoroSessions: inputs.pomodoroSessions,
    notes: inputs.notes,
    homework: inputs.homework,
  });
  const consistencyScore = computeStudyStreak(activityDates, now).monthProgress;

  const overall = Math.round(masteryScore * 0.35 + homeworkScore * 0.2 + revisionScore * 0.2 + consistencyScore * 0.25);

  return { overall, masteryScore, homeworkScore, revisionScore, consistencyScore };
}

export interface TrendPoint {
  label: string;
  score: number;
}

/** Daily study-time trend (% of DAILY_STUDY_TARGET_MINUTES) for the trailing 7 days. */
export function computeWeeklyTrend(sessions: StudySession[], now = new Date()): TrendPoint[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const day = toISODate(d);
    const minutes = minutesForDay(sessions, day);
    return { label: d.toLocaleDateString("en-US", { weekday: "short" }), score: Math.min(100, Math.round((minutes / DAILY_STUDY_TARGET_MINUTES) * 100)) };
  });
}

/** Weekly-average study-time trend (% of daily target) across the trailing 8 weeks. */
export function computeMonthlyTrend(sessions: StudySession[], now = new Date()): TrendPoint[] {
  const weeks = 8;
  return Array.from({ length: weeks }, (_, i) => {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - (weeks - 1 - i) * 7);
    const days = Array.from({ length: 7 }, (_, j) => {
      const d = new Date(weekEnd);
      d.setDate(d.getDate() - j);
      return toISODate(d);
    });
    const avgMinutes = days.reduce((sum, day) => sum + minutesForDay(sessions, day), 0) / days.length;
    return { label: `${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`, score: Math.min(100, Math.round((avgMinutes / DAILY_STUDY_TARGET_MINUTES) * 100)) };
  });
}
