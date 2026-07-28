"use client";

import { useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import type { Habit, HabitCompletion } from "@/lib/types";
import { computeStreak, toISODate } from "@/lib/scores";
import { toggleHabitToday } from "@/app/(app)/dashboard/actions";

interface HabitsWidgetProps {
  habits: Habit[];
  completions: HabitCompletion[];
}

export function HabitsWidget({ habits, completions }: HabitsWidgetProps) {
  const [pending, startTransition] = useTransition();
  const today = toISODate(new Date());

  return (
    <Card>
      <h3 className="text-h3 mb-3">Habits</h3>
      {habits.length === 0 ? (
        <p className="text-small text-graphite py-4 text-center">No habits yet?</p>
      ) : (
        <ul>
          {habits.map((habit) => {
            const habitCompletions = completions.filter((c) => c.habit_id === habit.id);
            const doneToday = habitCompletions.some(
              (c) => c.completed_at === today && c.status === "completed"
            );
            const streak = computeStreak(habitCompletions);
            return (
              <li
                key={habit.id}
                className="flex items-center gap-3 py-2.5 border-b border-alabaster last:border-b-0"
              >
                <Checkbox
                  checked={doneToday}
                  disabled={pending}
                  onChange={(e) =>
                    startTransition(() => toggleHabitToday(habit.id, e.target.checked))
                  }
                />
                <span className={`flex-1 text-body ${doneToday ? "opacity-50" : ""}`}>
                  {habit.name}
                </span>
                <span className="text-mono text-graphite">{streak} 🔥</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
