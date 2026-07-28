"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/cn";

const OPTIONS = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-0.5 border border-alabaster rounded-md p-0.5">
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          aria-label={`${label} theme`}
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
          className={cn(
            "w-7 h-7 rounded flex items-center justify-center transition-fast",
            theme === value ? "bg-carbon text-white dark:bg-tuscan dark:text-carbon" : "hover:bg-bg text-text-secondary"
          )}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}
