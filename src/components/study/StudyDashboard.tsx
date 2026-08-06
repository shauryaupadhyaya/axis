import { AreaChart, Area, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BookOpen, CalendarClock, ClipboardList, Flame } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { PomodoroTimer } from "./PomodoroTimer";
import { StudyHeatmap } from "./StudyHeatmap";
import type { Chapter, Exam, Homework, Note, PomodoroSession, StudySession, Subject } from "@/lib/types";
import { toISODate, daysUntil } from "@/lib/scores";
import { buildStudyActivityDates, bucketHomework, chaptersCompletionPercent, computeStudyStreak } from "@/lib/study";
import { computeStudyScoreBreakdown, computeWeeklyTrend, computeMonthlyTrend } from "@/lib/study-dashboard";

function scoreColor(score: number): string {
  if (score >= 75) return "var(--success)";
  if (score >= 45) return "var(--warning)";
  return "var(--danger)";
}

export function StudyDashboard({
  subjects,
  chapters,
  exams,
  studySessions,
  pomodoroSessions,
  notes,
  homework,
  defaultSubjectId,
}: {
  subjects: Subject[];
  chapters: Chapter[];
  exams: Exam[];
  studySessions: StudySession[];
  pomodoroSessions: PomodoroSession[];
  notes: Note[];
  homework: Homework[];
  defaultSubjectId?: string;
}) {
  const breakdown = computeStudyScoreBreakdown({ subjects, chapters, homework, studySessions, pomodoroSessions, notes });
  const weeklyTrend = computeWeeklyTrend(studySessions);
  const monthlyTrend = computeMonthlyTrend(studySessions);

  const activityDates = buildStudyActivityDates({ studySessions, pomodoroSessions, notes, homework });
  const streak = computeStudyStreak(activityDates);

  const today = toISODate(new Date());
  const todaysMinutes = studySessions.filter((s) => s.logged_at.slice(0, 10) === today).reduce((sum, s) => sum + s.minutes, 0);

  const avgMastery = chaptersCompletionPercent(chapters);
  const buckets = bucketHomework(homework);
  const homeworkPending = homework.filter((h) => h.status !== "completed").length;

  const upcomingExams = exams.filter((e) => new Date(e.exam_date) >= new Date()).sort((a, b) => a.exam_date.localeCompare(b.exam_date));
  const nextExam = upcomingExams[0];

  return (
    <div className="flex flex-col gap-5 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="flex flex-col items-center justify-center text-center">
          <ProgressRing percent={breakdown.overall} size={160} label={`${breakdown.overall}`} />
          <p className="text-caption text-graphite mt-2 uppercase tracking-wide">Study Score</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-4 text-left">
            {[
              { label: "Mastery", value: breakdown.masteryScore },
              { label: "Homework", value: breakdown.homeworkScore },
              { label: "Revision", value: breakdown.revisionScore },
              { label: "Consistency", value: breakdown.consistencyScore },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-3 text-caption">
                <span className="text-graphite">{s.label}</span>
                <span className="text-mono" style={{ color: scoreColor(s.value) }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="text-h3 mb-3">Weekly trend</h3>
          <div className="h-[130px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--tuscan-sun)", fontSize: 12 }} />
                <Area type="monotone" dataKey="score" stroke="var(--tuscan-sun)" fill="var(--tuscan-sun)" fillOpacity={0.25} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <h3 className="text-h3 mb-3 mt-4">Monthly trend</h3>
          <div className="h-[130px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--tuscan-sun)", fontSize: 12 }} />
                <Line type="monotone" dataKey="score" stroke="var(--info)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} className="text-tuscan" />
            <h4 className="text-h3">Subjects</h4>
          </div>
          <p className="text-small text-graphite mb-1">Avg mastery</p>
          <p className="text-body font-medium mb-3">{avgMastery}%</p>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-mono text-h3">{subjects.length}</p>
              <p className="text-[10px] text-graphite">Subjects</p>
            </div>
            <div>
              <p className="text-mono text-h3">{chapters.length}</p>
              <p className="text-[10px] text-graphite">Chapters</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList size={16} className="text-info" />
            <h4 className="text-h3">Homework</h4>
          </div>
          <p className="text-small text-graphite mb-1">Pending</p>
          <p className="text-body font-medium mb-3">{homeworkPending}</p>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-mono text-h3" style={{ color: buckets.overdue.length > 0 ? "var(--danger)" : undefined }}>
                {buckets.overdue.length}
              </p>
              <p className="text-[10px] text-graphite">Overdue</p>
            </div>
            <div>
              <p className="text-mono text-h3">{buckets.dueToday.length}</p>
              <p className="text-[10px] text-graphite">Due today</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-2">
            <CalendarClock size={16} className="text-tuscan" />
            <h4 className="text-h3">Exams</h4>
          </div>
          <p className="text-small text-graphite mb-1">Next up</p>
          <p className="text-body font-medium mb-3 truncate">{nextExam ? nextExam.name : "None scheduled"}</p>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-mono text-h3">{nextExam ? daysUntil(nextExam.exam_date) : "—"}</p>
              <p className="text-[10px] text-graphite">Days away</p>
            </div>
            <div>
              <p className="text-mono text-h3">{upcomingExams.length}</p>
              <p className="text-[10px] text-graphite">Upcoming</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} className="text-tuscan" />
            <h4 className="text-h3">Focus</h4>
          </div>
          <p className="text-small text-graphite mb-1">Today</p>
          <p className="text-body font-medium mb-3">{todaysMinutes}m</p>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-mono text-h3">{streak.current}d</p>
              <p className="text-[10px] text-graphite">Streak</p>
            </div>
            <div>
              <p className="text-mono text-h3">{streak.longest}d</p>
              <p className="text-[10px] text-graphite">Longest</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="flex items-center justify-center">
          <PomodoroTimer subjects={subjects} defaultSubjectId={defaultSubjectId} />
        </Card>
        <Card className="lg:col-span-2">
          <StudyHeatmap studySessions={studySessions} />
        </Card>
      </div>
    </div>
  );
}
