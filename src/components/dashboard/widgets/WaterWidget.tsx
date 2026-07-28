"use client";

import { useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { logWater } from "@/app/(app)/dashboard/actions";
import { DEFAULT_WATER_GOAL_ML } from "@/lib/constants";

export function WaterWidget({ currentMl }: { currentMl: number }) {
  const [pending, startTransition] = useTransition();
  const goal = DEFAULT_WATER_GOAL_ML;
  const percent = (currentMl / goal) * 100;

  return (
    <Card>
      <h3 className="text-h3 mb-3">Water</h3>
      <div className="flex items-center gap-4">
        <ProgressRing percent={percent} label={`${(currentMl / 1000).toFixed(2)}L`} />
        <div className="flex-1">
          <p className="text-mono text-graphite mb-2">
            {currentMl}/{goal}ml
          </p>
          <div className="flex gap-2">
            {[250, 500].map((amount) => (
              <button
                key={amount}
                disabled={pending}
                onClick={() => startTransition(() => logWater(amount))}
                className="px-3 py-1.5 rounded-md border border-alabaster text-small font-semibold hover:bg-bg transition-fast disabled:opacity-50"
              >
                +{amount}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
