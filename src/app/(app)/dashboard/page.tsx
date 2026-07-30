import { createClient } from "@/lib/supabase/server";
import { HeaderBar } from "@/components/dashboard/HeaderBar";
import { FocusCard } from "@/components/dashboard/FocusCard";
import { WidgetGrid, WidgetSlot } from "@/components/dashboard/WidgetGrid";
import { TasksWidget } from "@/components/dashboard/widgets/TasksWidget";
import { HabitsWidget } from "@/components/dashboard/widgets/HabitsWidget";
import { ExamsWidget } from "@/components/dashboard/widgets/ExamsWidget";
import { StudyWidget } from "@/components/dashboard/widgets/StudyWidget";
import { WaterWidget } from "@/components/dashboard/widgets/WaterWidget";
import { WorkoutWidget } from "@/components/dashboard/widgets/WorkoutWidget";
import { ScoresWidget } from "@/components/dashboard/widgets/ScoresWidget";
import {
  computeHealthScore,
  computeProductivityScore,
  computeStudyScore,
  daysUntil,
  toISODate,
} from "@/lib/scores";
import { DEFAULT_STUDY_GOAL_MINUTES, DEFAULT_WATER_GOAL_ML } from "@/lib/constants";
import type { Exam, Habit, HabitCompletion, StudySession, Task, WaterLog, Workout } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email?.split("@")[0] ?? "there";

  const today = toISODate(new Date());
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [tasksRes, habitsRes, completionsRes, examsRes, studyRes, waterRes, workoutRes] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .is("parent_task_id", null)
        .order("due_at", { ascending: true, nullsFirst: false }),
      supabase.from("habits").select("*").order("created_at"),
      supabase
        .from("habit_completions")
        .select("*")
        .gte("completed_at", toISODate(sixtyDaysAgo)),
      supabase.from("exams").select("*").gte("exam_date", today).order("exam_date").limit(2),
      supabase.from("study_sessions").select("*").gte("logged_at", sevenDaysAgo.toISOString()),
      supabase.from("water_logs").select("*").gte("logged_at", startOfToday.toISOString()),
      supabase.from("workouts").select("*").eq("scheduled_date", today).maybeSingle(),
    ]);

  const tasks = (tasksRes.data ?? []) as Task[];
  const habits = (habitsRes.data ?? []) as Habit[];
  const completions = (completionsRes.data ?? []) as HabitCompletion[];
  const exams = (examsRes.data ?? []) as Exam[];
  const studySessions = (studyRes.data ?? []) as StudySession[];
  const waterLogs = (waterRes.data ?? []) as WaterLog[];
  const workout = (workoutRes.data ?? null) as Workout | null;

  const waterToday = waterLogs.reduce((sum, w) => sum + w.amount_ml, 0);
  const minutesToday = studySessions
    .filter((s) => s.logged_at.slice(0, 10) === today)
    .reduce((sum, s) => sum + s.minutes, 0);

  const tasksDone = tasks.filter((t) => t.done).length;
  const productivity = computeProductivityScore(tasksDone, tasks.length);
  const study = computeStudyScore(minutesToday, DEFAULT_STUDY_GOAL_MINUTES);
  const health = computeHealthScore(waterToday, DEFAULT_WATER_GOAL_ML, workout?.status === "completed");

  const nextTask = tasks.find((t) => !t.done && t.due_at);
  const nextExam = exams[0];

  let focus = {
    headline: "Nothing urgent — pick something to work on",
    metadata: "Your list is clear for now.",
    ctaHref: "/tasks",
    ctaLabel: "View tasks",
  };

  if (nextTask) {
    focus = {
      headline: nextTask.title,
      metadata: `Due ${new Date(nextTask.due_at!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      ctaHref: "/tasks",
      ctaLabel: "Start 25-min focus",
    };
  } else if (nextExam) {
    const days = daysUntil(nextExam.exam_date);
    focus = {
      headline: `${nextExam.subject_name} exam in ${days} day${days === 1 ? "" : "s"}`,
      metadata: `${nextExam.chapters_mastered} of ${nextExam.chapters_total} chapters mastered, ${minutesToday}m logged today`,
      ctaHref: "/study",
      ctaLabel: "Begin",
    };
  }

  return (
    <div className="flex flex-col flex-1">
      <HeaderBar name={name} />
      <div className="p-6">
        <FocusCard {...focus} />
        <WidgetGrid>
          <WidgetSlot span={2}>
            <TasksWidget tasks={tasks} />
          </WidgetSlot>
          <WidgetSlot span={1}>
            <HabitsWidget habits={habits} completions={completions} />
          </WidgetSlot>
          <WidgetSlot span={1}>
            <ExamsWidget exams={exams} />
          </WidgetSlot>
          <WidgetSlot span={1}>
            <StudyWidget sessions={studySessions} />
          </WidgetSlot>
          <WidgetSlot span={1}>
            <WaterWidget currentMl={waterToday} />
          </WidgetSlot>
          <WidgetSlot span={1}>
            <WorkoutWidget workout={workout} />
          </WidgetSlot>
          <WidgetSlot span={1}>
            <ScoresWidget productivity={productivity} study={study} health={health} />
          </WidgetSlot>
        </WidgetGrid>
      </div>
    </div>
  );
}
