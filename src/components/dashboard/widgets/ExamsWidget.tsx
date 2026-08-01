import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Exam, Subject } from "@/lib/types";
import { daysUntil } from "@/lib/scores";

export function ExamsWidget({ exams, subjects }: { exams: Exam[]; subjects: Subject[] }) {
  const subjectNameById = new Map(subjects.map((s) => [s.id, s.name]));
  return (
    <Card>
      <h3 className="text-h3 mb-3">Exams</h3>
      {exams.length === 0 ? (
        <p className="text-small text-graphite py-4 text-center">No exams scheduled</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {exams.map((exam) => {
            const days = daysUntil(exam.exam_date);
            return (
              <li key={exam.id} className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-body font-medium">{subjectNameById.get(exam.subject_id) ?? "Subject"}</p>
                  <p className="text-caption text-graphite">{exam.name}</p>
                </div>
                <Badge variant={days < 7 ? "danger" : "neutral"}>{days}d</Badge>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
