"use client";

import { useState } from "react";
import type { MuscleGroup } from "@/lib/gym/exercise-library";

interface Region {
  muscle: MuscleGroup;
  view: "front" | "back";
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotate?: number;
}

// A smooth, rounded silhouette (all ellipses, no blocky rectangles) shared by
// both views — head/neck/torso/hips/limbs — drawn once beneath the
// interactive muscle regions so the figure reads as an actual body rather
// than floating shapes.
const SILHOUETTE = [
  { cx: 60, cy: 16, rx: 11, ry: 13 }, // head
  { cx: 60, cy: 30, rx: 7, ry: 6 }, // neck
  { cx: 60, cy: 52, rx: 26, ry: 20 }, // shoulders/upper torso
  { cx: 60, cy: 90, rx: 18, ry: 24 }, // waist
  { cx: 60, cy: 118, rx: 20, ry: 14 }, // hips
  { cx: 30, cy: 60, rx: 8, ry: 20, rotate: -8 }, // left upper arm
  { cx: 24, cy: 98, rx: 6.5, ry: 18, rotate: -4 }, // left forearm
  { cx: 90, cy: 60, rx: 8, ry: 20, rotate: 8 }, // right upper arm
  { cx: 96, cy: 98, rx: 6.5, ry: 18, rotate: 4 }, // right forearm
  { cx: 48, cy: 160, rx: 12, ry: 32 }, // left thigh
  { cx: 72, cy: 160, rx: 12, ry: 32 }, // right thigh
  { cx: 47, cy: 220, rx: 8, ry: 26 }, // left calf
  { cx: 73, cy: 220, rx: 8, ry: 26 }, // right calf
  { cx: 47, cy: 250, rx: 8, ry: 5, rotate: -6 }, // left foot
  { cx: 73, cy: 250, rx: 8, ry: 5, rotate: 6 }, // right foot
];

// Interactive muscle regions layered on top of the silhouette. Ellipses only
// (native smooth curves) — no straight-edge polygons.
const REGIONS: Region[] = [
  { muscle: "Neck", view: "front", cx: 60, cy: 28, rx: 6, ry: 5 },
  { muscle: "Front Delts", view: "front", cx: 38, cy: 46, rx: 7, ry: 8 },
  { muscle: "Front Delts", view: "front", cx: 82, cy: 46, rx: 7, ry: 8 },
  { muscle: "Chest", view: "front", cx: 48, cy: 54, rx: 11, ry: 10 },
  { muscle: "Chest", view: "front", cx: 72, cy: 54, rx: 11, ry: 10 },
  { muscle: "Biceps", view: "front", cx: 30, cy: 62, rx: 6, ry: 14, rotate: -8 },
  { muscle: "Biceps", view: "front", cx: 90, cy: 62, rx: 6, ry: 14, rotate: 8 },
  { muscle: "Forearms", view: "front", cx: 24, cy: 98, rx: 5, ry: 15, rotate: -4 },
  { muscle: "Forearms", view: "front", cx: 96, cy: 98, rx: 5, ry: 15, rotate: 4 },
  { muscle: "Abs", view: "front", cx: 60, cy: 88, rx: 11, ry: 22 },
  { muscle: "Obliques", view: "front", cx: 44, cy: 90, rx: 5, ry: 18 },
  { muscle: "Obliques", view: "front", cx: 76, cy: 90, rx: 5, ry: 18 },
  { muscle: "Hip Flexors", view: "front", cx: 60, cy: 116, rx: 14, ry: 8 },
  { muscle: "Quads", view: "front", cx: 48, cy: 158, rx: 10, ry: 30 },
  { muscle: "Quads", view: "front", cx: 72, cy: 158, rx: 10, ry: 30 },
  { muscle: "Calves", view: "front", cx: 47, cy: 220, rx: 7, ry: 24 },
  { muscle: "Calves", view: "front", cx: 73, cy: 220, rx: 7, ry: 24 },

  { muscle: "Neck", view: "back", cx: 60, cy: 28, rx: 6, ry: 5 },
  { muscle: "Traps", view: "back", cx: 60, cy: 42, rx: 16, ry: 10 },
  { muscle: "Rear Delts", view: "back", cx: 38, cy: 46, rx: 7, ry: 8 },
  { muscle: "Rear Delts", view: "back", cx: 82, cy: 46, rx: 7, ry: 8 },
  { muscle: "Back", view: "back", cx: 60, cy: 62, rx: 15, ry: 14 },
  { muscle: "Lats", view: "back", cx: 42, cy: 68, rx: 8, ry: 16 },
  { muscle: "Lats", view: "back", cx: 78, cy: 68, rx: 8, ry: 16 },
  { muscle: "Rhomboids", view: "back", cx: 60, cy: 52, rx: 8, ry: 6 },
  { muscle: "Triceps", view: "back", cx: 30, cy: 62, rx: 6, ry: 14, rotate: -8 },
  { muscle: "Triceps", view: "back", cx: 90, cy: 62, rx: 6, ry: 14, rotate: 8 },
  { muscle: "Forearms", view: "back", cx: 24, cy: 98, rx: 5, ry: 15, rotate: -4 },
  { muscle: "Forearms", view: "back", cx: 96, cy: 98, rx: 5, ry: 15, rotate: 4 },
  { muscle: "Lower Back", view: "back", cx: 60, cy: 98, rx: 12, ry: 14 },
  { muscle: "Glutes", view: "back", cx: 48, cy: 124, rx: 11, ry: 10 },
  { muscle: "Glutes", view: "back", cx: 72, cy: 124, rx: 11, ry: 10 },
  { muscle: "Hamstrings", view: "back", cx: 48, cy: 160, rx: 10, ry: 30 },
  { muscle: "Hamstrings", view: "back", cx: 72, cy: 160, rx: 10, ry: 30 },
  { muscle: "Calves", view: "back", cx: 47, cy: 220, rx: 7, ry: 24 },
  { muscle: "Calves", view: "back", cx: 73, cy: 220, rx: 7, ry: 24 },
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
      <svg viewBox="0 0 120 262" width={160} height={340}>
        <g fill="var(--alabaster-grey)" opacity={0.35}>
          {SILHOUETTE.map((s, i) => (
            <ellipse
              key={i}
              cx={s.cx}
              cy={s.cy}
              rx={s.rx}
              ry={s.ry}
              transform={s.rotate ? `rotate(${s.rotate} ${s.cx} ${s.cy})` : undefined}
            />
          ))}
        </g>
        {REGIONS.filter((r) => r.view === view).map((r, i) => {
          const custom = colorByMuscle?.[r.muscle];
          const isSelected = selected === r.muscle;
          return (
            <ellipse
              key={`${r.muscle}-${i}`}
              cx={r.cx}
              cy={r.cy}
              rx={r.rx}
              ry={r.ry}
              transform={r.rotate ? `rotate(${r.rotate} ${r.cx} ${r.cy})` : undefined}
              fill={custom ?? (isSelected ? "var(--tuscan-sun)" : "var(--alabaster-grey)")}
              fillOpacity={custom ? 0.88 : isSelected ? 0.9 : 0.55}
              stroke="var(--bg)"
              strokeWidth={0.5}
              className="cursor-pointer hover:fill-opacity-80"
              style={{ transition: "fill 400ms ease, fill-opacity 200ms ease" }}
              onClick={() => onSelectMuscle?.(r.muscle)}
            >
              <title>{r.muscle}</title>
            </ellipse>
          );
        })}
      </svg>
    </div>
  );
}
