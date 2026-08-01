"use client";

import { AreaChart, Area, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Camera, Droplets, Dumbbell, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { usePhotoUrl } from "@/lib/photos";
import { toISODate, daysUntil } from "@/lib/scores";
import { totalForDay, computeWaterStreak } from "@/lib/water";
import { computeSkincareStreak, computeSkinScore, todaysCompletionPercent } from "@/lib/skincare";
import { computeVolumeSummary } from "@/lib/gym/analytics";
import { computeHealthScoreBreakdown, computeMonthlyTrend, computeWeeklyTrend, type HealthScoreInputs } from "@/lib/health-dashboard";

function scoreColor(score: number): string {
  if (score >= 75) return "var(--success)";
  if (score >= 45) return "var(--warning)";
  return "var(--danger)";
}

export function HealthDashboardTab({ inputs }: { inputs: HealthScoreInputs }) {
  const breakdown = computeHealthScoreBreakdown(inputs);
  const weeklyTrend = computeWeeklyTrend(inputs);
  const monthlyTrend = computeMonthlyTrend(inputs);

  const today = toISODate(new Date());
  const todayWater = totalForDay(inputs.waterLogs, today);
  const waterGoalPct = inputs.waterGoalMl > 0 ? Math.round((todayWater / inputs.waterGoalMl) * 100) : 0;
  const waterStreak = computeWaterStreak(inputs.waterLogs, inputs.waterGoalMl);

  const lastWorkout = [...inputs.workouts]
    .filter((w) => w.status === "completed")
    .sort((a, b) => (a.scheduled_date < b.scheduled_date ? 1 : -1))[0];
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weeklyWorkouts = inputs.workouts.filter((w) => w.status === "completed" && new Date(w.scheduled_date) >= weekAgo).length;
  const volume = computeVolumeSummary(inputs.workoutSets);

  const skincareCompletion = todaysCompletionPercent(inputs.skincareSteps, inputs.skincareCompletions);
  const skincareStreak = computeSkincareStreak(inputs.skincareSteps, inputs.skincareCompletions);
  const latestJournal = null; // dashboard keeps this lightweight; full skin score detail lives in the Skincare tab
  const skinScore = computeSkinScore(latestJournal, skincareCompletion);

  const latestPhoto = [...inputs.progressPhotos].sort((a, b) => (a.taken_at < b.taken_at ? 1 : -1))[0] ?? null;
  const photoUrl = usePhotoUrl(latestPhoto?.storage_path ?? null);
  const daysSincePhoto = latestPhoto ? -daysUntil(latestPhoto.taken_at) : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="flex flex-col items-center justify-center text-center">
          <div className="relative">
            <ProgressRing percent={breakdown.overall} size={160} label={`${breakdown.overall}`} />
          </div>
          <p className="text-caption text-graphite mt-2 uppercase tracking-wide">Health Score</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-4 text-left">
            {[
              { label: "Workouts", value: breakdown.workoutConsistency },
              { label: "Water", value: breakdown.waterConsistency },
              { label: "Skincare", value: breakdown.skincareConsistency },
              { label: "Progress", value: breakdown.progressTrackingConsistency },
              { label: "Recovery", value: breakdown.recoveryScore },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-3 text-caption">
                <span className="text-graphite">{s.label}</span>
                <span className="text-mono" style={{ color: scoreColor(s.value) }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="text-h3 mb-3">Weekly trend</h3>
          <div className="h-[130px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--tuscan-sun)", fontSize: 12 }} />
                <Area type="monotone" dataKey="score" stroke="var(--tuscan-sun)" fill="var(--tuscan-sun)" fillOpacity={0.25} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <h3 className="text-h3 mb-3 mt-4">Monthly trend</h3>
          <div className="h-[130px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--tuscan-sun)", fontSize: 12 }} />
                <Line type="monotone" dataKey="score" stroke="var(--info)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Dumbbell size={16} className="text-tuscan" />
            <h4 className="text-h3">Gym</h4>
          </div>
          <p className="text-small text-graphite mb-1">Last workout</p>
          <p className="text-body font-medium mb-3">{lastWorkout ? lastWorkout.name : "—"}</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-mono text-h3">{volume.week}kg</p>
              <p className="text-[10px] text-graphite">Weekly vol.</p>
            </div>
            <div>
              <p className="text-mono text-h3">{weeklyWorkouts}</p>
              <p className="text-[10px] text-graphite">Workouts</p>
            </div>
            <div>
              <p className="text-mono text-h3">{breakdown.recoveryScore}%</p>
              <p className="text-[10px] text-graphite">Recovery</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Droplets size={16} className="text-info" />
            <h4 className="text-h3">Water</h4>
          </div>
          <p className="text-small text-graphite mb-1">Today</p>
          <p className="text-body font-medium mb-3">{todayWater}ml</p>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-mono text-h3">{waterGoalPct}%</p>
              <p className="text-[10px] text-graphite">Goal</p>
            </div>
            <div>
              <p className="text-mono text-h3">{waterStreak}d</p>
              <p className="text-[10px] text-graphite">Streak</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-tuscan" />
            <h4 className="text-h3">Skincare</h4>
          </div>
          <p className="text-small text-graphite mb-1">Today&apos;s completion</p>
          <p className="text-body font-medium mb-3">{skincareCompletion}%</p>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-mono text-h3">{skincareStreak}d</p>
              <p className="text-[10px] text-graphite">Streak</p>
            </div>
            <div>
              <p className="text-mono text-h3">{skinScore}</p>
              <p className="text-[10px] text-graphite">Skin score</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Camera size={16} className="text-graphite" />
            <h4 className="text-h3">Progress photos</h4>
          </div>
          {latestPhoto ? (
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-bg shrink-0">
                {photoUrl && <img src={photoUrl} alt="Latest progress" className="w-full h-full object-cover" />}
              </div>
              <div>
                <p className="text-mono text-h3">{daysSincePhoto}d</p>
                <p className="text-[10px] text-graphite">since last update</p>
              </div>
            </div>
          ) : (
            <p className="text-small text-graphite">No photos yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
