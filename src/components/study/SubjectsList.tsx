"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart3, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SubjectCreateModal } from "./SubjectCreateModal";
import { StudyDashboard } from "./StudyDashboard";
import type { Chapter, Exam, Homework, Note, PomodoroSession, StudySession, Subject } from "@/lib/types";
import { daysUntil } from "@/lib/scores";
import { chaptersCompletionPercent, computeSubjectReadiness } from "@/lib/study";

type Tab = "dashboard" | "subjects";

const TAB_LABELS: Record<Tab, string> = {
  dashboard: "Dashboard",
  subjects: "Subjects",
};

export function SubjectsList({
  subjects,
  exams,
  chapters,
  homework,
  studySessions = [],
  pomodoroSessions = [],
  notes = [],
  preselectedSubjectId,
}: {
  subjects: Subject[];
  exams: Exam[];
  chapters: Chapter[];
  homework: Homework[];
  studySessions?: StudySession[];
  pomodoroSessions?: PomodoroSession[];
  notes?: Note[];
  preselectedSubjectId?: string;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-h1">Study</h1>
        <div className="flex gap-1 border border-alabaster rounded-lg p-1">
          {(["dashboard", "subjects"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-small transition-fast ${
                tab === t ? "bg-carbon text-white dark:bg-tuscan dark:text-carbon" : "hover:bg-bg"
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {tab === "dashboard" && (
        <>
          <div className="flex justify-end mb-3">
            <Link href="/study/analytics">
              <Button variant="secondary" className="flex items-center gap-1.5 !px-3 !py-1.5 text-caption">
                <BarChart3 size={14} /> Full analytics
              </Button>
            </Link>
          </div>
          <StudyDashboard
            subjects={subjects}
            chapters={chapters}
            exams={exams}
            studySessions={studySessions}
            pomodoroSessions={pomodoroSessions}
            notes={notes}
            homework={homework}
            defaultSubjectId={preselectedSubjectId}
          />
        </>
      )}

      {tab === "subjects" && (
        <>
          <div className="flex justify-end mb-4">
            <Button onClick={() => setCreating(true)} className="flex items-center gap-1.5">
              <Plus size={16} /> Add subject
            </Button>
          </div>

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
        </>
      )}

      <SubjectCreateModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
