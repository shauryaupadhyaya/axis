"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Pause, Play, SkipForward, Sparkles, X } from "lucide-react";
import type { SkincareStep } from "@/lib/types";
import { toggleSkincareStepToday } from "@/app/(app)/health/actions";

export function RoutineExecutionModal({
  steps,
  title,
  onClose,
}: {
  steps: SkincareStep[];
  title: string;
  onClose: () => void;
}) {
  const [, startTransition] = useTransition();
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(steps[0]?.duration_seconds ?? 60);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState(false);
  const [syncedIndex, setSyncedIndex] = useState(0);

  const step = steps[index];

  // Reset the per-step timer when the active step changes — done during
  // render (React's sanctioned "adjusting state" pattern) rather than in an
  // effect, since this is deriving state from a prop/index change, not
  // synchronizing with an external system.
  if (index !== syncedIndex) {
    setSyncedIndex(index);
    setRemaining(step?.duration_seconds ?? 60);
    setRunning(true);
  }

  useEffect(() => {
    if (!running || done) return;
    if (remaining <= 0) {
      handleNext();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running, done]);

  function handleNext() {
    if (step) startTransition(() => toggleSkincareStepToday(step.id, true));
    if (index + 1 < steps.length) {
      setIndex((i) => i + 1);
    } else {
      setDone(true);
    }
  }

  const progress = steps.length > 0 ? ((index + (done ? 1 : 0)) / steps.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[1200] bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-linen dark:bg-bg-secondary border border-alabaster p-6 animate-pop-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-h3">{title}</h3>
          <button onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="h-1.5 rounded-full bg-alabaster/40 overflow-hidden mb-5">
          <div
            className="h-full bg-tuscan transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {done || !step ? (
          <div className="flex flex-col items-center text-center py-6 animate-pop-in">
            <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mb-3">
              <Sparkles size={28} className="text-success" />
            </div>
            <p className="text-h3 mb-1">Routine complete</p>
            <p className="text-small text-graphite mb-5">{steps.length} steps done. Your skin thanks you.</p>
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-carbon text-white dark:bg-tuscan dark:text-carbon text-small font-semibold">
              Done
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <p className="text-caption text-graphite mb-1">
              Step {index + 1} of {steps.length}
            </p>
            <p className="text-h2 mb-2">{step.name}</p>
            {step.instructions && <p className="text-small text-graphite mb-4 max-w-[260px]">{step.instructions}</p>}

            <div className="relative w-28 h-28 flex items-center justify-center mb-5">
              <svg width={112} height={112} className="-rotate-90">
                <circle cx={56} cy={56} r={50} fill="none" stroke="var(--alabaster-grey)" strokeWidth={5} strokeOpacity={0.3} />
                <circle
                  cx={56}
                  cy={56}
                  r={50}
                  fill="none"
                  stroke="var(--tuscan-sun)"
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 50}
                  strokeDashoffset={
                    2 * Math.PI * 50 * (1 - remaining / Math.max(1, step.duration_seconds))
                  }
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <span className="absolute text-display">{remaining}s</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setRunning((r) => !r)}
                className="w-11 h-11 rounded-full border border-alabaster flex items-center justify-center hover:bg-bg transition-fast"
                aria-label={running ? "Pause" : "Resume"}
              >
                {running ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-3 rounded-full bg-carbon text-white dark:bg-tuscan dark:text-carbon text-small font-semibold flex items-center gap-2"
              >
                <Check size={16} /> {index + 1 < steps.length ? "Mark done & next" : "Finish"}
              </button>
              <button
                onClick={() => setIndex((i) => Math.min(i + 1, steps.length - 1))}
                className="w-11 h-11 rounded-full border border-alabaster flex items-center justify-center hover:bg-bg transition-fast"
                aria-label="Skip step"
              >
                <SkipForward size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
