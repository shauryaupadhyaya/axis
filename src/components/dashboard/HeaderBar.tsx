import { Search, Sparkles, Bell } from "lucide-react";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function HeaderBar({ name }: { name: string }) {
  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 bg-bg border-b border-alabaster">
      <div>
        <h1 className="text-h1">
          {greeting(now.getHours())}, {name}
        </h1>
        <p className="text-small text-graphite">{dateLabel}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {[
          { icon: Search, label: "Search" },
          { icon: Sparkles, label: "Assistant" },
          { icon: Bell, label: "Alerts" },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            aria-label={label}
            disabled
            title="Coming soon"
            className="w-9 h-9 rounded-md border border-alabaster flex items-center justify-center opacity-50 cursor-not-allowed"
          >
            <Icon size={18} className="text-carbon" />
          </button>
        ))}
      </div>
    </header>
  );
}
