"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";
import type { StudySession } from "@/lib/types";
import { toISODate } from "@/lib/scores";

interface StudyWidgetProps {
  sessions: StudySession[];
}

export function StudyWidget({ sessions }: StudyWidgetProps) {
  const today = toISODate(new Date());
  const minutesToday = sessions
    .filter((s) => s.logged_at.slice(0, 10) === today)
    .reduce((sum, s) => sum + s.minutes, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return toISODate(d);
  });

  const data = days.map((day) => ({
    day,
    minutes: sessions
      .filter((s) => s.logged_at.slice(0, 10) === day)
      .reduce((sum, s) => sum + s.minutes, 0),
  }));

  const hasAnySessions = sessions.length > 0;

  return (
    <Card>
      <h3 className="text-h3 mb-3">Study</h3>
      <p className="text-display">{(minutesToday / 60).toFixed(1)}h</p>
      <p className="text-caption text-graphite mb-3">logged today</p>
      {hasAnySessions ? (
        <div className="h-[80px] -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <Tooltip
                cursor={false}
                contentStyle={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--tuscan-sun)",
                  color: "var(--text)",
                  fontSize: 12,
                }}
                formatter={(value) => [`${value}m`, "Studied"]}
              />
              <Bar dataKey="minutes" radius={2}>
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fill="var(--carbon-black)"
                    fillOpacity={(i + 1) % 3 === 0 ? 1 : 0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-small text-graphite py-2 text-center">0h logged?</p>
      )}
    </Card>
  );
}
