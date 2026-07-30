import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildNotifications } from "@/lib/notifications";
import type { AppSnapshot } from "@/lib/app-snapshot";
import type { CalendarEventRow, Exam, Habit, HabitCompletion, Homework, Task } from "@/lib/types";

const RESEND_INTERVAL_MS = 60 * 60 * 1000; // don't re-notify the same user more than once an hour

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublicKey || !vapidPrivateKey) {
    return Response.json({ error: "VAPID keys not configured" }, { status: 500 });
  }
  webpush.setVapidDetails("mailto:notifications@axis.app", vapidPublicKey, vapidPrivateKey);

  const supabase = createAdminClient();
  const now = new Date();

  const { data: subscriptions } = await supabase.from("push_subscriptions").select("*");
  const userIds = [...new Set((subscriptions ?? []).map((s) => s.user_id as string))];

  let sent = 0;
  for (const userId of userIds) {
    const { data: settings } = await supabase
      .from("user_settings")
      .select("last_notified_at")
      .eq("user_id", userId)
      .maybeSingle();
    const lastNotified = settings?.last_notified_at ? new Date(settings.last_notified_at) : null;
    if (lastNotified && now.getTime() - lastNotified.getTime() < RESEND_INTERVAL_MS) continue;

    const [tasksRes, homeworkRes, examsRes, eventsRes, habitsRes, completionsRes] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id", userId).eq("done", false).is("parent_task_id", null),
      supabase.from("homework").select("*").eq("user_id", userId).eq("done", false),
      supabase.from("exams").select("*").eq("user_id", userId),
      supabase.from("calendar_events").select("*").eq("user_id", userId),
      supabase.from("habits").select("*").eq("user_id", userId),
      supabase
        .from("habit_completions")
        .select("*")
        .eq("user_id", userId)
        .eq("completed_at", now.toISOString().slice(0, 10)),
    ]);

    const snapshot: AppSnapshot = {
      tasks: (tasksRes.data as Task[]) ?? [],
      homework: (homeworkRes.data as Homework[]) ?? [],
      exams: (examsRes.data as Exam[]) ?? [],
      calendarEvents: (eventsRes.data as CalendarEventRow[]) ?? [],
      habits: (habitsRes.data as Habit[]) ?? [],
      habitCompletions: (completionsRes.data as HabitCompletion[]) ?? [],
    };

    const notifications = buildNotifications(snapshot, now);
    if (notifications.length === 0) continue;

    const userSubs = (subscriptions ?? []).filter((s) => s.user_id === userId);
    const summary = notifications[0];
    for (const sub of userSubs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: summary.title,
            body: notifications.length > 1 ? `${summary.body} (+${notifications.length - 1} more)` : summary.body,
            href: summary.href,
          })
        );
        sent++;
      } catch {
        // Expired/invalid subscriptions are pruned lazily; not fatal to the batch.
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }

    await supabase.from("user_settings").upsert({ user_id: userId, last_notified_at: now.toISOString() });
  }

  return Response.json({ usersChecked: userIds.length, notificationsSent: sent });
}
