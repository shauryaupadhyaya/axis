"use client";

import { useState, useTransition } from "react";
import { Plus, RotateCw, Sparkles, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createFlashcard, deleteFlashcard, reviewFlashcard } from "@/app/(app)/study/actions";
import { ChapterStudyToolsModal } from "./ChapterStudyToolsModal";
import type { Chapter, Flashcard, FlashcardStatus, StudyAttachment } from "@/lib/types";

const STATUS_ORDER: FlashcardStatus[] = ["learning", "reviewing", "mastered"];
const STATUS_LABEL: Record<FlashcardStatus, string> = {
  learning: "Learning",
  reviewing: "Reviewing",
  mastered: "Mastered",
};

interface FlashcardsTabProps {
  subjectId: string;
  subjectName: string;
  chapters: Chapter[];
  flashcards: Flashcard[];
  attachments: StudyAttachment[];
}

export function FlashcardsTab({ subjectId, subjectName, chapters, flashcards, attachments }: FlashcardsTabProps) {
  const [, startTransition] = useTransition();
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [aiChapterId, setAiChapterId] = useState<string | null>(null);
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    setAddError(null);
    const f = front;
    const b = back;
    const cId = chapterId || undefined;
    setFront("");
    setBack("");
    startTransition(async () => {
      try {
        const id = await createFlashcard(f, b, { subjectId, chapterId: cId });
        if (!id) setAddError("Couldn't add flashcard — try again.");
      } catch {
        setAddError("Couldn't add flashcard — try again.");
      }
    });
  }

  const aiChapter = chapters.find((c) => c.id === aiChapterId);
  const chapterName = (id: string | null) => chapters.find((c) => c.id === id)?.name ?? null;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <p className="text-label text-graphite mb-2">Add flashcard</p>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 mb-2">
          <Input placeholder="Front (question/term)" value={front} onChange={(e) => setFront(e.target.value)} className="flex-1" />
          <Input placeholder="Back (answer)" value={back} onChange={(e) => setBack(e.target.value)} className="flex-1" />
          {chapters.length > 0 && (
            <select
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              className="text-small px-2 py-2 rounded-md border border-alabaster bg-linen dark:bg-bg-secondary"
            >
              <option value="">No chapter</option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <Button type="submit" className="flex items-center gap-1.5">
            <Plus size={14} /> Add
          </Button>
        </form>
        {addError && <p className="text-caption text-danger mb-2">{addError}</p>}
        {chapters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-caption text-graphite">Generate with AI for:</span>
            {chapters.map((c) => (
              <button
                key={c.id}
                onClick={() => setAiChapterId(c.id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-caption border border-alabaster hover:border-tuscan transition-fast"
              >
                <Sparkles size={11} /> {c.name}
              </button>
            ))}
          </div>
        )}
      </Card>

      {flashcards.length === 0 ? (
        <p className="text-small text-graphite py-8 text-center">No flashcards yet — add one above or generate from a chapter.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUS_ORDER.map((status) => {
            const cards = flashcards.filter((f) => f.status === status);
            return (
              <div key={status}>
                <p className="text-label text-graphite mb-2">
                  {STATUS_LABEL[status]} ({cards.length})
                </p>
                <div className="flex flex-col gap-2">
                  {cards.map((card) => {
                    const flipped = flippedId === card.id;
                    const cn = chapterName(card.chapter_id);
                    return (
                      <Card key={card.id} onClick={() => setFlippedId(flipped ? null : card.id)} className="cursor-pointer">
                        <p className="text-small mb-2">{flipped ? card.back : card.front}</p>
                        {cn && <p className="text-caption text-graphite mb-2">{cn}</p>}
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setFlippedId(flipped ? null : card.id)}
                            aria-label="Flip"
                            className="text-graphite hover:text-carbon dark:hover:text-white"
                          >
                            <RotateCw size={13} />
                          </button>
                          {STATUS_ORDER.filter((s) => s !== status).map((s) => (
                            <button
                              key={s}
                              onClick={() => startTransition(() => reviewFlashcard(card.id, s))}
                              className="text-caption px-2 py-1 rounded-full border border-alabaster hover:border-tuscan transition-fast"
                            >
                              {STATUS_LABEL[s]}
                            </button>
                          ))}
                          <button
                            onClick={() => startTransition(() => deleteFlashcard(card.id))}
                            aria-label="Delete"
                            className="text-graphite hover:text-danger ml-auto"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {aiChapter && (
        <ChapterStudyToolsModal
          open={aiChapterId !== null}
          onClose={() => setAiChapterId(null)}
          subjectId={subjectId}
          subjectName={subjectName}
          chapterId={aiChapter.id}
          chapterName={aiChapter.name}
          attachments={attachments.filter((a) => a.chapter_id === aiChapter.id)}
        />
      )}
    </div>
  );
}
