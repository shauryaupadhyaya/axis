"use client";

import { useState } from "react";
import type { StudySession } from "@/lib/types";
import { buildStudyHeatmap } from "@/lib/study";

type Range = "week" | "month" | "year";
const RANGE_DAYS: Record<Range, number> = { week: 7, month: 30, year: 365 };

const INTENSITY_CLASS = ["bg-alabaster/20", "bg-info/25", "bg-info/50", "bg-info/75", "bg-info"];

export function StudyHeatmap({ studySessions }: { studySessions: StudySession[] }) {
  const [range, setRange] = useState<Range>("month");
  const cells = buildStudyHeatmap(studySessions, RANGE_DAYS[range]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-h3">Study heatmap</h3>
        <div className="flex gap-1 border border-alabaster rounded-lg p-1">
          {(["week", "month", "year"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-md text-caption capitalize transition-fast ${
                range === r ? "bg-carbon text-white dark:bg-tuscan dark:text-carbon" : "hover:bg-bg"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className={range === "week" ? "grid grid-cols-7 gap-1.5" : "grid gap-1"} style={range !== "week" ? { gridTemplateColumns: "repeat(auto-fill, minmax(10px, 1fr))" } : undefined}>
        {cells.map((cell) => (
          <div
            key={cell.date}
            title={`${cell.date}: ${cell.minutes}m across ${cell.sessions} session${cell.sessions === 1 ? "" : "s"}`}
            className={`aspect-square rounded-sm ${INTENSITY_CLASS[cell.intensity]}`}
          />
        ))}
      </div>
    </div>
  );
}
