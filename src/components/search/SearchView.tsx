"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, FileText, Paperclip, Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/Input";
import type { Chapter, Note, NoteFolder, StudyAttachment, Subject } from "@/lib/types";

type ResultType = "general_note" | "study_note" | "subject" | "chapter" | "attachment";

const TYPE_LABEL: Record<ResultType, string> = {
  general_note: "General note",
  study_note: "Study note",
  subject: "Subject",
  chapter: "Chapter",
  attachment: "Attachment",
};

const TYPE_ICON: Record<ResultType, typeof FileText> = {
  general_note: FileText,
  study_note: BookOpen,
  subject: BookOpen,
  chapter: BookOpen,
  attachment: Paperclip,
};

interface SearchResult {
  type: ResultType;
  id: string;
  title: string;
  subtitle: string;
  href: string;
  date: string;
  subjectId: string | null;
  folderId: string | null;
}

interface SearchViewProps {
  notes: Note[];
  folders: NoteFolder[];
  subjects: Subject[];
  chapters: Chapter[];
  attachments: StudyAttachment[];
}

export function SearchView({ notes, folders, subjects, chapters, attachments }: SearchViewProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ResultType | "all">("all");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [folderFilter, setFolderFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const results = useMemo<SearchResult[]>(() => {
    const chapterById = new Map(chapters.map((c) => [c.id, c]));
    const subjectById = new Map(subjects.map((s) => [s.id, s]));
    const folderById = new Map(folders.map((f) => [f.id, f]));
    const items: SearchResult[] = [];

    for (const n of notes) {
      const chapter = n.chapter_id ? chapterById.get(n.chapter_id) : undefined;
      const subject = chapter ? subjectById.get(chapter.subject_id) : undefined;
      const folder = n.folder_id ? folderById.get(n.folder_id) : undefined;
      items.push({
        type: n.chapter_id ? "study_note" : "general_note",
        id: n.id,
        title: n.title || "Untitled",
        subtitle: n.chapter_id
          ? [subject?.name, chapter?.name].filter(Boolean).join(" · ") || "Study note"
          : folder?.name ?? "No folder",
        href: `/notes/${n.id}`,
        date: n.updated_at,
        subjectId: chapter?.subject_id ?? null,
        folderId: n.folder_id,
      });
    }

    for (const s of subjects) {
      items.push({
        type: "subject",
        id: s.id,
        title: s.name,
        subtitle: "Subject",
        href: `/study/${s.id}`,
        date: s.created_at,
        subjectId: s.id,
        folderId: null,
      });
    }

    for (const c of chapters) {
      const subject = subjectById.get(c.subject_id);
      items.push({
        type: "chapter",
        id: c.id,
        title: c.name,
        subtitle: subject ? `Chapter · ${subject.name}` : "Chapter",
        href: `/study/${c.subject_id}`,
        date: subject?.created_at ?? "",
        subjectId: c.subject_id,
        folderId: null,
      });
    }

    for (const a of attachments) {
      const chapter = chapterById.get(a.chapter_id);
      const subject = chapter ? subjectById.get(chapter.subject_id) : undefined;
      items.push({
        type: "attachment",
        id: a.id,
        title: a.file_name,
        subtitle: [subject?.name, chapter?.name].filter(Boolean).join(" · ") || "Attachment",
        href: chapter ? `/study/${chapter.subject_id}` : "/study",
        date: a.created_at,
        subjectId: chapter?.subject_id ?? null,
        folderId: null,
      });
    }

    return items;
  }, [notes, subjects, chapters, folders, attachments]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return results
      .filter((r) => (typeFilter === "all" ? true : r.type === typeFilter))
      .filter((r) => (subjectFilter ? r.subjectId === subjectFilter : true))
      .filter((r) => (folderFilter ? r.folderId === folderFilter : true))
      .filter((r) => (dateFrom ? r.date.slice(0, 10) >= dateFrom : true))
      .filter((r) => (dateTo ? r.date.slice(0, 10) <= dateTo : true))
      .filter((r) => (q ? r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q) : true))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [results, query, typeFilter, subjectFilter, folderFilter, dateFrom, dateTo]);

  return (
    <div className="p-6">
      <h1 className="text-h1 mb-5">Search</h1>

      <div className="flex flex-col gap-3 mb-6 max-w-3xl">
        <div className="relative">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite" />
          <Input
            autoFocus
            placeholder="Search notes, subjects, chapters, attachments…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ResultType | "all")}
            className="text-small px-2 py-1.5 rounded-md border border-alabaster bg-linen dark:bg-bg-secondary"
          >
            <option value="all">All types</option>
            {(Object.keys(TYPE_LABEL) as ResultType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>

          {subjects.length > 0 && (
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="text-small px-2 py-1.5 rounded-md border border-alabaster bg-linen dark:bg-bg-secondary"
            >
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {folders.length > 0 && (
            <select
              value={folderFilter}
              onChange={(e) => setFolderFilter(e.target.value)}
              className="text-small px-2 py-1.5 rounded-md border border-alabaster bg-linen dark:bg-bg-secondary"
            >
              <option value="">All folders</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          )}

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="From date"
            className="text-small px-2 py-1.5 rounded-md border border-alabaster bg-linen dark:bg-bg-secondary"
          />
          <span className="text-caption text-graphite">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="To date"
            className="text-small px-2 py-1.5 rounded-md border border-alabaster bg-linen dark:bg-bg-secondary"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-small text-graphite py-12 text-center">
          {query || typeFilter !== "all" || subjectFilter || folderFilter || dateFrom || dateTo
            ? "No results match your search."
            : "Start typing to search across notes, subjects, chapters, and attachments."}
        </p>
      ) : (
        <div className="border border-alabaster rounded-xl divide-y divide-alabaster max-w-3xl">
          {filtered.map((r) => {
            const Icon = TYPE_ICON[r.type];
            return (
              <Link key={`${r.type}-${r.id}`} href={r.href} className="flex items-center gap-3 px-4 py-3 hover:bg-bg transition-fast">
                <Icon size={16} className="text-graphite shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-small font-semibold truncate">{r.title}</p>
                  <p className="text-caption text-graphite truncate">{r.subtitle}</p>
                </div>
                <span className="text-caption text-graphite shrink-0">{TYPE_LABEL[r.type]}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
