"use client";

import { Trophy, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BodyMap } from "./BodyMap";
import type { Workout, WorkoutExercise, WorkoutSet } from "@/lib/types";
import type { MuscleGroup } from "@/lib/gym/exercise-library";
import { computeTrainingTime, computeTrophies, computeVolumeSummary, computeWorkoutStats } from "@/lib/gym/analytics";
import { computeMuscleRecoveryPercent } from "@/lib/gym/recovery";
import { computeSmartSuggestions } from "@/lib/gym/suggestions";

function recoveryColor(percent: number): string {
  if (percent >= 80) return "#10b981";
  if (percent >= 45) return "#f59e0b";
  return "#ef4444";
}

export function GymInsights({
  workouts,
  exercises,
  sets,
}: {
  workouts: Workout[];
  exercises: WorkoutExercise[];
  sets: WorkoutSet[];
}) {
  const volume = computeVolumeSummary(sets);
  const time = computeTrainingTime(workouts);
  const stats = computeWorkoutStats(workouts, exercises, sets);
  const trophies = computeTrophies(exercises, sets, workouts);
  const recovery = computeMuscleRecoveryPercent(exercises, sets);
  const suggestions = computeSmartSuggestions(exercises, sets);

  const colorByMuscle: Partial<Record<MuscleGroup, string>> = {};
  for (const r of recovery) {
    colorByMuscle[r.muscleGroup as MuscleGroup] = recoveryColor(r.percent);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <Card className="lg:col-span-2">
        <h3 className="text-h3 mb-3">Volume &amp; training time</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Today", value: `${volume.today}kg` },
            { label: "This week", value: `${volume.week}kg` },
            { label: "This month", value: `${(volume.month / 1000).toFixed(1)}t` },
            { label: "Lifetime", value: `${(volume.lifetime / 1000).toFixed(1)}t` },
          ].map((v) => (
            <div key={v.label} className="rounded-lg bg-bg px-3 py-2 text-center">
              <p className="text-h3 text-mono">{v.value}</p>
              <p className="text-[10px] text-graphite">{v.label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total hours", value: `${time.totalHours}h` },
            { label: "Avg session", value: `${time.averageSessionMinutes}m` },
            { label: "Workouts", value: stats.workoutsCompleted },
            { label: "Consistency", value: `${stats.consistencyScore}%` },
          ].map((v) => (
            <div key={v.label} className="rounded-lg bg-bg px-3 py-2 text-center">
              <p className="text-h3 text-mono">{v.value}</p>
              <p className="text-[10px] text-graphite">{v.label}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-h3 mb-3 flex items-center gap-2">
          <Trophy size={16} /> Trophies
        </h3>
        {trophies.length === 0 ? (
          <p className="text-small text-graphite py-2">Log sets to unlock trophies.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {trophies.map((t) => (
              <div key={t.id} className="rounded-lg bg-tuscan/10 border border-tuscan/30 px-3 py-2 animate-pop-in">
                <p className="text-caption text-graphite">{t.label}</p>
                <p className="text-body font-semibold">
                  {t.value} {t.exerciseName && <span className="text-caption text-graphite font-normal">· {t.exerciseName}</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-h3 mb-3">Muscle recovery</h3>
        <BodyMap colorByMuscle={colorByMuscle} />
      </Card>

      <Card className="lg:col-span-2">
        <h3 className="text-h3 mb-3">Recovery insights</h3>
        {recovery.length === 0 ? (
          <p className="text-small text-graphite py-2">No exercises logged yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recovery.map((r) => (
              <li key={r.muscleGroup} className="flex items-center justify-between gap-3">
                <span className="text-small flex-1">{r.insight}</span>
                <Badge variant={r.percent >= 80 ? "success" : r.percent >= 45 ? "warning" : "danger"}>{r.percent}%</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {suggestions.length > 0 && (
        <Card className="lg:col-span-3">
          <h3 className="text-h3 mb-3 flex items-center gap-2">
            <Lightbulb size={16} /> Smart suggestions
          </h3>
          <p className="text-caption text-graphite mb-3">Rule-based, from your recent RPE and volume trends — not AI.</p>
          <ul className="flex flex-col gap-2">
            {suggestions.map((s) => (
              <li key={s.id} className="text-small rounded-lg bg-bg px-3 py-2">
                {s.message}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
