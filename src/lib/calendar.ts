import type {
  CalendarEventRow,
  Exam,
  Habit,
  HabitCompletion,
  Homework,
  StudySession,
  Subject,
  Task,
  Workout,
} from "@/lib/types";

export type CalendarEventType = "task" | "habit" | "exam" | "workout" | "study" | "homework" | "event" | "birthday";

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
  homework: { border: "border-l-warning", chip: "bg-warning text-white" },
  event: { border: "border-l-graphite", chip: "bg-graphite text-white" },
  birthday: { border: "border-l-pink-500", chip: "bg-pink-500 text-white" },
};

interface BuildCalendarEventsInput {
  tasks: Task[];
  workouts: Workout[];
  exams: Exam[];
  subjects?: Subject[];
  studySessions: StudySession[];
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  homework?: Homework[];
  calendarEvents?: CalendarEventRow[];
}

/** Projects a birthday/recurring date onto the year of `referenceDate` (or the next occurrence if already past). */
function projectRecurringDate(originalDate: Date, referenceDate: Date): Date {
  const projected = new Date(originalDate);
  projected.setFullYear(referenceDate.getFullYear());
  return projected;
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
  subjects = [],
  studySessions,
  habits,
  habitCompletions,
  homework = [],
  calendarEvents = [],
}: BuildCalendarEventsInput): CalendarEvent[] {
  const subjectNameById = new Map(subjects.map((s) => [s.id, s.name]));
  const events: CalendarEvent[] = [];
  const now = new Date();

  for (const hw of homework) {
    if (!hw.due_at) continue;
    events.push({
      id: `homework-${hw.id}`,
      type: "homework",
      refId: hw.id,
      title: hw.title,
      date: new Date(hw.due_at),
      colorClass: COLORS.homework.border,
      chipClass: COLORS.homework.chip,
      reschedulable: true,
    });
  }

  for (const ev of calendarEvents) {
    const originalDate = new Date(`${ev.event_date}T00:00:00`);
    const date = ev.event_type === "birthday" ? projectRecurringDate(originalDate, now) : originalDate;
    events.push({
      id: `${ev.event_type}-${ev.id}`,
      type: ev.event_type,
      refId: ev.id,
      title: ev.title,
      date,
      colorClass: COLORS[ev.event_type].border,
      chipClass: COLORS[ev.event_type].chip,
      reschedulable: true,
    });
  }

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
      title: `${subjectNameById.get(exam.subject_id) ?? "Exam"} — ${exam.name}`,
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
