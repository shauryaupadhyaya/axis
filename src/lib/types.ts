export type Priority = "low" | "medium" | "high" | "urgent";

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
}

export type TaskBoardStatus = "not_started" | "in_progress" | "completed";

export function taskBoardStatus(task: Pick<Task, "done" | "in_progress">): TaskBoardStatus {
  if (task.done) return "completed";
  if (task.in_progress) return "in_progress";
  return "not_started";
}

export interface TaskSubtask {
  id: string;
  task_id: string;
  user_id: string;
  title: string;
  done: boolean;
  position: number;
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

export interface UserSettings {
  user_id: string;
  water_goal_ml: number;
}

export type WorkoutStatus = "scheduled" | "completed" | "skipped";

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  scheduled_date: string;
  status: WorkoutStatus;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  user_id: string;
  name: string;
  muscle_group: string;
  position: number;
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

export type SkincarePeriod = "am" | "pm";

export interface SkincareStep {
  id: string;
  user_id: string;
  period: SkincarePeriod;
  name: string;
  position: number;
}

export interface SkincareCompletion {
  id: string;
  step_id: string;
  user_id: string;
  completed_at: string;
}
