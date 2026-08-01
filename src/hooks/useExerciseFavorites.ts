"use client";

import { useState, useTransition } from "react";
import type { ExerciseFavorite } from "@/lib/types";
import { toggleExerciseFavorite } from "@/app/(app)/health/actions";

/**
 * Optimistic favorites state: the star toggles instantly in the UI while
 * the server action persists in the background. Seeded once from the
 * server-fetched rows, then kept locally in sync so toggling doesn't wait
 * on a revalidation round-trip (which previously made favoriting feel
 * broken/laggy, and didn't work at all from the live workout screen since
 * that page never passed real favorite data down).
 */
export function useExerciseFavorites(initial: ExerciseFavorite[]) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set(initial.map((f) => f.exercise_id)));
  const [, startTransition] = useTransition();

  function toggleFavorite(exerciseId: string, next: boolean) {
    setFavoriteIds((prev) => {
      const updated = new Set(prev);
      if (next) updated.add(exerciseId);
      else updated.delete(exerciseId);
      return updated;
    });
    startTransition(() => toggleExerciseFavorite(exerciseId, next));
  }

  return { favoriteIds, toggleFavorite };
}
