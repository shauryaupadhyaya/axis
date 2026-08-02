"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Chapter, Exam, Homework } from "@/lib/types";
import { daysUntil, toISODate } from "@/lib/scores";
import { computeExamReadiness, totalHours } from "@/lib/study";
import { createExam, deleteExam } from "@/app/(app)/study/actions";
import type { StudySession } from "@/lib/types";

export function ExamsTab({
  subjectId,
  exams,
  chapters,
  homework,
  studySessions,
}: {
  subjectId: string;
  exams: Exam[];
  chapters: Chapter[];
  homework: Homework[];
  studySessions: StudySession[];
}) {
  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState<string | null>(toISODate(new Date()));
  const [addError, setAddError] = useState<string | null>(null);
  const hoursLogged = totalHours(studySessions);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !date) return;
    setAddError(null);
    const examName = name;
    const examDate = date;
    startTransition(async () => {
      try {
        const id = await createExam(subjectId, examName, examDate);
        if (!id) {
          setAddError("Couldn't add exam — try again.");
          return;
        }
        setName("");
        setAdding(false);
      } catch {
        setAddError("Couldn't add exam — try again.");
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-h3">Exams</h3>
        <Button onClick={() => setAdding((v) => !v)} className="flex items-center gap-1.5">
          <Plus size={16} /> Add exam
        </Button>
      </div>

      {adding && (
        <Card className="mb-4 max-w-sm">
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <Input autoFocus label="Exam name" placeholder="e.g. Unit Test 1" value={name} onChange={(e) => setName(e.target.value)} />
            <DatePicker label="Date" value={date} onChange={setDate} />
            {addError && <p className="text-caption text-danger">{addError}</p>}
            <Button type="submit">Create</Button>
          </form>
        </Card>
      )}

      {exams.length === 0 ? (
        <p className="text-small text-graphite py-8 text-center">No exams yet — add one above.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams
            .slice()
            .sort((a, b) => a.exam_date.localeCompare(b.exam_date))
            .map((exam) => {
              const days = daysUntil(exam.exam_date);
              const readiness = computeExamReadiness(exam, chapters, homework, hoursLogged);
              return (
                <Card key={exam.id}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-h3">{exam.name}</h3>
                    <button aria-label="Delete exam" onClick={() => startTransition(() => deleteExam(subjectId, exam.id))}>
                      <Trash2 size={14} className="text-graphite hover:text-danger transition-fast" />
                    </button>
                  </div>
                  <p className="text-small text-graphite mb-3">
                    {days === 0 ? "Exam today" : days === 1 ? "Exam tomorrow" : days > 0 ? `Exam in ${days} days` : "Exam date passed"}
                    {exam.weightage != null && ` · ${exam.weightage}% weightage`}
                  </p>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-caption text-graphite">Readiness</span>
                    <span className="text-mono">{readiness}%</span>
                  </div>
                  <ProgressBar percent={readiness} />
                  {exam.notes && <p className="text-small text-graphite mt-3">{exam.notes}</p>}
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}
