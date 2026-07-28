"use client";

import { useState } from "react";
import { WorkoutsTab } from "./WorkoutsTab";
import { WaterTab } from "./WaterTab";
import { SkincareTab } from "./SkincareTab";
import type {
  SkincareCompletion,
  SkincareStep,
  WaterLog,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from "@/lib/types";

type Tab = "workouts" | "water" | "skincare";

interface HealthTabsProps {
  workouts: Workout[];
  workoutExercises: WorkoutExercise[];
  workoutSets: WorkoutSet[];
  waterLogs: WaterLog[];
  waterGoalMl: number;
  skincareSteps: SkincareStep[];
  skincareCompletions: SkincareCompletion[];
}

export function HealthTabs(props: HealthTabsProps) {
  const [tab, setTab] = useState<Tab>("workouts");

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-h1">Health</h1>
        <div className="flex gap-1 border border-alabaster rounded-lg p-1">
          {(["workouts", "water", "skincare"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-small capitalize transition-fast ${
                tab === t ? "bg-carbon text-white" : "hover:bg-bg"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === "workouts" && (
        <WorkoutsTab
          workouts={props.workouts}
          exercises={props.workoutExercises}
          sets={props.workoutSets}
        />
      )}
      {tab === "water" && (
        <WaterTab waterLogs={props.waterLogs} goalMl={props.waterGoalMl} />
      )}
      {tab === "skincare" && (
        <SkincareTab steps={props.skincareSteps} completions={props.skincareCompletions} />
      )}
    </div>
  );
}
