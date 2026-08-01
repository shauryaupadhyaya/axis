"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Square, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Subject } from "@/lib/types";
import { completePomodoro, discardPomodoro, startPomodoro } from "@/app/(app)/study/actions";

const PRESETS = [25, 50, 90];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface PomodoroTimerProps {
  subjects?: Subject[];
  defaultSubjectId?: string;
  defaultChapterId?: string;
}

export function PomodoroTimer({ subjects = [], defaultSubjectId, defaultChapterId }: PomodoroTimerProps) {
  const [plannedMinutes, setPlannedMinutes] = useState(25);
  const [customMinutes, setCustomMinutes] = useState(45);
  const [usingCustom, setUsingCustom] = useState(false);
  const [subjectId, setSubjectId] = useState(defaultSubjectId ?? "");
  const [pomodoroId, setPomodoroId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(plannedMinutes * 60);
  const [running, setRunning] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const [syncedPlannedMinutes, setSyncedPlannedMinutes] = useState(plannedMinutes);
  const startedAtRef = useRef<number>(0);
  const elapsedBeforePauseRef = useRef<number>(0);

  // Keep the idle countdown display in sync with the chosen preset — an
  // "adjust state during render" case (not a real effect), same pattern
  // used elsewhere in this app to satisfy the react-hooks/set-state-in-effect
  // rule without an unnecessary extra render pass.
  if (!pomodoroId && plannedMinutes !== syncedPlannedMinutes) {
    setSyncedPlannedMinutes(plannedMinutes);
    setRemaining(plannedMinutes * 60);
  }

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (remaining === 0 && pomodoroId && !justFinished) {
      handleFinish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  async function handleStart() {
    const id = await startPomodoro(plannedMinutes, subjectId || undefined, defaultChapterId);
    setPomodoroId(id);
    setRemaining(plannedMinutes * 60);
    startedAtRef.current = Date.now();
    elapsedBeforePauseRef.current = 0;
    setRunning(true);
    setJustFinished(false);
  }

  function handlePauseResume() {
    if (running) {
      elapsedBeforePauseRef.current += Math.floor((Date.now() - startedAtRef.current) / 1000);
    } else {
      startedAtRef.current = Date.now();
    }
    setRunning((r) => !r);
  }

  async function handleFinish() {
    if (!pomodoroId) return;
    setRunning(false);
    setJustFinished(true);
    const elapsedNow = running ? Math.floor((Date.now() - startedAtRef.current) / 1000) : 0;
    const totalSeconds = elapsedBeforePauseRef.current + elapsedNow;
    const actualMinutes = Math.max(1, Math.round(totalSeconds / 60));
    await completePomodoro(pomodoroId, actualMinutes, subjectId || undefined, defaultChapterId);
    setTimeout(() => {
      setPomodoroId(null);
      setJustFinished(false);
      setRemaining(plannedMinutes * 60);
    }, 1800);
  }

  async function handleDiscard() {
    if (pomodoroId) await discardPomodoro(pomodoroId);
    setPomodoroId(null);
    setRunning(false);
    setJustFinished(false);
    setRemaining(plannedMinutes * 60);
  }

  const progress = plannedMinutes > 0 ? 1 - remaining / (plannedMinutes * 60) : 0;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-32 h-32 flex items-center justify-center mb-3">
        <svg width={128} height={128} className="-rotate-90">
          <circle cx={64} cy={64} r={56} fill="none" stroke="var(--alabaster-grey)" strokeWidth={6} strokeOpacity={0.3} />
          <circle
            cx={64}
            cy={64}
            r={56}
            fill="none"
            stroke="var(--tuscan-sun)"
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 56}
            strokeDashoffset={2 * Math.PI * 56 * (1 - progress)}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <span className="absolute text-display text-mono">{justFinished ? "✓" : formatTime(remaining)}</span>
      </div>

      {!pomodoroId ? (
        <>
          <div className="flex items-center gap-1.5 mb-2 flex-wrap justify-center">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPlannedMinutes(p);
                  setUsingCustom(false);
                }}
                className={`px-3 py-1.5 rounded-full text-caption border transition-fast ${
                  !usingCustom && plannedMinutes === p ? "border-tuscan bg-tuscan/15" : "border-alabaster hover:bg-bg"
                }`}
              >
                {p}m
              </button>
            ))}
            <button
              onClick={() => {
                setUsingCustom(true);
                setPlannedMinutes(customMinutes);
              }}
              className={`px-3 py-1.5 rounded-full text-caption border transition-fast ${
                usingCustom ? "border-tuscan bg-tuscan/15" : "border-alabaster hover:bg-bg"
              }`}
            >
              Custom
            </button>
            {usingCustom && (
              <input
                type="number"
                min={5}
                step={5}
                value={customMinutes}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setCustomMinutes(v);
                  setPlannedMinutes(v);
                }}
                className="w-16 text-caption px-2 py-1 rounded-md border border-alabaster bg-linen dark:bg-bg-secondary"
              />
            )}
          </div>
          {subjects.length > 0 && (
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="text-caption mb-3 px-2 py-1.5 rounded-md border border-alabaster bg-linen dark:bg-bg-secondary"
            >
              <option value="">No subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
          <Button onClick={handleStart} className="flex items-center gap-2">
            <Play size={14} /> Start focus session
          </Button>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={handlePauseResume}
            aria-label={running ? "Pause" : "Resume"}
            className="w-10 h-10 rounded-full border border-alabaster flex items-center justify-center hover:bg-bg transition-fast"
          >
            {running ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <Button onClick={handleFinish} className="flex items-center gap-1.5">
            <Square size={14} /> Finish
          </Button>
          <button
            onClick={handleDiscard}
            aria-label="Discard session"
            className="w-10 h-10 rounded-full border border-alabaster flex items-center justify-center text-graphite hover:text-danger transition-fast"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {!pomodoroId && (
        <p className="text-[10px] text-graphite mt-2 flex items-center gap-1">
          <Timer size={10} /> Auto-logs to study hours when finished
        </p>
      )}
    </div>
  );
}
