import { Card } from "@/components/ui/Card";
import { PomodoroTimer } from "./PomodoroTimer";
import { StudyStreakCard } from "./StudyStreakCard";
import { StudyHeatmap } from "./StudyHeatmap";
import type { Homework, Note, PomodoroSession, StudySession, Subject } from "@/lib/types";
import { buildStudyActivityDates, computeStudyStreak } from "@/lib/study";

export function StudyDashboard({
  subjects,
  studySessions,
  pomodoroSessions,
  notes,
  homework,
}: {
  subjects: Subject[];
  studySessions: StudySession[];
  pomodoroSessions: PomodoroSession[];
  notes: Note[];
  homework: Homework[];
}) {
  const activityDates = buildStudyActivityDates({ studySessions, pomodoroSessions, notes, homework });
  const streak = computeStudyStreak(activityDates);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
      <Card className="flex items-center justify-center">
        <PomodoroTimer subjects={subjects} />
      </Card>
      <Card>
        <h3 className="text-h3 mb-3">Study streak</h3>
        <StudyStreakCard streak={streak} />
      </Card>
      <Card className="lg:col-span-1">
        <StudyHeatmap studySessions={studySessions} />
      </Card>
    </div>
  );
}
