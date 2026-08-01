"use client";

import { useMemo, useState, useTransition } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Flame, Droplets, Target, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { WaterGlass } from "@/components/health/water/WaterGlass";
import { ContainerPicker } from "@/components/health/water/ContainerPicker";
import type { ActivityLevel, UserSettings, WaterContainer, WaterLog } from "@/lib/types";
import { toISODate } from "@/lib/scores";
import {
  bucketByDay,
  bucketByMonth,
  computeSmartWaterGoal,
  computeWaterStreak,
  totalForDay,
} from "@/lib/water";
import { deleteWaterLog, logWater, updateHydrationProfile, updateWaterGoal } from "@/app/(app)/health/actions";

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary",
  light: "Lightly active",
  moderate: "Moderately active",
  active: "Active",
  very_active: "Very active",
};

export function WaterTab({
  waterLogs,
  containers,
  settings,
  workedOutToday,
}: {
  waterLogs: WaterLog[];
  containers: WaterContainer[];
  settings: UserSettings | null;
  workedOutToday: boolean;
}) {
  const [, startTransition] = useTransition();
  const [pulseKey, setPulseKey] = useState(0);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profile, setProfile] = useState({
    age: settings?.age ?? undefined,
    weightKg: settings?.weight_kg ?? undefined,
    heightCm: settings?.height_cm ?? undefined,
    activityLevel: settings?.activity_level ?? "moderate",
  });

  const goalMl = settings?.water_goal_ml ?? 3000;
  const today = toISODate(new Date());
  const todayTotal = totalForDay(waterLogs, today);
  const percent = goalMl > 0 ? (todayTotal / goalMl) * 100 : 0;
  const remaining = Math.max(0, goalMl - todayTotal);
  const streak = computeWaterStreak(waterLogs, goalMl);
  const smartGoal = computeSmartWaterGoal(
    { ...(settings ?? { user_id: "", water_goal_ml: goalMl, age: null, weight_kg: null, height_cm: null, preferred_container_ml: 250 }), activity_level: profile.activityLevel as ActivityLevel },
    workedOutToday
  );

  const weekData = useMemo(() => bucketByDay(waterLogs, 7), [waterLogs]);
  const monthData = useMemo(() => bucketByMonth(waterLogs, 6), [waterLogs]);
  const yearCells = useMemo(() => bucketByDay(waterLogs, 84), [waterLogs]); // ~12 weeks heatmap

  const sortedHistory = [...waterLogs].sort(
    (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
  );

  function handleLog(amountMl: number) {
    setPulseKey((k) => k + 1);
    startTransition(() => logWater(amountMl));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <Card className="lg:col-span-1 flex flex-col items-center text-center relative overflow-hidden">
        <WaterGlass percent={percent} pulseKey={pulseKey} />
        <p className="text-mono text-graphite mt-1">
          {todayTotal.toLocaleString()} / {goalMl.toLocaleString()}ml
        </p>
        <div className="grid grid-cols-2 gap-2 w-full mt-3">
          <div className="rounded-lg bg-info/10 px-3 py-2 flex flex-col items-center">
            <Droplets size={14} className="text-info mb-1" />
            <span className="text-small font-semibold">{remaining}ml</span>
            <span className="text-[10px] text-graphite">remaining</span>
          </div>
          <div className="rounded-lg bg-tuscan/15 px-3 py-2 flex flex-col items-center">
            <Flame size={14} className="text-tuscan mb-1" />
            <span className="text-small font-semibold">{streak}d</span>
            <span className="text-[10px] text-graphite">streak</span>
          </div>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <h3 className="text-h3 mb-3">Quick log</h3>
        <ContainerPicker custom={containers} onLog={handleLog} />

        <div className="flex items-center justify-between mt-5 mb-2">
          <h3 className="text-h3">Last 7 days</h3>
        </div>
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData}>
              <Tooltip
                cursor={false}
                contentStyle={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--tuscan-sun)",
                  color: "var(--text)",
                  fontSize: 12,
                }}
                formatter={(value) => [`${value}ml`, "Water"]}
              />
              <Bar dataKey="amountMl" radius={2}>
                {weekData.map((d, i) => (
                  <Cell key={i} fill={d.amountMl >= goalMl ? "var(--success)" : "var(--tuscan-sun)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <h3 className="text-h3 mb-3">Last 6 months</h3>
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthData}>
              <Tooltip
                cursor={false}
                contentStyle={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--tuscan-sun)",
                  color: "var(--text)",
                  fontSize: 12,
                }}
                formatter={(value) => [`${(Number(value) / 1000).toFixed(1)}L`, "Water"]}
              />
              <Bar dataKey="amountMl" radius={2}>
                {monthData.map((_, i) => (
                  <Cell key={i} fill="var(--info)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h3 className="text-h3 mb-3">Consistency</h3>
        <div className="grid grid-cols-12 gap-1">
          {yearCells.map((c) => {
            const ratio = goalMl > 0 ? c.amountMl / goalMl : 0;
            const bg =
              ratio === 0
                ? "bg-alabaster/20"
                : ratio < 0.5
                  ? "bg-info/25"
                  : ratio < 1
                    ? "bg-info/55"
                    : "bg-info";
            return <div key={c.day} title={`${c.day}: ${c.amountMl}ml`} className={`w-full aspect-square rounded-sm ${bg}`} />;
          })}
        </div>
      </Card>

      <Card className="lg:col-span-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-h3 flex items-center gap-2">
            <Target size={16} /> Smart hydration goal
          </h3>
          <Button variant="secondary" onClick={() => setEditingProfile((v) => !v)}>
            {editingProfile ? "Close" : "Edit profile"}
          </Button>
        </div>

        {editingProfile && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(() =>
                updateHydrationProfile({
                  age: profile.age ?? null,
                  weightKg: profile.weightKg ?? null,
                  heightCm: profile.heightCm ?? null,
                  activityLevel: profile.activityLevel as ActivityLevel,
                })
              );
              setEditingProfile(false);
            }}
            className="flex flex-wrap items-end gap-3 mb-4"
          >
            <Input
              label="Age"
              type="number"
              value={profile.age ?? ""}
              onChange={(e) => setProfile((p) => ({ ...p, age: e.target.value ? Number(e.target.value) : undefined }))}
              className="w-20"
            />
            <Input
              label="Weight (kg)"
              type="number"
              value={profile.weightKg ?? ""}
              onChange={(e) => setProfile((p) => ({ ...p, weightKg: e.target.value ? Number(e.target.value) : undefined }))}
              className="w-24"
            />
            <Input
              label="Height (cm)"
              type="number"
              value={profile.heightCm ?? ""}
              onChange={(e) => setProfile((p) => ({ ...p, heightCm: e.target.value ? Number(e.target.value) : undefined }))}
              className="w-24"
            />
            <div>
              <label className="text-label text-graphite mb-1 block">Activity level</label>
              <select
                value={profile.activityLevel}
                onChange={(e) => setProfile((p) => ({ ...p, activityLevel: e.target.value as ActivityLevel }))}
                className="text-small px-2 py-2 rounded-md border border-alabaster bg-linen dark:bg-bg-secondary"
              >
                {Object.entries(ACTIVITY_LABELS).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit">Save profile</Button>
          </form>
        )}

        <div className="flex items-center justify-between flex-wrap gap-3 rounded-lg bg-tuscan/10 border border-tuscan/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-tuscan" />
            <p className="text-small">
              Based on your profile{workedOutToday ? " and today's workout" : ""}, your suggested goal is{" "}
              <span className="font-semibold text-mono">{smartGoal}ml</span>.
            </p>
          </div>
          {smartGoal !== goalMl && (
            <Button onClick={() => startTransition(() => updateWaterGoal(smartGoal))}>Apply suggestion</Button>
          )}
        </div>
      </Card>

      <Card className="lg:col-span-3">
        <h3 className="text-h3 mb-3">History</h3>
        {sortedHistory.length === 0 ? (
          <p className="text-small text-graphite py-4 text-center">No water logged yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
            {sortedHistory.slice(0, 30).map((log) => (
              <li key={log.id} className="group flex items-center justify-between text-small">
                <span className="text-mono text-graphite">
                  {new Date(log.logged_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <span className="flex items-center gap-2">
                  {log.amount_ml}ml
                  <button
                    onClick={() => startTransition(() => deleteWaterLog(log.id))}
                    className="opacity-0 group-hover:opacity-100 text-graphite hover:text-danger transition-fast text-[11px]"
                  >
                    Remove
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
