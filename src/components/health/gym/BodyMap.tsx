"use client";

import { useState } from "react";
import type { MuscleGroup } from "@/lib/gym/exercise-library";

interface Region {
  muscle: MuscleGroup;
  view: "front" | "back";
  d: string;
}

// Simplified anatomical regions on a shared 100x220 silhouette viewBox.
const REGIONS: Region[] = [
  { muscle: "Neck", view: "front", d: "M45 18 L55 18 L54 26 L46 26 Z" },
  { muscle: "Front Delts", view: "front", d: "M28 30 L40 28 L38 42 L26 42 Z" },
  { muscle: "Front Delts", view: "front", d: "M60 28 L72 30 L74 42 L62 42 Z" },
  { muscle: "Chest", view: "front", d: "M38 30 L62 30 L60 52 L40 52 Z" },
  { muscle: "Biceps", view: "front", d: "M24 44 L36 44 L34 62 L23 60 Z" },
  { muscle: "Biceps", view: "front", d: "M64 44 L76 44 L77 60 L66 62 Z" },
  { muscle: "Forearms", view: "front", d: "M20 62 L32 60 L30 80 L19 78 Z" },
  { muscle: "Forearms", view: "front", d: "M68 60 L80 62 L81 78 L70 80 Z" },
  { muscle: "Abs", view: "front", d: "M40 54 L60 54 L58 82 L42 82 Z" },
  { muscle: "Obliques", view: "front", d: "M34 54 L40 54 L40 82 L36 82 Z" },
  { muscle: "Obliques", view: "front", d: "M60 54 L66 54 L64 82 L60 82 Z" },
  { muscle: "Hip Flexors", view: "front", d: "M40 84 L60 84 L58 96 L42 96 Z" },
  { muscle: "Quads", view: "front", d: "M36 98 L50 98 L48 148 L35 148 Z" },
  { muscle: "Quads", view: "front", d: "M50 98 L64 98 L65 148 L52 148 Z" },
  { muscle: "Calves", view: "front", d: "M36 150 L48 150 L47 190 L37 190 Z" },
  { muscle: "Calves", view: "front", d: "M52 150 L64 150 L63 190 L53 190 Z" },

  { muscle: "Neck", view: "back", d: "M45 18 L55 18 L54 26 L46 26 Z" },
  { muscle: "Traps", view: "back", d: "M38 24 L62 24 L58 36 L42 36 Z" },
  { muscle: "Rear Delts", view: "back", d: "M28 30 L40 28 L38 42 L26 42 Z" },
  { muscle: "Rear Delts", view: "back", d: "M60 28 L72 30 L74 42 L62 42 Z" },
  { muscle: "Back", view: "back", d: "M38 36 L62 36 L60 60 L40 60 Z" },
  { muscle: "Lats", view: "back", d: "M32 44 L40 42 L40 66 L34 66 Z" },
  { muscle: "Lats", view: "back", d: "M60 42 L68 44 L66 66 L60 66 Z" },
  { muscle: "Triceps", view: "back", d: "M24 44 L36 44 L34 62 L23 60 Z" },
  { muscle: "Triceps", view: "back", d: "M64 44 L76 44 L77 60 L66 62 Z" },
  { muscle: "Lower Back", view: "back", d: "M40 62 L60 62 L58 82 L42 82 Z" },
  { muscle: "Glutes", view: "back", d: "M36 84 L64 84 L62 100 L38 100 Z" },
  { muscle: "Hamstrings", view: "back", d: "M36 102 L50 102 L48 148 L35 148 Z" },
  { muscle: "Hamstrings", view: "back", d: "M50 102 L64 102 L65 148 L52 148 Z" },
  { muscle: "Calves", view: "back", d: "M36 150 L48 150 L47 190 L37 190 Z" },
  { muscle: "Calves", view: "back", d: "M52 150 L64 150 L63 190 L53 190 Z" },
];

export function BodyMap({
  onSelectMuscle,
  colorByMuscle,
  selected,
}: {
  onSelectMuscle?: (muscle: MuscleGroup) => void;
  colorByMuscle?: Partial<Record<MuscleGroup, string>>;
  selected?: MuscleGroup | null;
}) {
  const [view, setView] = useState<"front" | "back">("front");

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-1 border border-alabaster rounded-lg p-1 mb-3">
        {(["front", "back"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1 rounded-md text-caption capitalize transition-fast ${
              view === v ? "bg-carbon text-white dark:bg-tuscan dark:text-carbon" : "hover:bg-bg"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 100 200" width={160} height={320}>
        <ellipse cx="50" cy="12" rx="9" ry="10" fill="var(--alabaster-grey)" opacity={0.5} />
        {REGIONS.filter((r) => r.view === view).map((r, i) => {
          const custom = colorByMuscle?.[r.muscle];
          const isSelected = selected === r.muscle;
          return (
            <path
              key={`${r.muscle}-${i}`}
              d={r.d}
              fill={custom ?? (isSelected ? "var(--tuscan-sun)" : "var(--alabaster-grey)")}
              fillOpacity={custom ? 0.85 : isSelected ? 0.9 : 0.45}
              stroke="var(--bg)"
              strokeWidth={0.6}
              className="cursor-pointer transition-fast hover:fill-opacity-80"
              onClick={() => onSelectMuscle?.(r.muscle)}
            >
              <title>{r.muscle}</title>
            </path>
          );
        })}
      </svg>
    </div>
  );
}
