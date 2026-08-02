"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Paperclip, Sparkles, Upload } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { createFlashcardsBulk, createGeneratedNote } from "@/app/(app)/study/actions";
import {
  generateFlashcardsFromSource,
  generateNoteFromSource,
  generateQuizFromSource,
  type NoteGenerationMode,
} from "@/lib/ai/study-generation";
import { fileToBase64, uploadStudyAttachment } from "@/lib/study-attachments";
import type { StudyAttachment } from "@/lib/types";

const MODE_LABEL: Record<NoteGenerationMode, string> = {
  full: "Full notes",
  summary: "Summary",
  revision: "Revision notes",
};

interface ChapterStudyToolsModalProps {
  open: boolean;
  onClose: () => void;
  subjectId: string;
  subjectName: string;
  chapterId: string;
  chapterName: string;
  attachments: StudyAttachment[];
}

export function ChapterStudyToolsModal({
  open,
  onClose,
  subjectId,
  subjectName,
  chapterId,
  chapterName,
  attachments,
}: ChapterStudyToolsModalProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  function handleClose() {
    setText("");
    setFile(null);
    setError(null);
    setResult(null);
    onClose();
  }

  async function buildSource() {
    if (file) {
      const fileBase64 = await fileToBase64(file);
      return { fileBase64, fileMediaType: file.type || "application/pdf" };
    }
    return { text };
  }

  async function handleUploadAttachment() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await uploadStudyAttachment(chapterId, file);
      setFile(null);
      router.refresh();
    } catch {
      setError("Upload failed — try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleGenerateNote(mode: NoteGenerationMode) {
    if (!text.trim() && !file) return;
    setBusy(`note-${mode}`);
    setError(null);
    setResult(null);
    try {
      const source = await buildSource();
      const { title, contentHtml } = await generateNoteFromSource(subjectName, chapterName, mode, source);
      await createGeneratedNote(chapterId, title, contentHtml);
      setResult(`Created note "${title}".`);
      router.refresh();
    } catch {
      setError("Generation failed — try again, or paste shorter source text.");
    } finally {
      setBusy(null);
    }
  }

  async function handleGenerateFlashcards() {
    if (!text.trim() && !file) return;
    setBusy("flashcards");
    setError(null);
    setResult(null);
    try {
      const source = await buildSource();
      const cards = await generateFlashcardsFromSource(subjectName, chapterName, source);
      await createFlashcardsBulk(cards, { subjectId, chapterId });
      setResult(`Created ${cards.length} flashcards.`);
      router.refresh();
    } catch {
      setError("Generation failed — try again, or paste shorter source text.");
    } finally {
      setBusy(null);
    }
  }

  async function handleGenerateQuiz() {
    if (!text.trim() && !file) return;
    setBusy("quiz");
    setError(null);
    setResult(null);
    try {
      const source = await buildSource();
      const cards = await generateQuizFromSource(subjectName, chapterName, source);
      await createFlashcardsBulk(cards, { subjectId, chapterId });
      setResult(`Created ${cards.length} quiz questions as flashcards.`);
      router.refresh();
    } catch {
      setError("Generation failed — try again, or paste shorter source text.");
    } finally {
      setBusy(null);
    }
  }

  const hasSource = text.trim().length > 0 || file !== null;

  return (
    <Modal open={open} onClose={handleClose} title={`AI study tools — ${chapterName}`}>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-label text-graphite mb-2">Source material</p>
          <textarea
            placeholder="Paste notes, worksheet text, or a summary to generate from…"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setFile(null);
            }}
            rows={4}
            className="w-full text-small px-3 py-2 rounded-md border border-alabaster bg-linen dark:bg-bg-secondary resize-none mb-2"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-alabaster text-caption cursor-pointer hover:bg-bg transition-fast">
              <FileText size={13} /> {file ? file.name : "Upload PDF/image instead"}
              <input
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  if (f) setText("");
                }}
              />
            </label>
            {file && (
              <Button variant="secondary" onClick={handleUploadAttachment} disabled={uploading} className="flex items-center gap-1.5">
                <Upload size={13} /> {uploading ? "Saving…" : "Save as attachment"}
              </Button>
            )}
          </div>
        </div>

        <div>
          <p className="text-label text-graphite mb-2">Generate notes</p>
          <div className="flex items-center gap-2 flex-wrap">
            {(Object.keys(MODE_LABEL) as NoteGenerationMode[]).map((mode) => (
              <Button
                key={mode}
                variant="secondary"
                disabled={!hasSource || busy !== null}
                onClick={() => handleGenerateNote(mode)}
                className="flex items-center gap-1.5"
              >
                <Sparkles size={13} /> {busy === `note-${mode}` ? "Generating…" : MODE_LABEL[mode]}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-label text-graphite mb-2">Generate practice</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" disabled={!hasSource || busy !== null} onClick={handleGenerateFlashcards} className="flex items-center gap-1.5">
              <Sparkles size={13} /> {busy === "flashcards" ? "Generating…" : "Flashcards"}
            </Button>
            <Button variant="secondary" disabled={!hasSource || busy !== null} onClick={handleGenerateQuiz} className="flex items-center gap-1.5">
              <Sparkles size={13} /> {busy === "quiz" ? "Generating…" : "Quiz questions"}
            </Button>
          </div>
        </div>

        {result && <p className="text-caption text-tuscan">{result}</p>}
        {error && <p className="text-caption text-danger">{error}</p>}

        {attachments.length > 0 && (
          <div>
            <p className="text-label text-graphite mb-2">Attachments</p>
            <ul className="flex flex-col gap-1.5">
              {attachments.map((a) => (
                <li key={a.id} className="flex items-center gap-2 text-small text-graphite">
                  <Paperclip size={12} /> {a.file_name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
