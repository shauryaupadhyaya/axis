export type Priority = "low" | "medium" | "high" | "urgent";

/** UI-facing Todoist-style label for a Priority value; urgent=P1 ... low=P4. */
export const PRIORITY_LABEL: Record<Priority, "P1" | "P2" | "P3" | "P4"> = {
  urgent: "P1",
  high: "P2",
  medium: "P3",
  low: "P4",
};

/** Small solid-color dot/indicator class per priority. */
export const PRIORITY_DOT_CLASS: Record<Priority, string> = {
  urgent: "bg-danger",
  high: "bg-warning",
  medium: "bg-info",
  low: "bg-alabaster",
};

/** Left-border accent class per priority, for cards/chips. */
export const PRIORITY_BORDER_CLASS: Record<Priority, string> = {
  urgent: "border-l-danger",
  high: "border-l-warning",
  medium: "border-l-info",
  low: "border-l-alabaster",
};

/** Selected/active chip background class per priority (unselected chips stay neutral). */
export const PRIORITY_BADGE_CLASS: Record<Priority, string> = {
  urgent: "bg-danger text-white border-danger",
  high: "bg-warning text-white border-warning",
  medium: "bg-info text-white border-info",
  low: "bg-carbon text-white border-carbon dark:bg-tuscan dark:text-carbon dark:border-tuscan",
};

export type RecurrenceFreq = "daily" | "weekly" | "monthly" | "yearly" | "weekdays";

export interface RecurrenceRule {
  freq: RecurrenceFreq;
  interval: number;
  /** For weekly: day-of-week codes, e.g. ["MO", "WE"]. */
  byDay?: string[];
  /** For monthly: day of month, e.g. 1. */
  byMonthDay?: number;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  done: boolean;
  in_progress: boolean;
  due_at: string | null;
  priority: Priority;
  tags: string[];
  created_at: string;
  parent_task_id: string | null;
  recurrence: RecurrenceRule | null;
  reminder_at: string | null;
  completed_at: string | null;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  size_bytes: number;
  created_at: string;
}

export type HabitFrequency = "daily" | "weekly";

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  frequency: HabitFrequency;
  created_at: string;
}

export type CompletionStatus = "completed" | "partial" | "skipped";

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string; // date (YYYY-MM-DD)
  status: CompletionStatus;
}

export type CalendarEventKind = "event" | "birthday";

export interface CalendarEventRow {
  id: string;
  user_id: string;
  title: string;
  event_date: string;
  event_type: CalendarEventKind;
  notes: string | null;
  created_at: string;
}

export interface Exam {
  id: string;
  user_id: string;
  subject_name: string;
  exam_date: string;
  chapters_total: number;
  chapters_mastered: number;
}

export type ChapterStatus = "not_started" | "learning" | "revised" | "mastered";

export interface Chapter {
  id: string;
  subject_id: string;
  user_id: string;
  name: string;
  status: ChapterStatus;
  position: number;
  last_revised_at: string | null;
  revision_frequency_days: number;
}

export interface Homework {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  priority: Priority;
  done: boolean;
  created_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  subject_id: string | null;
  chapter_id: string | null;
  minutes: number;
  logged_at: string;
}

export interface WaterLog {
  id: string;
  user_id: string;
  amount_ml: number;
  logged_at: string;
}

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

export interface UserSettings {
  user_id: string;
  water_goal_ml: number;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  activity_level: ActivityLevel;
  preferred_container_ml: number;
}

export interface WaterContainer {
  id: string;
  user_id: string;
  name: string;
  volume_ml: number;
  icon: string;
  position: number;
}

export type WorkoutStatus = "scheduled" | "completed" | "skipped";
export type SetType = "standard" | "superset" | "dropset" | "giant_set" | "circuit" | "amrap" | "emom";

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  scheduled_date: string;
  status: WorkoutStatus;
  template_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  notes: string | null;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  user_id: string;
  name: string;
  muscle_group: string;
  position: number;
  exercise_id: string | null;
  set_type: SetType;
  group_key: string | null;
  notes: string | null;
}

export interface WorkoutSet {
  id: string;
  workout_exercise_id: string;
  user_id: string;
  set_number: number;
  weight: number;
  reps: number;
  completed: boolean;
  logged_at: string | null;
  duration_seconds: number | null;
  distance_m: number | null;
  rpe: number | null;
  rir: number | null;
  tempo: string | null;
  notes: string | null;
}

export interface ExerciseFavorite {
  id: string;
  user_id: string;
  exercise_id: string;
  created_at: string;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface WorkoutTemplateExercise {
  id: string;
  template_id: string;
  user_id: string;
  exercise_id: string | null;
  custom_name: string | null;
  muscle_group: string;
  set_type: SetType;
  group_key: string | null;
  target_sets: number;
  target_reps: string;
  notes: string | null;
  position: number;
}

export type ProgressPhotoCategory = "gym" | "weight_loss" | "muscle_gain" | "skincare" | "face" | "custom";
export type ProgressPhotoAngle = "front" | "left" | "right" | "back" | "other";

export interface ProgressPhoto {
  id: string;
  user_id: string;
  category: ProgressPhotoCategory;
  custom_category: string | null;
  angle: ProgressPhotoAngle;
  storage_path: string;
  caption: string | null;
  taken_at: string;
  created_at: string;
}

export interface BodyMeasurement {
  id: string;
  user_id: string;
  logged_date: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  arms_cm: number | null;
  thighs_cm: number | null;
  neck_cm: number | null;
  created_at: string;
}

export interface NoteFolder {
  id: string;
  user_id: string;
  name: string;
  position: number;
}

export interface Note {
  id: string;
  user_id: string;
  folder_id: string | null;
  chapter_id: string | null;
  title: string;
  content: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export type SkincarePeriod =
  | "am"
  | "pm"
  | "weekly"
  | "monthly"
  | "mask"
  | "eye_mask"
  | "hair"
  | "lip"
  | "foot"
  | "nail"
  | "custom";

export type SkincareStepType =
  | "cleanser"
  | "toner"
  | "serum"
  | "moisturizer"
  | "sunscreen"
  | "retinol"
  | "exfoliant"
  | "mask"
  | "other";

export interface SkincareStep {
  id: string;
  user_id: string;
  period: SkincarePeriod;
  name: string;
  position: number;
  routine_name: string | null;
  step_type: SkincareStepType;
  duration_seconds: number;
  instructions: string | null;
  product_id: string | null;
  notes: string | null;
}

export interface SkincareCompletion {
  id: string;
  step_id: string;
  user_id: string;
  completed_at: string;
}

export interface SkincareProduct {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  product_type: SkincareStepType;
  ingredients: string | null;
  purchase_date: string | null;
  expiry_date: string | null;
  image_url: string | null;
  created_at: string;
}

export interface SkinJournalEntry {
  id: string;
  user_id: string;
  logged_date: string;
  acne: number;
  redness: number;
  dryness: number;
  oiliness: number;
  irritation: number;
  sensitivity: number;
  mood: string | null;
  notes: string | null;
  created_at: string;
}
