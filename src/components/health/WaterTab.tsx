"use client";

import { useState, useTransition } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Button } from "@/components/ui/Button";
import type { WaterLog } from "@/lib/types";
import { toISODate } from "@/lib/scores";
import { logWater, updateWaterGoal } from "@/app/(app)/health/actions";

export function WaterTab({ waterLogs, goalMl }: { waterLogs: WaterLog[]; goalMl: number }) {
  const [, startTransition] = useTransition();
  const [goalInput, setGoalInput] = useState(goalMl);

  const today = toISODate(new Date());
  const todayTotal = waterLogs
    .filter((w) => w.logged_at.slice(0, 10) === today)
    .reduce((sum, w) => sum + w.amount_ml, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return toISODate(d);
  });
  const data = days.map((day) => ({
    day,
    amount: waterLogs.filter((w) => w.logged_at.slice(0, 10) === day).reduce((s, w) => s + w.amount_ml, 0),
  }));

  const sortedHistory = [...waterLogs].sort(
    (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <Card className="lg:col-span-1 flex flex-col items-center text-center">
        <ProgressRing percent={(todayTotal / goalMl) * 100} size={140} label={`${(todayTotal / 1000).toFixed(2)}L`} />
        <p className="text-mono text-graphite mt-3">
          {todayTotal} / {goalMl}ml
        </p>
        <div className="flex gap-2 mt-4">
          {[250, 500].map((amount) => (
            <button
              key={amount}
              onClick={() => startTransition(() => logWater(amount))}
              className="px-4 py-2 rounded-md border border-alabaster text-small font-semibold hover:bg-bg transition-fast"
            >
              +{amount}
            </button>
          ))}
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <h3 className="text-h3 mb-3">Last 7 days</h3>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
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
              <Bar dataKey="amount" radius={2}>
                {data.map((_, i) => (
                  <Cell key={i} fill="var(--tuscan-sun)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <label className="text-label text-graphite">Daily goal (ml)</label>
          <input
            type="number"
            step={250}
            value={goalInput}
            onChange={(e) => setGoalInput(Number(e.target.value))}
            className="w-24 text-small px-2 py-1.5 rounded-md border border-alabaster bg-linen dark:bg-bg-secondary"
          />
          <Button variant="secondary" onClick={() => startTransition(() => updateWaterGoal(goalInput))}>
            Save
          </Button>
        </div>
      </Card>

      <Card className="lg:col-span-3">
        <h3 className="text-h3 mb-3">History</h3>
        {sortedHistory.length === 0 ? (
          <p className="text-small text-graphite py-4 text-center">No water logged yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
            {sortedHistory.slice(0, 30).map((log) => (
              <li key={log.id} className="flex items-center justify-between text-small">
                <span className="text-mono text-graphite">
                  {new Date(log.logged_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
                <span>{log.amount_ml}ml</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
