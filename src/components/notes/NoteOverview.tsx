"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit3, Folder, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Note, NoteFolder } from "@/lib/types";
import { deleteNote, updateNote } from "@/app/(app)/notes/actions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function NoteOverview({ note, folders }: { note: Note; folders: NoteFolder[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const folder = folders.find((f) => f.id === note.folder_id);

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 px-5 py-3 border-b border-alabaster">
        <Link
          href="/notes"
          aria-label="Back to notes"
          className="w-8 h-8 rounded-md hover:bg-bg flex items-center justify-center transition-fast"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1" />
        <button
          aria-label={note.is_favorite ? "Unfavorite" : "Favorite"}
          onClick={() => startTransition(() => updateNote(note.id, { is_favorite: !note.is_favorite }))}
          className="w-8 h-8 rounded-md hover:bg-bg flex items-center justify-center transition-fast"
        >
          <Star size={16} className={note.is_favorite ? "text-tuscan fill-tuscan" : "text-graphite"} />
        </button>
        <button
          aria-label="Delete note"
          onClick={() => {
            if (confirm("Delete this note? This cannot be undone.")) {
              startTransition(() => deleteNote(note.id));
              router.push("/notes");
            }
          }}
          className="w-8 h-8 rounded-md hover:bg-bg flex items-center justify-center transition-fast text-graphite hover:text-danger"
        >
          <Trash2 size={16} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-5">
          <h1 className="text-h1 font-bold">{note.title || "Untitled"}</h1>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-small text-graphite">
            <span className="flex items-center gap-1.5">
              <Folder size={14} /> {folder?.name ?? "No folder"}
            </span>
            <span>Created {formatDate(note.created_at)}</span>
            <span>Last edited {formatDate(note.updated_at)}</span>
          </div>

          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {note.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 rounded-md bg-alabaster text-graphite text-caption">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <div
              className="notes-editor-prose text-body max-h-[220px] overflow-hidden"
              dangerouslySetInnerHTML={{ __html: note.content || "<p class='text-graphite'>This note is empty.</p>" }}
            />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-bg via-bg/90 to-transparent flex items-end justify-center pb-2">
              <Link href={`/notes/${note.id}/edit`}>
                <Button className="flex items-center gap-2 shadow-lg">
                  <Edit3 size={16} /> Open Editor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
