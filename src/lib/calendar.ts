import type { Exam, Habit, HabitCompletion, StudySession, Task, Workout } from "@/lib/types";

export type CalendarEventType = "task" | "habit" | "exam" | "workout" | "study";

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  refId: string; // id of the underlying row (task/workout id for reschedulable types)
  title: string;
  date: Date;
  colorClass: string; // month-grid left-border color
  chipClass: string; // week/agenda chip background color
  reschedulable: boolean;
}

const COLORS: Record<CalendarEventType, { border: string; chip: string }> = {
  task: { border: "border-l-carbon dark:border-l-tuscan", chip: "bg-carbon text-white dark:bg-tuscan dark:text-carbon" },
  habit: { border: "border-l-success", chip: "bg-success text-white" },
  exam: { border: "border-l-danger", chip: "bg-danger text-white" },
  workout: { border: "border-l-info", chip: "bg-info text-white" },
  study: { border: "border-l-tuscan", chip: "bg-tuscan text-carbon" },
};

interface BuildCalendarEventsInput {
  tasks: Task[];
  workouts: Workout[];
  exams: Exam[];
  studySessions: StudySession[];
  habits: Habit[];
  habitCompletions: HabitCompletion[];
}

/**
 * Unifies tasks/workouts/exams/study sessions/habit completions into one event
 * list for the Month/Week/Agenda calendar views. Only tasks and workouts are
 * "reschedulable" — exams have fixed real-world dates and study sessions are
 * logged after the fact, so dragging them wouldn't correspond to a real action.
 */
export function buildCalendarEvents({
  tasks,
  workouts,
  exams,
  studySessions,
  habits,
  habitCompletions,
}: BuildCalendarEventsInput): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const task of tasks) {
    if (!task.due_at) continue;
    events.push({
      id: `task-${task.id}`,
      type: "task",
      refId: task.id,
      title: task.title,
      date: new Date(task.due_at),
      colorClass: COLORS.task.border,
      chipClass: COLORS.task.chip,
      reschedulable: true,
    });
  }

  for (const workout of workouts) {
    events.push({
      id: `workout-${workout.id}`,
      type: "workout",
      refId: workout.id,
      title: workout.name,
      date: new Date(workout.scheduled_date),
      colorClass: COLORS.workout.border,
      chipClass: COLORS.workout.chip,
      reschedulable: true,
    });
  }

  for (const exam of exams) {
    events.push({
      id: `exam-${exam.id}`,
      type: "exam",
      refId: exam.id,
      title: `${exam.subject_name} exam`,
      date: new Date(exam.exam_date),
      colorClass: COLORS.exam.border,
      chipClass: COLORS.exam.chip,
      reschedulable: false,
    });
  }

  for (const session of studySessions) {
    events.push({
      id: `study-${session.id}`,
      type: "study",
      refId: session.id,
      title: `Study (${session.minutes}m)`,
      date: new Date(session.logged_at),
      colorClass: COLORS.study.border,
      chipClass: COLORS.study.chip,
      reschedulable: false,
    });
  }

  const habitById = new Map(habits.map((h) => [h.id, h]));
  for (const completion of habitCompletions) {
    if (completion.status !== "completed") continue;
    const habit = habitById.get(completion.habit_id);
    if (!habit) continue;
    events.push({
      id: `habit-${completion.id}`,
      type: "habit",
      refId: completion.habit_id,
      title: habit.name,
      date: new Date(completion.completed_at),
      colorClass: COLORS.habit.border,
      chipClass: COLORS.habit.chip,
      reschedulable: false,
    });
  }

  return events;
}
