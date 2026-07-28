export type Priority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  done: boolean;
  due_at: string | null;
  priority: Priority;
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

export interface Exam {
  id: string;
  user_id: string;
  subject_name: string;
  exam_date: string;
  chapters_total: number;
  chapters_mastered: number;
}

export interface StudySession {
  id: string;
  user_id: string;
  subject_id: string | null;
  minutes: number;
  logged_at: string;
}

export interface WaterLog {
  id: string;
  user_id: string;
  amount_ml: number;
  logged_at: string;
}

export type WorkoutStatus = "scheduled" | "completed" | "skipped";

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  scheduled_date: string;
  status: WorkoutStatus;
}
