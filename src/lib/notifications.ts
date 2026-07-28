import type { AppSnapshot } from "@/lib/app-snapshot";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "urgent";
  href: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Pure function: derives reminder notifications from a data snapshot. No DB access, easy to test. */
export function buildNotifications(snapshot: AppSnapshot, now = new Date()): AppNotification[] {
  const notifications: AppNotification[] = [];

  for (const task of snapshot.tasks) {
    if (!task.due_at) continue;
    const due = new Date(task.due_at);
    const diff = due.getTime() - now.getTime();
    if (diff < DAY_MS) {
      notifications.push({
        id: `task-${task.id}`,
        title: diff < 0 ? "Overdue task" : "Task due soon",
        body: task.title,
        severity: diff < 0 ? "urgent" : "warning",
        href: "/tasks",
      });
    }
  }

  for (const hw of snapshot.homework) {
    if (!hw.due_at) continue;
    const due = new Date(hw.due_at);
    const diff = due.getTime() - now.getTime();
    if (diff < DAY_MS) {
      notifications.push({
        id: `homework-${hw.id}`,
        title: diff < 0 ? "Overdue homework" : "Homework due soon",
        body: hw.title,
        severity: diff < 0 ? "urgent" : "warning",
        href: "/study",
      });
    }
  }

  for (const exam of snapshot.exams) {
    const due = new Date(exam.exam_date);
    const diff = due.getTime() - now.getTime();
    if (diff >= 0 && diff < 3 * DAY_MS) {
      notifications.push({
        id: `exam-${exam.id}`,
        title: "Upcoming exam",
        body: `${exam.subject_name} in ${Math.max(1, Math.ceil(diff / DAY_MS))} day(s)`,
        severity: "warning",
        href: `/study/${exam.id}`,
      });
    }
  }

  for (const ev of snapshot.calendarEvents) {
    const original = new Date(`${ev.event_date}T00:00:00`);
    const occurrence =
      ev.event_type === "birthday" ? new Date(original.setFullYear(now.getFullYear())) : original;
    const diff = occurrence.getTime() - now.getTime();
    if (diff >= 0 && diff < DAY_MS) {
      notifications.push({
        id: `${ev.event_type}-${ev.id}`,
        title: ev.event_type === "birthday" ? "Birthday tomorrow" : "Upcoming event",
        body: ev.title,
        severity: "info",
        href: "/calendar",
      });
    }
  }

  // Only nag about incomplete habits in the evening, so people aren't reminded at 7am.
  if (now.getHours() >= 18) {
    const completedHabitIds = new Set(snapshot.habitCompletions.map((c) => c.habit_id));
    for (const habit of snapshot.habits) {
      if (habit.frequency !== "daily" || completedHabitIds.has(habit.id)) continue;
      notifications.push({
        id: `habit-${habit.id}`,
        title: "Habit not done yet",
        body: habit.name,
        severity: "info",
        href: "/habits",
      });
    }
  }

  return notifications;
}
