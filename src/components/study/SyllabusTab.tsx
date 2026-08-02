"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Merge, Plus, Scissors, Sparkles, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Chapter, ChapterStatus, StudyAttachment } from "@/lib/types";
import { CHAPTER_STATUS_LABEL, CHAPTER_STATUS_DOT, CHAPTER_STATUS_ORDER, chapterMasteryPercent } from "@/lib/study";
import {
  addChapter,
  deleteChapter,
  mergeChapters,
  reorderChapters,
  splitChapter,
  updateChapterStatus,
} from "@/app/(app)/study/actions";
import { generateChaptersFromSyllabusText } from "@/lib/ai/study-generation";
import { ChapterStudyToolsModal } from "./ChapterStudyToolsModal";

function SortableChapterRow({
  chapter,
  subjectId,
  allChapters,
  notesCount,
  homeworkCount,
  onOpenAiTools,
}: {
  chapter: Chapter;
  subjectId: string;
  allChapters: Chapter[];
  notesCount: number;
  homeworkCount: number;
  onOpenAiTools: (chapterId: string) => void;
}) {
  const [, startTransition] = useTransition();
  const [splitting, setSplitting] = useState(false);
  const [splitNames, setSplitNames] = useState("");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: chapter.id });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const otherChapters = allChapters.filter((c) => c.id !== chapter.id);

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} aria-label="Drag to reorder" className="text-graphite cursor-grab active:cursor-grabbing">
          <GripVertical size={14} />
        </button>
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${CHAPTER_STATUS_DOT[chapter.status]}`} />
        <span className="flex-1 text-body min-w-0 truncate">{chapter.name}</span>
        <span className="text-[11px] text-graphite shrink-0">
          {chapterMasteryPercent(chapter.status)}% · {notesCount} notes · {homeworkCount} hw
        </span>
        <select
          value={chapter.status}
          onChange={(e) => startTransition(() => updateChapterStatus(subjectId, chapter.id, e.target.value as ChapterStatus))}
          className="text-small border border-alabaster rounded-md px-2 py-1 bg-linen dark:bg-bg-secondary shrink-0"
        >
          {CHAPTER_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {CHAPTER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        {otherChapters.length > 0 && (
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) startTransition(() => mergeChapters(subjectId, chapter.id, e.target.value));
            }}
            className="text-[11px] border border-alabaster rounded-md px-1 py-1 bg-linen dark:bg-bg-secondary shrink-0"
            aria-label="Merge into…"
          >
            <option value="">Merge into…</option>
            {otherChapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        <button aria-label="AI study tools" onClick={() => onOpenAiTools(chapter.id)} className="text-graphite hover:text-tuscan shrink-0">
          <Sparkles size={14} />
        </button>
        <button aria-label="Split chapter" onClick={() => setSplitting((v) => !v)} className="text-graphite hover:text-text shrink-0">
          <Scissors size={14} />
        </button>
        <button aria-label="Delete chapter" onClick={() => startTransition(() => deleteChapter(subjectId, chapter.id))} className="shrink-0">
          <Trash2 size={14} className="text-graphite hover:text-danger transition-fast" />
        </button>
      </div>
      {splitting && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const names = splitNames.split(",").map((n) => n.trim()).filter(Boolean);
            if (names.length > 0) {
              startTransition(() => splitChapter(subjectId, chapter.id, names));
              setSplitting(false);
              setSplitNames("");
            }
          }}
          className="flex items-center gap-2 pl-8"
        >
          <Input
            placeholder="New chapter names, comma separated"
            value={splitNames}
            onChange={(e) => setSplitNames(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary">
            Split
          </Button>
        </form>
      )}
    </div>
  );
}

export function SyllabusTab({
  subjectId,
  subjectName,
  chapters,
  notesCountByChapter = {},
  homeworkCountByChapter = {},
  attachments = [],
}: {
  subjectId: string;
  subjectName: string;
  chapters: Chapter[];
  notesCountByChapter?: Record<string, number>;
  homeworkCountByChapter?: Record<string, number>;
  attachments?: StudyAttachment[];
}) {
  const [name, setName] = useState("");
  const [, startTransition] = useTransition();
  const [order, setOrder] = useState(() => [...chapters].sort((a, b) => a.position - b.position).map((c) => c.id));
  const [syllabusOpen, setSyllabusOpen] = useState(false);
  const [syllabusText, setSyllabusText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiChapterId, setAiChapterId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const chapterById = new Map(chapters.map((c) => [c.id, c]));
  const orderedChapters = order.map((id) => chapterById.get(id)).filter((c): c is Chapter => !!c);
  // pick up any chapters not yet in local order state (e.g. just added)
  const missing = chapters.filter((c) => !order.includes(c.id));
  const displayChapters = [...orderedChapters, ...missing];

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(() => {
      addChapter(subjectId, name);
    });
    setName("");
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder((current) => {
      const ids = displayChapters.map((c) => c.id);
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      const reordered = arrayMove(ids, oldIndex, newIndex);
      startTransition(() => reorderChapters(subjectId, reordered));
      return reordered;
    });
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const { addChaptersBulk } = await import("@/app/(app)/study/actions");
      const result = await generateChaptersFromSyllabusText("this subject", syllabusText);
      if (result.length > 0) await addChaptersBulk(subjectId, result);
      setSyllabusText("");
      setSyllabusOpen(false);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <div className="border border-alabaster rounded-xl divide-y divide-alabaster mb-4">
        {displayChapters.length === 0 ? (
          <p className="text-small text-graphite py-8 text-center">No chapters yet.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={displayChapters.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {displayChapters.map((chapter) => (
                <SortableChapterRow
                  key={chapter.id}
                  chapter={chapter}
                  subjectId={subjectId}
                  allChapters={chapters}
                  notesCount={notesCountByChapter[chapter.id] ?? 0}
                  homeworkCount={homeworkCountByChapter[chapter.id] ?? 0}
                  onOpenAiTools={setAiChapterId}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 max-w-sm mb-3">
        <Input placeholder="Add chapter…" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
        <Button type="submit" variant="icon" aria-label="Add chapter">
          <Plus size={16} />
        </Button>
      </form>

      <button onClick={() => setSyllabusOpen((v) => !v)} className="text-caption text-tuscan flex items-center gap-1.5 mb-2">
        <Sparkles size={12} /> Generate more chapters from syllabus text
      </button>
      {syllabusOpen && (
        <div className="flex flex-col gap-2 max-w-lg">
          <textarea
            value={syllabusText}
            onChange={(e) => setSyllabusText(e.target.value)}
            placeholder="Paste additional syllabus text…"
            rows={4}
            className="text-small px-3 py-2 rounded-md border border-alabaster bg-linen dark:bg-bg-secondary resize-none"
          />
          <Button variant="secondary" onClick={handleGenerate} disabled={!syllabusText.trim() || generating} className="w-fit flex items-center gap-1.5">
            <Merge size={14} /> {generating ? "Generating…" : "Generate & add chapters"}
          </Button>
        </div>
      )}

      {aiChapterId && (
        <ChapterStudyToolsModal
          open={aiChapterId !== null}
          onClose={() => setAiChapterId(null)}
          subjectId={subjectId}
          subjectName={subjectName}
          chapterId={aiChapterId}
          chapterName={chapterById.get(aiChapterId)?.name ?? ""}
          attachments={attachments.filter((a) => a.chapter_id === aiChapterId)}
        />
      )}
    </div>
  );
}
