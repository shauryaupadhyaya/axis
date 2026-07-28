"use client";

import { useEffect, useState } from "react";
import { Toggle } from "@/components/ui/Toggle";
import { deletePushSubscription, savePushSubscription } from "@/app/(app)/profile/push-actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function PushToggle() {
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Feature detection needs `navigator`/`window`, unavailable during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported("serviceWorker" in navigator && "PushManager" in window);
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEnabled(!!sub))
      .catch(() => {});
  }, []);

  async function handleToggle(next: boolean) {
    if (!supported) return;
    const registration = await navigator.serviceWorker.register("/sw.js");
    if (next) {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        alert("Push notifications aren't configured yet.");
        return;
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      await savePushSubscription(subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } });
      setEnabled(true);
    } else {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await deletePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setEnabled(false);
    }
  }

  if (!supported) return null;

  return (
    <div className="flex items-center justify-between py-2 border-b border-alabaster last:border-b-0">
      <span className="text-body">Push notifications</span>
      <Toggle checked={enabled} onChange={(e) => handleToggle(e.target.checked)} />
    </div>
  );
}
