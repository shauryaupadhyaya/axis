import { createClient } from "@/lib/supabase/server";
import { ProfilePageView } from "@/components/profile/ProfilePageView";
import {
  computeHealthScore,
  computeProductivityScore,
  computeStudyScore,
  computeBestStreak,
  toISODate,
} from "@/lib/scores";
import { DEFAULT_STUDY_GOAL_MINUTES, DEFAULT_WATER_GOAL_ML } from "@/lib/constants";
import type {
  Habit,
  HabitCompletion,
  StudySession,
  Task,
  WaterLog,
  Workout,
} from "@/lib/types";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = toISODate(new Date());
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [tasksRes, habitsRes, completionsRes, studyRes, waterRes, workoutRes] =
    await Promise.all([
      supabase.from("tasks").select("*"),
      supabase.from("habits").select("*"),
      supabase
        .from("habit_completions")
        .select("*")
        .gte("completed_at", toISODate(thirtyDaysAgo)),
      supabase.from("study_sessions").select("*"),
      supabase.from("water_logs").select("*"),
      supabase.from("workouts").select("*"),
    ]);

  const tasks = (tasksRes.data as Task[]) ?? [];
  const habits = (habitsRes.data as Habit[]) ?? [];
  const completions = (completionsRes.data as HabitCompletion[]) ?? [];
  const studySessions = (studyRes.data as StudySession[]) ?? [];
  const waterLogs = (waterRes.data as WaterLog[]) ?? [];
  const workouts = (workoutRes.data as Workout[]) ?? [];

  const waterToday = waterLogs
    .filter((w) => w.logged_at.slice(0, 10) === today)
    .reduce((sum, w) => sum + w.amount_ml, 0);

  const minutesToday = studySessions
    .filter((s) => s.logged_at.slice(0, 10) === today)
    .reduce((sum, s) => sum + s.minutes, 0);

  const tasksDone = tasks.filter((t) => t.done).length;
  const productivity = computeProductivityScore(tasksDone, tasks.length);
  const study = computeStudyScore(minutesToday, DEFAULT_STUDY_GOAL_MINUTES);
  const health = computeHealthScore(
    waterToday,
    DEFAULT_WATER_GOAL_ML,
    workouts.some((w) => w.status === "completed")
  );

  const totalStudyMinutes = studySessions.reduce((sum, s) => sum + s.minutes, 0);
  const totalWorkoutVolume = workouts.filter((w) => w.status === "completed").length;
  const waterDaysMet = waterLogs.filter(
    (w) => w.logged_at.slice(0, 10) === today && waterLogs.filter((wl) => wl.logged_at.slice(0, 10) === w.logged_at.slice(0, 10)).reduce((s, wl) => s + wl.amount_ml, 0) >= DEFAULT_WATER_GOAL_ML
  ).length;
  const habitCompletionRate = habits.length > 0
    ? Math.round(
        (completions.filter((c) => c.status === "completed").length / (habits.length * 30)) * 100
      )
    : 0;

  const bestHabitStreaks = habits.map((h) => {
    const hc = completions.filter((c) => c.habit_id === h.id);
    return { name: h.name, streak: computeBestStreak(hc) };
  });

  const name =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "User";

  return (
    <ProfilePageView
      name={name}
      email={user?.email ?? ""}
      scores={{ productivity, study, health }}
      stats={{
        studyHours: Math.round((totalStudyMinutes / 60) * 10) / 10,
        focusSessions: studySessions.length,
        totalFocusMinutes: totalStudyMinutes,
        workoutVolume: totalWorkoutVolume,
        waterConsistency: Math.min(30, waterDaysMet),
        habitCompletion: habitCompletionRate,
      }}
      streaks={bestHabitStreaks}
    />
  );
}
