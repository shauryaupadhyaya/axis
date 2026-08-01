"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SubjectCreateModal } from "./SubjectCreateModal";
import { StudyDashboard } from "./StudyDashboard";
import type { Chapter, Exam, Homework, Note, PomodoroSession, StudySession, Subject } from "@/lib/types";
import { daysUntil } from "@/lib/scores";
import { chaptersCompletionPercent, computeSubjectReadiness } from "@/lib/study";

export function SubjectsList({
  subjects,
  exams,
  chapters,
  homework,
  studySessions = [],
  pomodoroSessions = [],
  notes = [],
}: {
  subjects: Subject[];
  exams: Exam[];
  chapters: Chapter[];
  homework: Homework[];
  studySessions?: StudySession[];
  pomodoroSessions?: PomodoroSession[];
  notes?: Note[];
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-h1">Study</h1>
        <Button onClick={() => setCreating(true)} className="flex items-center gap-1.5">
          <Plus size={16} /> Add subject
        </Button>
      </div>

      <StudyDashboard
        subjects={subjects}
        studySessions={studySessions}
        pomodoroSessions={pomodoroSessions}
        notes={notes}
        homework={homework}
      />

      {subjects.length === 0 ? (
        <p className="text-small text-graphite py-8 text-center">No subjects yet — add one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => {
            const subjectChapters = chapters.filter((c) => c.subject_id === subject.id);
            const subjectHomework = homework.filter((h) => h.subject_id === subject.id);
            const readiness = computeSubjectReadiness({ chapters: subjectChapters, homework: subjectHomework, hoursLogged: 0 });
            const mastery = chaptersCompletionPercent(subjectChapters);
            const upcomingExam = exams
              .filter((e) => e.subject_id === subject.id && new Date(e.exam_date) >= new Date())
              .sort((a, b) => a.exam_date.localeCompare(b.exam_date))[0];

            return (
              <Card key={subject.id} onClick={() => router.push(`/study/${subject.id}`)} className="cursor-pointer">
                <h2 className="text-h2 mb-2">{subject.name}</h2>
                <p className="text-display">{readiness}%</p>
                <p className="text-caption text-graphite mb-2">readiness · {mastery}% mastered</p>
                <p className="text-small text-graphite">
                  {subjectChapters.length} chapter{subjectChapters.length === 1 ? "" : "s"}
                  {upcomingExam && ` · ${upcomingExam.name} in ${daysUntil(upcomingExam.exam_date)}d`}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      <SubjectCreateModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
