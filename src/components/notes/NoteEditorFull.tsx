"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NotesEditor } from "./NotesEditor";
import { NoteOutline } from "./NoteOutline";
import type { Note } from "@/lib/types";
import { updateNote } from "@/app/(app)/notes/actions";
import { uploadInlineImage } from "@/lib/attachments";

const AUTOSAVE_DELAY = 3000;

type SaveStatus = "idle" | "saving" | "saved";

export function NoteEditorFull({ note }: { note: Note }) {
  const [, startTransition] = useTransition();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({ title: note.title, content: note.content });
  const containerElRef = useRef<HTMLDivElement | null>(null);
  const setContainerEl = useCallback((el: HTMLDivElement | null) => {
    containerElRef.current = el;
  }, []);

  useEffect(() => {
    latestRef.current = { title, content };
  }, [title, content]);

  const save = useRef(() => {
    const { title, content } = latestRef.current;
    setSaveStatus("saving");
    startTransition(() =>
      updateNote(note.id, { title, content }).then(() => setSaveStatus("saved"))
    );
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

  const saveLabel = saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Auto Saved" : "";

  return (
    <div className="fixed inset-0 md:pl-[60px] lg:pl-60 pb-[60px] md:pb-0 flex flex-col bg-bg">
      <header className="flex items-center gap-3 px-5 py-3 border-b border-alabaster shrink-0">
        <Link
          href={`/notes/${note.id}`}
          aria-label="Back to note"
          className="w-8 h-8 rounded-md hover:bg-bg flex items-center justify-center transition-fast"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1" />
        <span className="text-caption text-graphite">{saveLabel}</span>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto flex gap-8">
          <div className="max-w-3xl flex-1 flex flex-col gap-4 min-w-0">
            <input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled"
              className="text-h1 font-bold border-none px-0 py-0 bg-transparent focus:outline-none w-full placeholder:text-graphite placeholder:opacity-30"
            />

            <NotesEditor
              content={content}
              onChange={handleContentChange}
              onUploadImage={(file) => uploadInlineImage(note.id, file)}
              onUploadAttachment={(file) => uploadInlineImage(note.id, file)}
              editorRef={setContainerEl}
            />
          </div>

          <aside className="hidden lg:block w-48 shrink-0 sticky top-6 self-start">
            <NoteOutline containerRef={containerElRef} content={content} />
          </aside>
        </div>
      </div>
    </div>
  );
}
