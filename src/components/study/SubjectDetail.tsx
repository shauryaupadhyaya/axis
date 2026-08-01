"use client";

import { useState } from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Chapter, Exam, Homework, StudySession, Subject } from "@/lib/types";
import { daysUntil } from "@/lib/scores";
import { chaptersCompletionPercent, computeSubjectReadiness, totalHours } from "@/lib/study";
import { SyllabusTab } from "./SyllabusTab";
import { RevisionTab } from "./RevisionTab";
import { HoursTab } from "./HoursTab";
import { HomeworkTab } from "./HomeworkTab";
import { ExamsTab } from "./ExamsTab";

type Tab = "syllabus" | "notes" | "revision" | "hours" | "homework" | "exams";

const TAB_LABEL: Record<Tab, string> = {
  syllabus: "Chapters",
  homework: "Homework",
  notes: "Notes",
  revision: "Revision",
  exams: "Exams",
  hours: "Analytics",
};

interface SubjectDetailProps {
  subject: Subject;
  exams: Exam[];
  chapters: Chapter[];
  studySessions: StudySession[];
  homework: Homework[];
}

export function SubjectDetail({ subject, exams, chapters, studySessions, homework }: SubjectDetailProps) {
  const [tab, setTab] = useState<Tab>("syllabus");
  const hoursLogged = totalHours(studySessions);
  const readiness = computeSubjectReadiness({ chapters, homework, hoursLogged });
  const mastery = chaptersCompletionPercent(chapters);
  const nextExam = exams
    .filter((e) => new Date(e.exam_date) >= new Date())
    .sort((a, b) => a.exam_date.localeCompare(b.exam_date))[0];
  const days = nextExam ? daysUntil(nextExam.exam_date) : null;

  const notesCountByChapter: Record<string, number> = {};
  const homeworkCountByChapter: Record<string, number> = {};
  for (const h of homework) {
    if (!h.chapter_id) continue;
    homeworkCountByChapter[h.chapter_id] = (homeworkCountByChapter[h.chapter_id] ?? 0) + 1;
  }

  return (
    <div className="p-6">
      <h1 className="text-h1 mb-1">{subject.name}</h1>
      <p className="text-small text-graphite mb-5">
        {nextExam
          ? `${nextExam.name} ${days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`}`
          : "No upcoming exam scheduled"}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <p className="text-display">{readiness}%</p>
          <p className="text-caption text-graphite">Readiness</p>
          <ProgressBar percent={readiness} className="mt-1" />
        </div>
        <div>
          <p className="text-display">{chapters.length}</p>
          <p className="text-caption text-graphite">Chapters</p>
        </div>
        <div>
          <p className="text-display">{hoursLogged}h</p>
          <p className="text-caption text-graphite">Hours logged</p>
        </div>
        <div>
          <p className="text-display">{mastery}%</p>
          <p className="text-caption text-graphite">Mastered</p>
        </div>
      </div>

      <div className="flex gap-1 border border-alabaster rounded-lg p-1 w-fit mb-5 flex-wrap">
        {(["syllabus", "homework", "notes", "revision", "exams", "hours"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-small transition-fast ${
              tab === t ? "bg-carbon text-white dark:bg-tuscan dark:text-carbon" : "hover:bg-bg"
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {tab === "syllabus" && (
        <SyllabusTab
          subjectId={subject.id}
          chapters={chapters}
          notesCountByChapter={notesCountByChapter}
          homeworkCountByChapter={homeworkCountByChapter}
        />
      )}
      {tab === "homework" && <HomeworkTab subjectId={subject.id} homework={homework} chapters={chapters} />}
      {tab === "notes" && (
        <p className="text-small text-graphite py-8 text-center">
          Study notes for this subject live in <span className="font-semibold">Notes → Study Notes</span>, linked per chapter.
        </p>
      )}
      {tab === "revision" && <RevisionTab subjectId={subject.id} chapters={chapters} />}
      {tab === "exams" && <ExamsTab subjectId={subject.id} exams={exams} chapters={chapters} homework={homework} studySessions={studySessions} />}
      {tab === "hours" && <HoursTab studySessions={studySessions} />}
    </div>
  );
}
