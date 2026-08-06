"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, CalendarClock, ClipboardList, Clock, FileText, Plus, Sparkles, Target, Timer, Trophy, Upload } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import type { Chapter, Exam, Flashcard, Homework, Note, StudyAttachment, StudySession, Subject } from "@/lib/types";
import { daysUntil } from "@/lib/scores";
import { chaptersCompletionPercent, computeSubjectReadiness, totalHours } from "@/lib/study";
import { createGeneratedNote } from "@/app/(app)/study/actions";
import { SyllabusTab } from "./SyllabusTab";
import { RevisionTab } from "./RevisionTab";
import { HoursTab } from "./HoursTab";
import { HomeworkTab } from "./HomeworkTab";
import { ExamsTab } from "./ExamsTab";
import { FlashcardsTab } from "./FlashcardsTab";

type Tab = "syllabus" | "notes" | "flashcards" | "revision" | "hours" | "homework" | "exams";

const TAB_LABEL: Record<Tab, string> = {
  syllabus: "Chapters",
  homework: "Homework",
  notes: "Notes",
  flashcards: "Flashcards",
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
  flashcards: Flashcard[];
  notes: Note[];
  attachments: StudyAttachment[];
}

export function SubjectDetail({ subject, exams, chapters, studySessions, homework, flashcards, notes, attachments }: SubjectDetailProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>("syllabus");
  const [creatingNoteFor, setCreatingNoteFor] = useState<string | null>(null);

  function handleCreateNote(chapterId: string) {
    setCreatingNoteFor(chapterId);
    startTransition(async () => {
      try {
        const id = await createGeneratedNote(chapterId, "Untitled", "");
        router.push(`/notes/${id}`);
      } finally {
        setCreatingNoteFor(null);
      }
    });
  }
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-tuscan" />
            <h4 className="text-h3">Readiness</h4>
          </div>
          <p className="text-display">{readiness}%</p>
          <ProgressBar percent={readiness} className="mt-2" />
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} className="text-info" />
            <h4 className="text-h3">Chapters</h4>
          </div>
          <p className="text-display">{chapters.length}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-tuscan" />
            <h4 className="text-h3">Hours logged</h4>
          </div>
          <p className="text-display">{hoursLogged}h</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={16} className="text-success" />
            <h4 className="text-h3">Mastered</h4>
          </div>
          <p className="text-display">{mastery}%</p>
        </Card>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <Link href={`/study?subject=${subject.id}`}>
          <Button variant="secondary" className="flex items-center gap-1.5 !px-3 !py-1.5 text-caption">
            <Timer size={13} /> Start study session
          </Button>
        </Link>
        <Button variant="secondary" onClick={() => setTab("syllabus")} className="flex items-center gap-1.5 !px-3 !py-1.5 text-caption">
          <BookOpen size={13} /> Add chapter
        </Button>
        <Button variant="secondary" onClick={() => setTab("syllabus")} className="flex items-center gap-1.5 !px-3 !py-1.5 text-caption">
          <Upload size={13} /> Upload PDF
        </Button>
        <Button variant="secondary" onClick={() => setTab("syllabus")} className="flex items-center gap-1.5 !px-3 !py-1.5 text-caption">
          <Sparkles size={13} /> Generate notes
        </Button>
        <Button variant="secondary" onClick={() => setTab("notes")} className="flex items-center gap-1.5 !px-3 !py-1.5 text-caption">
          <FileText size={13} /> Add note
        </Button>
        <Button variant="secondary" onClick={() => setTab("homework")} className="flex items-center gap-1.5 !px-3 !py-1.5 text-caption">
          <ClipboardList size={13} /> Add homework
        </Button>
        <Button variant="secondary" onClick={() => setTab("exams")} className="flex items-center gap-1.5 !px-3 !py-1.5 text-caption">
          <CalendarClock size={13} /> Add exam
        </Button>
      </div>

      <div className="flex gap-1 border border-alabaster rounded-lg p-1 w-fit mb-5 flex-wrap">
        {(["syllabus", "homework", "notes", "flashcards", "revision", "exams", "hours"] as Tab[]).map((t) => (
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
          subjectName={subject.name}
          chapters={chapters}
          notesCountByChapter={notesCountByChapter}
          homeworkCountByChapter={homeworkCountByChapter}
          attachments={attachments}
        />
      )}
      {tab === "homework" && <HomeworkTab subjectId={subject.id} homework={homework} chapters={chapters} />}
      {tab === "notes" && (
        <div className="flex flex-col gap-4">
          {chapters.length === 0 ? (
            <p className="text-small text-graphite py-8 text-center">Add chapters in Chapters first, then generate or write notes per chapter.</p>
          ) : (
            chapters.map((chapter) => {
              const chapterNotes = notes.filter((n) => n.chapter_id === chapter.id);
              return (
                <div key={chapter.id}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-label text-graphite">{chapter.name}</p>
                    <Button
                      variant="secondary"
                      onClick={() => handleCreateNote(chapter.id)}
                      disabled={creatingNoteFor === chapter.id}
                      className="flex items-center gap-1.5 !px-2.5 !py-1 text-caption"
                    >
                      <Plus size={12} /> {creatingNoteFor === chapter.id ? "Creating…" : "New note"}
                    </Button>
                  </div>
                  {chapterNotes.length === 0 ? (
                    <p className="text-caption text-graphite mb-2">No notes yet for this chapter.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {chapterNotes.map((note) => (
                        <Link
                          key={note.id}
                          href={`/notes/${note.id}`}
                          className="block rounded-lg border border-alabaster px-3 py-2.5 hover:border-tuscan transition-fast"
                        >
                          <p className="text-small font-semibold truncate">{note.title || "Untitled"}</p>
                          <p className="text-caption text-graphite">
                            {new Date(note.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
      {tab === "flashcards" && (
        <FlashcardsTab subjectId={subject.id} subjectName={subject.name} chapters={chapters} flashcards={flashcards} attachments={attachments} />
      )}
      {tab === "revision" && <RevisionTab subjectId={subject.id} chapters={chapters} />}
      {tab === "exams" && <ExamsTab subjectId={subject.id} exams={exams} chapters={chapters} homework={homework} studySessions={studySessions} />}
      {tab === "hours" && <HoursTab studySessions={studySessions} />}
    </div>
  );
}
