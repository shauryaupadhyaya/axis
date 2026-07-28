import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Exam } from "@/lib/types";
import { daysUntil } from "@/lib/scores";

export function ExamsWidget({ exams }: { exams: Exam[] }) {
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
                  <p className="text-body font-medium">{exam.subject_name}</p>
                  <p className="text-caption text-graphite">
                    {exam.chapters_mastered}/{exam.chapters_total} chapters mastered
                  </p>
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
