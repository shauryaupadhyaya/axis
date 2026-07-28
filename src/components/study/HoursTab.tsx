"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { StudySession } from "@/lib/types";
import { toISODate } from "@/lib/scores";

export function HoursTab({ studySessions }: { studySessions: StudySession[] }) {
  const totalMinutes = studySessions.reduce((sum, s) => sum + s.minutes, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return toISODate(d);
  });

  const data = days.map((day) => ({
    day,
    minutes: studySessions
      .filter((s) => s.logged_at.slice(0, 10) === day)
      .reduce((sum, s) => sum + s.minutes, 0),
  }));

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-display">{Math.round((totalMinutes / 60) * 10) / 10}h</p>
          <p className="text-caption text-graphite">Total logged</p>
        </div>
        <div>
          <p className="text-display">{studySessions.length}</p>
          <p className="text-caption text-graphite">Sessions</p>
        </div>
        <div>
          <p className="text-display">
            {studySessions.length > 0 ? Math.round(totalMinutes / studySessions.length) : 0}m
          </p>
          <p className="text-caption text-graphite">Avg session</p>
        </div>
      </div>

      {studySessions.length > 0 ? (
        <div className="h-[200px]">
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
                  <Cell key={i} fill="var(--carbon-black)" fillOpacity={(i + 1) % 3 === 0 ? 1 : 0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-small text-graphite py-8 text-center">0h logged for this subject yet.</p>
      )}
    </div>
  );
}
