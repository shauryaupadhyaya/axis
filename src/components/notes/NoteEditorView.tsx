"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Trash2 } from "lucide-react";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Button } from "@/components/ui/Button";
import type { Note, NoteFolder } from "@/lib/types";
import { deleteNote, updateNote } from "@/app/(app)/notes/actions";

const AUTOSAVE_DELAY = 3000;

export function NoteEditorView({
  note,
  folders,
}: {
  note: Note;
  folders: NoteFolder[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [folderId, setFolderId] = useState(note.folder_id);
  const [tagInput, setTagInput] = useState("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({ title: note.title, content: note.content, folderId: note.folder_id });

  useEffect(() => {
    latestRef.current = { title, content, folderId };
  }, [title, content, folderId]);

  const save = useRef(() => {
    const { title, content, folderId } = latestRef.current;
    startTransition(() => updateNote(note.id, { title, content, folder_id: folderId }));
  }).current;

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  function scheduleSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(save, AUTOSAVE_DELAY);
  }

  function handleTitleChange(val: string) {
    setTitle(val);
    scheduleSave();
  }

  function handleContentChange(html: string) {
    setContent(html);
    scheduleSave();
  }

  function handleFolderChange(fid: string | null) {
    setFolderId(fid);
    startTransition(() => updateNote(note.id, { folder_id: fid }));
  }

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || note.tags.includes(trimmed)) return;
    startTransition(() => updateNote(note.id, { tags: [...note.tags, trimmed] }));
    setTagInput("");
  }

  function removeTag(tag: string) {
    startTransition(() =>
      updateNote(note.id, { tags: note.tags.filter((t) => t !== tag) })
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 px-5 py-3 border-b border-alabaster">
        <button
          aria-label="Back to notes"
          onClick={() => router.push("/notes")}
          className="w-8 h-8 rounded-md hover:bg-bg flex items-center justify-center transition-fast"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1" />
        <button
          aria-label={note.is_favorite ? "Unfavorite" : "Favorite"}
          onClick={() =>
            startTransition(() =>
              updateNote(note.id, { is_favorite: !note.is_favorite })
            )
          }
          className="w-8 h-8 rounded-md hover:bg-bg flex items-center justify-center transition-fast"
        >
          <Star
            size={16}
            className={note.is_favorite ? "text-tuscan fill-tuscan" : "text-graphite"}
          />
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
          {/* Plain input for title — avoids Input component's hardcoded styling */}
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="text-h1 font-bold border-none px-0 py-0 bg-transparent focus:outline-none w-full placeholder:text-graphite placeholder:opacity-30"
          />

          <div>
            <label className="text-label text-graphite mb-1.5 block">Folder</label>
            <select
              value={folderId ?? ""}
              onChange={(e) => handleFolderChange(e.target.value || null)}
              className="text-small border border-alabaster rounded-md px-2 py-1.5 bg-linen dark:bg-bg-secondary w-full"
            >
              <option value="">No folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-label text-graphite mb-1.5 block">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-alabaster text-graphite text-caption"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                    <span className="text-[10px]">&times;</span>
                  </button>
                </span>
              ))}
            </div>
            <input
              placeholder="Add tag, press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              className="text-body px-3 py-2 rounded-lg border border-alabaster bg-linen dark:bg-bg-secondary w-full"
            />
          </div>

          <RichTextEditor
            content={content}
            onChange={handleContentChange}
            placeholder="Start writing…"
          />

          <p className="text-caption text-graphite text-right">
            Last saved:{" "}
            {new Date(note.updated_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
