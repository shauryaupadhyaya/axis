import { Flame, Trophy } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { StudyStreak } from "@/lib/study";

export function StudyStreakCard({ streak }: { streak: StudyStreak }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center justify-center rounded-xl bg-tuscan/10 border border-tuscan/30 py-4">
          <Flame size={20} className="text-tuscan mb-1" />
          <p className="text-display">{streak.current}</p>
          <p className="text-caption text-graphite">day streak</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl bg-bg py-4">
          <Trophy size={20} className="text-graphite mb-1" />
          <p className="text-display">{streak.longest}</p>
          <p className="text-caption text-graphite">longest</p>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-caption text-graphite">This month</span>
          <span className="text-mono text-caption">{streak.monthProgress}%</span>
        </div>
        <ProgressBar percent={streak.monthProgress} />
      </div>
    </div>
  );
}
