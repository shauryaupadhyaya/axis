"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, FileText, Pencil, Plus, Sparkles, Upload, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createSubject, addChaptersBulk } from "@/app/(app)/study/actions";
import { generateChaptersFromSyllabusFile, generateChaptersFromSyllabusText } from "@/lib/ai/study-generation";

type Path = "choose" | "syllabus" | "manual";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function SubjectCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [path, setPath] = useState<Path>("choose");
  const [syllabusText, setSyllabusText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [chapters, setChapters] = useState<string[]>([]);
  const [newChapter, setNewChapter] = useState("");
  const [creating, setCreating] = useState(false);

  function reset() {
    setName("");
    setPath("choose");
    setSyllabusText("");
    setChapters([]);
    setNewChapter("");
    setGenError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleGenerateFromText() {
    setGenerating(true);
    setGenError(null);
    try {
      const result = await generateChaptersFromSyllabusText(name || "this subject", syllabusText);
      if (result.length === 0) setGenError("Couldn't find chapters in that text — try pasting more of the syllabus, or add chapters manually below.");
      setChapters((c) => [...c, ...result]);
    } catch {
      setGenError("Chapter generation failed. You can still add chapters manually below.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setGenerating(true);
    setGenError(null);
    try {
      const base64 = await fileToBase64(file);
      const result = await generateChaptersFromSyllabusFile(name || "this subject", base64, file.type || "application/pdf");
      if (result.length === 0) setGenError("Couldn't find chapters in that file — try pasting the syllabus text instead, or add chapters manually below.");
      setChapters((c) => [...c, ...result]);
    } catch {
      setGenError("Chapter generation failed. You can still add chapters manually below.");
    } finally {
      setGenerating(false);
    }
  }

  function addManualChapter() {
    if (!newChapter.trim()) return;
    setChapters((c) => [...c, newChapter.trim()]);
    setNewChapter("");
  }

  function removeChapter(index: number) {
    setChapters((c) => c.filter((_, i) => i !== index));
  }

  function renameChapter(index: number, value: string) {
    setChapters((c) => c.map((ch, i) => (i === index ? value : ch)));
  }

  function moveChapter(index: number, direction: "up" | "down") {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= chapters.length) return;
    setChapters((c) => {
      const next = [...c];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const id = await createSubject(name);
      if (id) {
        if (chapters.length > 0) await addChaptersBulk(id, chapters);
        handleClose();
        router.push(`/study/${id}`);
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New subject"
      footer={
        path !== "choose" && (
          <>
            <Button variant="secondary" onClick={() => setPath("choose")}>
              Back
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim() || creating}>
              {creating ? "Creating…" : `Create subject${chapters.length ? ` (${chapters.length} chapters)` : ""}`}
            </Button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <Input autoFocus label="Subject name" placeholder="e.g. Chemistry" value={name} onChange={(e) => setName(e.target.value)} />

        {path === "choose" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setPath("syllabus")}
              className="flex flex-col items-center gap-2 rounded-xl border border-alabaster p-5 hover:border-tuscan transition-fast text-center"
            >
              <Upload size={22} />
              <span className="text-body font-semibold">Upload syllabus</span>
              <span className="text-caption text-graphite">Paste text or upload a PDF — chapters are generated automatically.</span>
            </button>
            <button
              onClick={() => setPath("manual")}
              className="flex flex-col items-center gap-2 rounded-xl border border-alabaster p-5 hover:border-tuscan transition-fast text-center"
            >
              <Pencil size={22} />
              <span className="text-body font-semibold">Create chapters manually</span>
              <span className="text-caption text-graphite">Start from scratch and add chapters yourself.</span>
            </button>
          </div>
        )}

        {path === "syllabus" && (
          <div className="flex flex-col gap-3">
            <textarea
              placeholder="Paste syllabus text here…"
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              rows={5}
              className="w-full text-small px-3 py-2 rounded-md border border-alabaster bg-linen dark:bg-bg-secondary resize-none"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="secondary"
                onClick={handleGenerateFromText}
                disabled={!syllabusText.trim() || generating}
                className="flex items-center gap-1.5"
              >
                <Sparkles size={14} /> {generating ? "Generating…" : "Generate chapters from text"}
              </Button>
              <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-graphite text-sm font-semibold cursor-pointer hover:bg-linen transition-fast">
                <FileText size={14} /> Upload PDF instead
                <input type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFileUpload} disabled={generating} />
              </label>
            </div>
            {genError && <p className="text-caption text-danger">{genError}</p>}
            <ChapterEditor
              chapters={chapters}
              newChapter={newChapter}
              onNewChapterChange={setNewChapter}
              onAdd={addManualChapter}
              onRemove={removeChapter}
              onRename={renameChapter}
              onMove={moveChapter}
            />
          </div>
        )}

        {path === "manual" && (
          <ChapterEditor
            chapters={chapters}
            newChapter={newChapter}
            onNewChapterChange={setNewChapter}
            onAdd={addManualChapter}
            onRemove={removeChapter}
            onRename={renameChapter}
            onMove={moveChapter}
          />
        )}
      </div>
    </Modal>
  );
}

function ChapterEditor({
  chapters,
  newChapter,
  onNewChapterChange,
  onAdd,
  onRemove,
  onRename,
  onMove,
}: {
  chapters: string[];
  newChapter: string;
  onNewChapterChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onRename: (i: number, v: string) => void;
  onMove: (i: number, direction: "up" | "down") => void;
}) {
  return (
    <div>
      <p className="text-label text-graphite mb-2">Chapters {chapters.length > 0 && `(${chapters.length})`} — fully editable</p>
      {chapters.length > 0 && (
        <ul className="flex flex-col gap-1.5 mb-3 max-h-52 overflow-y-auto">
          {chapters.map((ch, i) => (
            <li key={i} className="flex items-center gap-2">
              <input
                value={ch}
                onChange={(e) => onRename(i, e.target.value)}
                className="flex-1 text-small px-2 py-1.5 rounded-md border border-alabaster bg-linen dark:bg-bg-secondary"
              />
              <button onClick={() => onMove(i, "up")} disabled={i === 0} className="text-graphite disabled:opacity-30" aria-label="Move up">
                <ArrowUp size={14} />
              </button>
              <button
                onClick={() => onMove(i, "down")}
                disabled={i === chapters.length - 1}
                className="text-graphite disabled:opacity-30"
                aria-label="Move down"
              >
                <ArrowDown size={14} />
              </button>
              <button onClick={() => onRemove(i)} className="text-graphite hover:text-danger" aria-label="Delete chapter">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onAdd();
        }}
        className="flex gap-2"
      >
        <Input placeholder="Add chapter…" value={newChapter} onChange={(e) => onNewChapterChange(e.target.value)} className="flex-1" />
        <Button type="submit" variant="icon" aria-label="Add chapter">
          <Plus size={16} />
        </Button>
      </form>
    </div>
  );
}
