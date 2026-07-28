import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface ScoresWidgetProps {
  productivity: number;
  study: number;
  health: number;
}

const ROWS: Array<{ key: keyof ScoresWidgetProps; label: string }> = [
  { key: "productivity", label: "Productivity" },
  { key: "study", label: "Study" },
  { key: "health", label: "Health" },
];

export function ScoresWidget(props: ScoresWidgetProps) {
  return (
    <Card>
      <h3 className="text-h3 mb-3">Scores</h3>
      <div className="flex flex-col gap-3">
        {ROWS.map(({ key, label }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-small text-graphite">{label}</span>
              <span className="text-mono">{props[key]}%</span>
            </div>
            <ProgressBar percent={props[key]} />
          </div>
        ))}
      </div>
    </Card>
  );
}
