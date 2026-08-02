"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Chapter, Note, Subject } from "@/lib/types";

export function StudyNotesBridge({
  notes,
  subjects,
  chapters,
}: {
  notes: Note[];
  subjects: Subject[];
  chapters: Chapter[];
}) {
  const chapterById = new Map(chapters.map((c) => [c.id, c]));
  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const recentNotes = [...notes].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 8);

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-h3 mb-1 flex items-center gap-2">
            <BookOpen size={18} /> Study Notes live in the Study Hub
          </h2>
          <p className="text-small text-graphite">
            Notes linked to a subject and chapter are created and organized from within Study — open a chapter&apos;s
            AI tools to generate or write notes there.
          </p>
        </div>
        <Link href="/study">
          <Button className="flex items-center gap-1.5 shrink-0">
            Open Study Hub <ArrowRight size={14} />
          </Button>
        </Link>
      </Card>

      <div>
        <p className="text-label text-graphite mb-2">Recent study notes</p>
        {recentNotes.length === 0 ? (
          <p className="text-small text-graphite py-6 text-center">
            No study notes yet — generate or write one from a chapter in the Study Hub.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentNotes.map((note) => {
              const chapter = note.chapter_id ? chapterById.get(note.chapter_id) : undefined;
              const subject = chapter ? subjectById.get(chapter.subject_id) : undefined;
              return (
                <Link key={note.id} href={`/notes/${note.id}`}>
                  <Card className="cursor-pointer h-full">
                    <div className="flex items-start gap-2 mb-1">
                      <FileText size={14} className="text-graphite mt-0.5 shrink-0" />
                      <h3 className="text-body font-semibold truncate">{note.title || "Untitled"}</h3>
                    </div>
                    <p className="text-caption text-graphite">
                      {subject?.name ?? "Study"}
                      {chapter && ` · ${chapter.name}`}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {subjects.length > 0 && (
        <div>
          <p className="text-label text-graphite mb-2">Subjects</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {subjects.map((subject) => {
              const subjectChapters = chapters.filter((c) => c.subject_id === subject.id);
              const noteCount = notes.filter((n) => n.chapter_id && chapterById.get(n.chapter_id)?.subject_id === subject.id).length;
              return (
                <Link key={subject.id} href={`/study/${subject.id}`}>
                  <Card className="cursor-pointer h-full">
                    <h3 className="text-body font-semibold mb-1">{subject.name}</h3>
                    <p className="text-caption text-graphite">
                      {subjectChapters.length} chapter{subjectChapters.length === 1 ? "" : "s"} · {noteCount} note
                      {noteCount === 1 ? "" : "s"}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
