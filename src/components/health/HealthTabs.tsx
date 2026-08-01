"use client";

import { useState } from "react";
import { HealthDashboardTab } from "./HealthDashboardTab";
import { WorkoutsTab } from "./WorkoutsTab";
import { WaterTab } from "./WaterTab";
import { SkincareTab } from "./SkincareTab";
import { ProgressPhotos } from "./ProgressPhotos";
import type {
  BodyMeasurement,
  ExerciseFavorite,
  ProgressPhoto,
  SkincareCompletion,
  SkincareProduct,
  SkincareStep,
  SkinJournalEntry,
  UserSettings,
  WaterContainer,
  WaterLog,
  Workout,
  WorkoutExercise,
  WorkoutSet,
  WorkoutTemplate,
  WorkoutTemplateExercise,
} from "@/lib/types";

type Tab = "dashboard" | "gym" | "water" | "skincare" | "photos";

const TAB_LABELS: Record<Tab, string> = {
  dashboard: "Dashboard",
  gym: "Gym",
  water: "Water",
  skincare: "Skincare",
  photos: "Photos",
};

interface HealthTabsProps {
  workouts: Workout[];
  workoutExercises: WorkoutExercise[];
  workoutSets: WorkoutSet[];
  waterLogs: WaterLog[];
  waterGoalMl: number;
  waterContainers: WaterContainer[];
  userSettings: UserSettings | null;
  workedOutToday: boolean;
  skincareSteps: SkincareStep[];
  skincareCompletions: SkincareCompletion[];
  skincareProducts: SkincareProduct[];
  skinJournalEntries: SkinJournalEntry[];
  workoutTemplates: WorkoutTemplate[];
  workoutTemplateExercises: WorkoutTemplateExercise[];
  exerciseFavorites: ExerciseFavorite[];
  progressPhotos: ProgressPhoto[];
  bodyMeasurements: BodyMeasurement[];
}

export function HealthTabs(props: HealthTabsProps) {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-h1">Health</h1>
        <div className="flex gap-1 border border-alabaster rounded-lg p-1">
          {(["dashboard", "gym", "water", "skincare", "photos"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-small transition-fast ${
                tab === t ? "bg-carbon text-white dark:bg-tuscan dark:text-carbon" : "hover:bg-bg"
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {tab === "dashboard" && (
        <HealthDashboardTab
          inputs={{
            waterLogs: props.waterLogs,
            waterGoalMl: props.waterGoalMl,
            skincareSteps: props.skincareSteps,
            skincareCompletions: props.skincareCompletions,
            workouts: props.workouts,
            workoutExercises: props.workoutExercises,
            workoutSets: props.workoutSets,
            progressPhotos: props.progressPhotos,
            bodyMeasurements: props.bodyMeasurements,
          }}
        />
      )}
      {tab === "gym" && (
        <WorkoutsTab
          workouts={props.workouts}
          exercises={props.workoutExercises}
          sets={props.workoutSets}
          templates={props.workoutTemplates}
          templateExercises={props.workoutTemplateExercises}
          favorites={props.exerciseFavorites}
        />
      )}
      {tab === "water" && (
        <WaterTab
          waterLogs={props.waterLogs}
          containers={props.waterContainers}
          settings={props.userSettings}
          workedOutToday={props.workedOutToday}
        />
      )}
      {tab === "skincare" && (
        <SkincareTab
          steps={props.skincareSteps}
          completions={props.skincareCompletions}
          products={props.skincareProducts}
          journalEntries={props.skinJournalEntries}
        />
      )}
      {tab === "photos" && <ProgressPhotos photos={props.progressPhotos} measurements={props.bodyMeasurements} />}
    </div>
  );
}
