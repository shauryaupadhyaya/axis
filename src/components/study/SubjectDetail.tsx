"use client";

import { useState } from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Chapter, Exam, Homework, StudySession } from "@/lib/types";
import { daysUntil } from "@/lib/scores";
import { SyllabusTab } from "./SyllabusTab";
import { RevisionTab } from "./RevisionTab";
import { HoursTab } from "./HoursTab";
import { HomeworkTab } from "./HomeworkTab";

type Tab = "syllabus" | "notes" | "revision" | "hours" | "homework";

interface SubjectDetailProps {
  exam: Exam;
  chapters: Chapter[];
  studySessions: StudySession[];
  homework: Homework[];
}

export function SubjectDetail({ exam, chapters, studySessions, homework }: SubjectDetailProps) {
  const [tab, setTab] = useState<Tab>("syllabus");
  const readiness = exam.chapters_total > 0 ? Math.round((exam.chapters_mastered / exam.chapters_total) * 100) : 0;
  const days = daysUntil(exam.exam_date);
  const hoursLogged = Math.round((studySessions.reduce((sum, s) => sum + s.minutes, 0) / 60) * 10) / 10;

  return (
    <div className="p-6">
      <h1 className="text-h1 mb-1">{exam.subject_name}</h1>
      <p className="text-small text-graphite mb-5">
        {days >= 0 ? `Exam in ${days} day${days === 1 ? "" : "s"}` : "Exam date passed"}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <p className="text-display">{readiness}%</p>
          <p className="text-caption text-graphite">Readiness</p>
          <ProgressBar percent={readiness} className="mt-1" />
        </div>
        <div>
          <p className="text-display">{days}</p>
          <p className="text-caption text-graphite">Days to exam</p>
        </div>
        <div>
          <p className="text-display">{hoursLogged}h</p>
          <p className="text-caption text-graphite">Hours logged</p>
        </div>
        <div>
          <p className="text-display">
            {exam.chapters_mastered}/{exam.chapters_total}
          </p>
          <p className="text-caption text-graphite">Mastered</p>
        </div>
      </div>

      <div className="flex gap-1 border border-alabaster rounded-lg p-1 w-fit mb-5">
        {(["syllabus", "homework", "notes", "revision", "hours"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-small capitalize transition-fast ${
              tab === t ? "bg-carbon text-white dark:bg-tuscan dark:text-carbon" : "hover:bg-bg"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "syllabus" && <SyllabusTab subjectId={exam.id} chapters={chapters} />}
      {tab === "homework" && <HomeworkTab subjectId={exam.id} homework={homework} />}
      {tab === "notes" && (
        <p className="text-small text-graphite py-8 text-center">Notes aren&apos;t available yet.</p>
      )}
      {tab === "revision" && <RevisionTab subjectId={exam.id} chapters={chapters} />}
      {tab === "hours" && <HoursTab studySessions={studySessions} />}
    </div>
  );
}
