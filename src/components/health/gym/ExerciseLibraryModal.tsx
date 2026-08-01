"use client";

import { useMemo, useState, useTransition } from "react";
import { Home, Search, Star, X } from "lucide-react";
import { BodyMap } from "./BodyMap";
import {
  filterExercises,
  type Equipment,
  type Exercise,
  type ExerciseDifficulty,
  type MuscleGroup,
} from "@/lib/gym/exercise-library";
import { toggleExerciseFavorite } from "@/app/(app)/health/actions";

const EQUIPMENT_OPTIONS: Equipment[] = [
  "barbell",
  "dumbbell",
  "cable",
  "machine",
  "bodyweight",
  "kettlebell",
  "resistance_band",
  "smith_machine",
  "ez_bar",
  "medicine_ball",
];
const DIFFICULTY_OPTIONS: ExerciseDifficulty[] = ["beginner", "intermediate", "advanced"];

export function ExerciseLibraryModal({
  favoriteIds,
  onClose,
  onSelect,
}: {
  favoriteIds: Set<string>;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}) {
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<Equipment | "">("");
  const [difficulty, setDifficulty] = useState<ExerciseDifficulty | "">("");
  const [homeOnly, setHomeOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const results = useMemo(
    () =>
      filterExercises({
        query,
        muscleGroup: muscle ?? undefined,
        equipment: equipment || undefined,
        difficulty: difficulty || undefined,
        homeOnly,
        favoritesOnly,
        favoriteIds,
      }),
    [query, muscle, equipment, difficulty, homeOnly, favoritesOnly, favoriteIds]
  );

  return (
    <div className="fixed inset-0 z-[1200] bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[85vh] rounded-2xl bg-linen dark:bg-bg-secondary border border-alabaster p-5 flex flex-col animate-pop-in">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-h3">Exercise library</h3>
          <button onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite" />
            <input
              placeholder="Search exercises…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-small rounded-md border border-alabaster bg-bg"
            />
          </div>
          <select value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment | "")} className="text-small px-2 py-2 rounded-md border border-alabaster bg-bg">
            <option value="">All equipment</option>
            {EQUIPMENT_OPTIONS.map((eq) => (
              <option key={eq} value={eq}>
                {eq.replace("_", " ")}
              </option>
            ))}
          </select>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as ExerciseDifficulty | "")} className="text-small px-2 py-2 rounded-md border border-alabaster bg-bg">
            <option value="">All levels</option>
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <button
            onClick={() => setHomeOnly((v) => !v)}
            className={`p-2 rounded-md border ${homeOnly ? "border-tuscan bg-tuscan/20" : "border-alabaster"}`}
            aria-label="Home workouts only"
          >
            <Home size={16} />
          </button>
          <button
            onClick={() => setFavoritesOnly((v) => !v)}
            className={`p-2 rounded-md border ${favoritesOnly ? "border-tuscan bg-tuscan/20" : "border-alabaster"}`}
            aria-label="Favorites only"
          >
            <Star size={16} />
          </button>
        </div>

        <div className="flex gap-4 overflow-hidden flex-1">
          <div className="hidden sm:block shrink-0">
            <BodyMap selected={muscle} onSelectMuscle={(m) => setMuscle((cur) => (cur === m ? null : m))} />
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-1.5">
            {results.length === 0 ? (
              <p className="text-small text-graphite text-center py-8">No exercises match those filters.</p>
            ) : (
              results.map((ex) => {
                const isFav = favoriteIds.has(ex.id);
                return (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-alabaster px-3 py-2 hover:border-tuscan cursor-pointer transition-fast"
                    onClick={() => onSelect(ex)}
                  >
                    <div className="min-w-0">
                      <p className="text-small font-medium">{ex.name}</p>
                      <p className="text-[11px] text-graphite">
                        {ex.primaryMuscle} · {ex.equipment.join(", ")} · {ex.difficulty}
                      </p>
                    </div>
                    <button
                      aria-label={isFav ? "Unfavorite" : "Favorite"}
                      onClick={(e) => {
                        e.stopPropagation();
                        startTransition(() => toggleExerciseFavorite(ex.id, !isFav));
                      }}
                    >
                      <Star size={16} className={isFav ? "fill-tuscan text-tuscan" : "text-graphite"} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
