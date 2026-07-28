"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import type { Exam } from "@/lib/types";
import { daysUntil } from "@/lib/scores";
import { addSubject } from "@/app/(app)/study/actions";

export function SubjectsList({ exams }: { exams: Exam[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [examDate, setExamDate] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !examDate) return;
    startTransition(async () => {
      const id = await addSubject(name, examDate);
      if (id) router.push(`/study/${id}`);
    });
    setName("");
    setExamDate(null);
    setAdding(false);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-h1">Study</h1>
        <Button onClick={() => setAdding((v) => !v)} className="flex items-center gap-1.5">
          <Plus size={16} /> Add subject
        </Button>
      </div>

      {adding && (
        <Card className="mb-5 max-w-sm">
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <Input autoFocus label="Subject name" value={name} onChange={(e) => setName(e.target.value)} />
            <DatePicker label="Exam date" value={examDate} onChange={setExamDate} />
            <Button type="submit">Create</Button>
          </form>
        </Card>
      )}

      {exams.length === 0 ? (
        <p className="text-small text-graphite py-8 text-center">No subjects yet — add one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam) => {
            const readiness = exam.chapters_total > 0 ? Math.round((exam.chapters_mastered / exam.chapters_total) * 100) : 0;
            const days = daysUntil(exam.exam_date);
            return (
              <Card
                key={exam.id}
                onClick={() => router.push(`/study/${exam.id}`)}
                className="cursor-pointer"
              >
                <h2 className="text-h2 mb-2">{exam.subject_name}</h2>
                <p className="text-display">{readiness}%</p>
                <p className="text-caption text-graphite mb-2">readiness</p>
                <p className="text-small text-graphite">
                  {days >= 0 ? `Exam in ${days} day${days === 1 ? "" : "s"}` : "Exam date passed"}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
