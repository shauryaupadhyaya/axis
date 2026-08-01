"use client";

import { useTransition } from "react";
import { Dumbbell, Plus, Star, X } from "lucide-react";
import { BodyMap } from "./BodyMap";
import { CATEGORY_LABELS, exerciseImageUrl, type Exercise, type MuscleGroup } from "@/lib/gym/exercise-library";
import { toggleExerciseFavorite } from "@/app/(app)/health/actions";

// Regions BodyMap doesn't draw as their own shape yet — fall back to the
// nearest region it does draw so the highlight still shows up.
const REGION_FALLBACK: Partial<Record<MuscleGroup, MuscleGroup>> = {
  "Upper Chest": "Chest",
  "Lower Chest": "Chest",
  Rhomboids: "Back",
};

function buildActivationMap(exercise: Exercise): Partial<Record<MuscleGroup, string>> {
  const map: Partial<Record<MuscleGroup, string>> = {};
  const setColor = (muscle: MuscleGroup, color: string) => {
    map[muscle] = color;
    const fallback = REGION_FALLBACK[muscle];
    if (fallback) map[fallback] = color;
  };
  setColor(exercise.primaryMuscle, "#ef4444");
  for (const m of exercise.secondaryMuscles) setColor(m, "#f59e0b");
  return map;
}

export function ExerciseDetailModal({
  exercise,
  isFavorite,
  onClose,
  onSelect,
}: {
  exercise: Exercise;
  isFavorite: boolean;
  onClose: () => void;
  onSelect?: (exercise: Exercise) => void;
}) {
  const [, startTransition] = useTransition();
  const activation = buildActivationMap(exercise);

  return (
    <div className="fixed inset-0 z-[1300] bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[88vh] rounded-2xl bg-linen dark:bg-bg-secondary border border-alabaster flex flex-col animate-pop-in overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-alabaster shrink-0">
          <div>
            <h3 className="text-h3">{exercise.name}</h3>
            {exercise.alternativeNames.length > 0 && (
              <p className="text-caption text-graphite">{exercise.alternativeNames.join(", ")}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              aria-label={isFavorite ? "Unfavorite" : "Favorite"}
              onClick={() => startTransition(() => toggleExerciseFavorite(exercise.id, !isFavorite))}
            >
              <Star size={18} className={isFavorite ? "fill-tuscan text-tuscan" : "text-graphite"} />
            </button>
            <button onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            <span className="text-caption px-2.5 py-1 rounded-full bg-tuscan/15 border border-tuscan/30">
              {CATEGORY_LABELS[exercise.category]}
            </span>
            <span className="text-caption px-2.5 py-1 rounded-full bg-alabaster/30 capitalize">{exercise.difficulty}</span>
            {exercise.equipment.map((eq) => (
              <span key={eq} className="text-caption px-2.5 py-1 rounded-full bg-alabaster/30 capitalize">
                {eq.replace("_", " ")}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <p className="text-label text-graphite mb-2">Movement</p>
              {exercise.images && exercise.images.length >= 2 ? (
                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-bg border border-alabaster">
                  <img
                    src={exerciseImageUrl(exercise.images[0])}
                    alt={`${exercise.name} start position`}
                    className="absolute inset-0 w-full h-full object-cover animate-exercise-crossfade-a"
                  />
                  <img
                    src={exerciseImageUrl(exercise.images[1])}
                    alt={`${exercise.name} end position`}
                    className="absolute inset-0 w-full h-full object-cover animate-exercise-crossfade-b"
                  />
                  <span className="absolute bottom-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-black/50 text-white">
                    Start → End
                  </span>
                </div>
              ) : (
                <div className="w-full aspect-square rounded-xl bg-bg border border-dashed border-alabaster flex flex-col items-center justify-center text-graphite">
                  <Dumbbell size={32} className="mb-2" />
                  <p className="text-caption">No demo images for this exercise</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-label text-graphite mb-2">Muscle activation</p>
              <div className="flex justify-center">
                <BodyMap colorByMuscle={activation} />
              </div>
              <div className="flex items-center justify-center gap-4 mt-1 text-[11px] text-graphite">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#ef4444" }} /> Primary
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#f59e0b" }} /> Secondary
                </span>
              </div>
            </div>
          </div>

          {exercise.description && (
            <div>
              <p className="text-label text-graphite mb-1">Description</p>
              <p className="text-small">{exercise.description}</p>
            </div>
          )}

          {exercise.instructions.length > 0 && (
            <div>
              <p className="text-label text-graphite mb-2">Step-by-step</p>
              <ol className="flex flex-col gap-1.5">
                {exercise.instructions.map((step, i) => (
                  <li key={i} className="text-small flex gap-2">
                    <span className="text-mono text-graphite shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
            <div>
              <p className="text-label text-graphite mb-2">Common mistakes</p>
              <ul className="flex flex-col gap-1">
                {exercise.commonMistakes.map((m, i) => (
                  <li key={i} className="text-small text-danger">
                    · {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {exercise.tips && exercise.tips.length > 0 && (
            <div>
              <p className="text-label text-graphite mb-2">Tips</p>
              <ul className="flex flex-col gap-1">
                {exercise.tips.map((t, i) => (
                  <li key={i} className="text-small text-success">
                    · {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(exercise.variations?.length || exercise.beginnerAlternative || exercise.advancedVariation) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {exercise.variations && exercise.variations.length > 0 && (
                <div className="rounded-lg bg-bg px-3 py-2">
                  <p className="text-label text-graphite mb-1">Variations</p>
                  <p className="text-small">{exercise.variations.join(", ")}</p>
                </div>
              )}
              {exercise.beginnerAlternative && (
                <div className="rounded-lg bg-bg px-3 py-2">
                  <p className="text-label text-graphite mb-1">Beginner alternative</p>
                  <p className="text-small">{exercise.beginnerAlternative}</p>
                </div>
              )}
              {exercise.advancedVariation && (
                <div className="rounded-lg bg-bg px-3 py-2">
                  <p className="text-label text-graphite mb-1">Advanced variation</p>
                  <p className="text-small">{exercise.advancedVariation}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {onSelect && (
          <div className="border-t border-alabaster px-5 py-4 shrink-0">
            <button
              onClick={() => onSelect(exercise)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-carbon text-white dark:bg-tuscan dark:text-carbon text-small font-semibold"
            >
              <Plus size={16} /> Use this exercise
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
