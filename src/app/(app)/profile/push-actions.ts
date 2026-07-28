"use server";

import { requireUserId } from "@/lib/supabase/require-user";

export async function savePushSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" }
  );
}

export async function deletePushSubscription(endpoint: string) {
  const { supabase, userId } = await requireUserId();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", userId);
}
