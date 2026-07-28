"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { User, Trophy, BarChart3, Settings, LogOut, Camera } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { PushToggle } from "@/components/profile/PushToggle";
import { Button } from "@/components/ui/Button";
import { signOut } from "@/app/(auth)/actions";
import { updateProfile } from "@/lib/profile";
import { cn } from "@/lib/cn";

type Tab = "overview" | "statistics" | "achievements" | "settings";

interface ProfilePageViewProps {
  name: string;
  email: string;
  avatarUrl: string | null;
  scores: {
    productivity: number;
    study: number;
    health: number;
  };
  stats: {
    studyHours: number;
    focusSessions: number;
    totalFocusMinutes: number;
    workoutVolume: number;
    waterConsistency: number;
    habitCompletion: number;
  };
  streaks: Array<{ name: string; streak: number }>;
}

const ACHIEVEMENTS = [
  { id: "first-task", name: "First Task", icon: "🎯", condition: "Create your first task" },
  { id: "ten-tasks", name: "10 Tasks", icon: "📋", condition: "Complete 10 tasks" },
  { id: "hundred-tasks", name: "100 Tasks", icon: "🏆", condition: "Complete 100 tasks" },
  { id: "week-streak", name: "Week Warrior", icon: "🔥", condition: "7-day streak" },
  { id: "month-streak", name: "Month Master", icon: "💪", condition: "30-day streak" },
  { id: "century-streak", name: "Century Club", icon: "👑", condition: "100-day streak" },
  { id: "focus-hour", name: "Focus Hour", icon: "⏱️", condition: "Log 1 focus hour" },
  { id: "first-pr", name: "First PR", icon: "🏋️", condition: "Set a personal record" },
  { id: "hydration", name: "Hydration Hero", icon: "💧", condition: "30 days goal met" },
  { id: "skincare", name: "Skincare Champ", icon: "✨", condition: "60 days complete" },
];

export function ProfilePageView({
  name,
  email,
  avatarUrl,
  scores,
  stats,
  streaks,
}: ProfilePageViewProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [username, setUsername] = useState(name);
  const [uploading, setUploading] = useState(false);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await updateProfile({ avatarFile: file });
      router.refresh();
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleUsernameSave() {
    if (username.trim() === name || !username.trim()) return;
    await updateProfile({ username: username.trim() });
    router.refresh();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-h1">Profile</h1>
        <div className="flex gap-1 border border-alabaster rounded-lg p-1">
          {(["overview", "statistics", "achievements", "settings"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 rounded-md text-small capitalize transition-fast",
                tab === t
                  ? "bg-carbon text-white dark:bg-tuscan dark:text-carbon"
                  : "hover:bg-bg"
              )}
            >
              {t === "overview" && <User size={14} className="inline mr-1" />}
              {t === "statistics" && <BarChart3 size={14} className="inline mr-1" />}
              {t === "achievements" && <Trophy size={14} className="inline mr-1" />}
              {t === "settings" && <Settings size={14} className="inline mr-1" />}
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <div className="flex flex-col gap-5">
          {/* Profile header */}
          <Card>
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={name} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-carbon dark:bg-tuscan flex items-center justify-center">
                  <span className="text-h1 text-white dark:text-carbon">
                    {name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-h2">{name}</h2>
                <p className="text-small text-graphite">{email}</p>
              </div>
            </div>
          </Card>

          {/* Score cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ScoreCard label="Productivity" percent={scores.productivity} />
            <ScoreCard label="Study" percent={scores.study} />
            <ScoreCard label="Health" percent={scores.health} />
          </div>

          {/* Streak wall */}
          <Card>
            <h3 className="text-h3 mb-3">Streak wall</h3>
            {streaks.length === 0 ? (
              <p className="text-small text-graphite py-2">No habit streaks yet.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {streaks.map((s) => (
                  <div key={s.name} className="text-center p-3 rounded-lg bg-alabaster/20">
                    <p className="text-display">{s.streak}</p>
                    <p className="text-caption text-graphite truncate">{s.name}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "statistics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Study hours"
            value={String(stats.studyHours)}
            suffix="h"
            subtitle="Total logged"
          />
          <StatCard
            label="Focus sessions"
            value={String(stats.focusSessions)}
            subtitle={`${stats.totalFocusMinutes} total minutes`}
          />
          <StatCard
            label="Workout volume"
            value={String(stats.workoutVolume)}
            subtitle="Completed workouts"
          />
          <StatCard
            label="Water consistency"
            value={`${stats.waterConsistency}/30`}
            subtitle="Days goal met"
          />
          <StatCard
            label="Habit completion"
            value={`${stats.habitCompletion}%`}
            subtitle="This month"
          />
        </div>
      )}

      {tab === "achievements" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {ACHIEVEMENTS.map((a) => (
            <Card key={a.id} className="text-center">
              <span className="text-3xl block mb-2">{a.icon}</span>
              <h3 className="text-h3 mb-1">{a.name}</h3>
              <p className="text-caption text-graphite">{a.condition}</p>
              <p className="text-caption text-graphite mt-2 text-mono opacity-50">Locked</p>
            </Card>
          ))}
        </div>
      )}

      {tab === "settings" && (
        <div className="max-w-lg flex flex-col gap-5">
          <Card>
            <h3 className="text-h3 mb-4">Profile</h3>
            <div className="flex items-center gap-4 mb-4">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={name} className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-carbon dark:bg-tuscan flex items-center justify-center">
                  <span className="text-h3 text-white dark:text-carbon">{name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-alabaster text-small text-graphite cursor-pointer hover:bg-bg transition-fast">
                <Camera size={14} /> {uploading ? "Uploading…" : "Change photo"}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploading} />
              </label>
            </div>
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={handleUsernameSave}
            />
          </Card>

          <Card>
            <h3 className="text-h3 mb-4">Appearance</h3>
            <div className="flex items-center justify-between">
              <span className="text-body">Theme</span>
              <ThemeToggle />
            </div>
          </Card>

          <Card>
            <h3 className="text-h3 mb-4">Notifications</h3>
            <PushToggle />
          </Card>

          <Card>
            <h3 className="text-h3 mb-4">Account</h3>
            <div className="flex flex-col gap-3">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  /* Data export — could trigger a JSON download */
                  alert("Data export coming soon.");
                }}
              >
                Export data (JSON)
              </Button>
              <form action={signOut}>
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full flex items-center justify-center gap-2 border-danger text-danger hover:bg-danger/5"
                >
                  <LogOut size={16} /> Sign out
                </Button>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function ScoreCard({ label, percent }: { label: string; percent: number }) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <ProgressRing percent={percent} size={56} label={`${percent}%`} />
        <div className="flex-1">
          <p className="text-body font-medium">{label}</p>
          <ProgressBar percent={percent} className="mt-1" />
        </div>
      </div>
    </Card>
  );
}

function StatCard({
  label,
  value,
  suffix,
  subtitle,
}: {
  label: string;
  value: string;
  suffix?: string;
  subtitle?: string;
}) {
  return (
    <Card>
      <p className="text-caption text-graphite mb-1">{label}</p>
      <p className="text-display">
        {value}
        {suffix && <span className="text-h3 text-graphite ml-1">{suffix}</span>}
      </p>
      {subtitle && <p className="text-caption text-graphite mt-1">{subtitle}</p>}
    </Card>
  );
}
