import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { HeaderBarActions } from "@/components/dashboard/HeaderBarActions";
import { getAppSnapshot } from "@/lib/app-snapshot";
import { buildNotifications } from "@/lib/notifications";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export async function HeaderBar({ name }: { name: string }) {
  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const snapshot = await getAppSnapshot();
  const notifications = buildNotifications(snapshot, now);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 bg-bg border-b border-alabaster">
      <div>
        <h1 className="text-h1">
          {greeting(now.getHours())}, {name}
        </h1>
        <p className="text-small text-graphite">{dateLabel}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle />
        <HeaderBarActions notifications={notifications} />
      </div>
    </header>
  );
}
