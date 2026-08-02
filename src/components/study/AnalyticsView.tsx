"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StudyHeatmap } from "./StudyHeatmap";
import { StudyStreakCard } from "./StudyStreakCard";
import type { Chapter, Exam, Homework, Note, PomodoroSession, StudySession, Subject } from "@/lib/types";
import { daysUntil } from "@/lib/scores";
import {
  averageSessionMinutes,
  buildStudyActivityDates,
  chaptersCompletionPercent,
  computeExamReadiness,
  computeStudyStreak,
  computeSubjectReadiness,
  homeworkCompletionPercent,
  hoursInWindow,
  revisionCompletionPercent,
  totalHours,
} from "@/lib/study";

interface AnalyticsViewProps {
  subjects: Subject[];
  chapters: Chapter[];
  homework: Homework[];
  exams: Exam[];
  studySessions: StudySession[];
  pomodoroSessions: PomodoroSession[];
  notes: Note[];
}

export function AnalyticsView({ subjects, chapters, homework, exams, studySessions, pomodoroSessions, notes }: AnalyticsViewProps) {
  const completedPomodoros = pomodoroSessions.filter((p) => p.completed);
  const activityDates = buildStudyActivityDates({ studySessions, pomodoroSessions, notes, homework });
  const streak = computeStudyStreak(activityDates);

  const subjectData = subjects.map((s) => {
    const subjectChapters = chapters.filter((c) => c.subject_id === s.id);
    const subjectHomework = homework.filter((h) => h.subject_id === s.id);
    const subjectSessions = studySessions.filter((sess) => sess.subject_id === s.id);
    const hours = totalHours(subjectSessions);
    return {
      subject: s,
      hours,
      chapterCompletion: chaptersCompletionPercent(subjectChapters),
      homeworkCompletion: homeworkCompletionPercent(subjectHomework),
      revisionCompletion: revisionCompletionPercent(subjectChapters),
      readiness: computeSubjectReadiness({ chapters: subjectChapters, homework: subjectHomework, hoursLogged: hours }),
    };
  });

  const chartData = subjectData.map((d) => ({ name: d.subject.name, hours: d.hours }));

  const upcomingExams = exams
    .filter((e) => new Date(e.exam_date) >= new Date())
    .sort((a, b) => a.exam_date.localeCompare(b.exam_date));

  const overallChapterCompletion = chaptersCompletionPercent(chapters);
  const overallHomeworkCompletion = homeworkCompletionPercent(homework);
  const overallRevisionCompletion = revisionCompletionPercent(chapters);

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/study" aria-label="Back to Study" className="w-8 h-8 rounded-md hover:bg-bg flex items-center justify-center transition-fast">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-h1">Analytics</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <p className="text-display">{totalHours(studySessions)}h</p>
          <p className="text-caption text-graphite">Total hours</p>
        </Card>
        <Card>
          <p className="text-display">{hoursInWindow(studySessions, 7)}h</p>
          <p className="text-caption text-graphite">This week</p>
        </Card>
        <Card>
          <p className="text-display">{hoursInWindow(studySessions, 30)}h</p>
          <p className="text-caption text-graphite">This month</p>
        </Card>
        <Card>
          <p className="text-display">{hoursInWindow(studySessions, 365)}h</p>
          <p className="text-caption text-graphite">This year</p>
        </Card>
        <Card>
          <p className="text-display">{completedPomodoros.length}</p>
          <p className="text-caption text-graphite">Pomodoros</p>
        </Card>
        <Card>
          <p className="text-display">{averageSessionMinutes(studySessions)}m</p>
          <p className="text-caption text-graphite">Avg session</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <Card>
          <h3 className="text-h3 mb-3">Study streak</h3>
          <StudyStreakCard streak={streak} />
        </Card>
        <Card className="lg:col-span-2">
          <StudyHeatmap studySessions={studySessions} />
        </Card>
      </div>

      {subjects.length > 0 && (
        <Card className="mb-6">
          <h3 className="text-h3 mb-3">Subject comparison — hours logged</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--alabaster-grey)" opacity={0.3} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--graphite)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--graphite)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "var(--bg)" }}
                  contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--tuscan-sun)", color: "var(--text)", fontSize: 12 }}
                  formatter={(value) => [`${value}h`, "Hours"]}
                />
                <Bar dataKey="hours" fill="var(--tuscan-sun)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center justify-between mb-1">
            <span className="text-caption text-graphite">Chapter completion</span>
            <span className="text-mono text-caption">{overallChapterCompletion}%</span>
          </div>
          <ProgressBar percent={overallChapterCompletion} />
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-1">
            <span className="text-caption text-graphite">Homework completion</span>
            <span className="text-mono text-caption">{overallHomeworkCompletion}%</span>
          </div>
          <ProgressBar percent={overallHomeworkCompletion} />
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-1">
            <span className="text-caption text-graphite">Revision completion</span>
            <span className="text-mono text-caption">{overallRevisionCompletion}%</span>
          </div>
          <ProgressBar percent={overallRevisionCompletion} />
        </Card>
      </div>

      {subjects.length > 0 && (
        <Card className="mb-6">
          <h3 className="text-h3 mb-3">Subject readiness</h3>
          <div className="flex flex-col gap-3">
            {subjectData.map((d) => (
              <div key={d.subject.id}>
                <div className="flex items-center justify-between mb-1">
                  <Link href={`/study/${d.subject.id}`} className="text-small font-semibold hover:text-tuscan transition-fast">
                    {d.subject.name}
                  </Link>
                  <span className="text-mono text-caption">{d.readiness}%</span>
                </div>
                <ProgressBar percent={d.readiness} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {upcomingExams.length > 0 && (
        <Card>
          <h3 className="text-h3 mb-3">Exam readiness</h3>
          <div className="flex flex-col gap-3">
            {upcomingExams.map((exam) => {
              const subject = subjects.find((s) => s.id === exam.subject_id);
              const subjectHomework = homework.filter((h) => h.subject_id === exam.subject_id);
              const subjectHours = totalHours(studySessions.filter((s) => s.subject_id === exam.subject_id));
              const readiness = computeExamReadiness(exam, chapters, subjectHomework, subjectHours);
              const days = daysUntil(exam.exam_date);
              return (
                <div key={exam.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-small font-semibold">
                      {exam.name} {subject && <span className="text-graphite font-normal">· {subject.name}</span>}
                    </span>
                    <span className="text-caption text-graphite">
                      {days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days}d`} · {readiness}%
                    </span>
                  </div>
                  <ProgressBar percent={readiness} />
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
