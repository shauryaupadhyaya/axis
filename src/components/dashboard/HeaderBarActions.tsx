"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Sparkles, Bell, X } from "lucide-react";
import type { AppNotification } from "@/lib/notifications";
import { AssistantPanel } from "@/components/assistant/AssistantPanel";

const DISMISSED_KEY = "axis:dismissed-notifications";

function readDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

export function HeaderBarActions({ notifications }: { notifications: AppNotification[] }) {
  const [bellOpen, setBellOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    // localStorage isn't available during SSR, so this has to sync in after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(readDismissed());
  }, []);

  const visible = notifications.filter((n) => !dismissed.has(n.id));

  function dismiss(id: string) {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next]));
  }

  return (
    <div className="flex items-center gap-2 shrink-0 relative">
      <button
        aria-label="Search"
        disabled
        title="Coming soon"
        className="w-9 h-9 rounded-md border border-alabaster flex items-center justify-center opacity-50 cursor-not-allowed"
      >
        <Search size={18} className="text-text" />
      </button>

      <button
        aria-label="Assistant"
        onClick={() => setAssistantOpen(true)}
        className="w-9 h-9 rounded-md border border-alabaster flex items-center justify-center hover:bg-bg transition-fast"
      >
        <Sparkles size={18} className="text-text" />
      </button>

      <div className="relative">
        <button
          aria-label="Alerts"
          onClick={() => setBellOpen((o) => !o)}
          className="w-9 h-9 rounded-md border border-alabaster flex items-center justify-center hover:bg-bg transition-fast relative"
        >
          <Bell size={18} className="text-text" />
          {visible.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[10px] flex items-center justify-center">
              {visible.length}
            </span>
          )}
        </button>

        {bellOpen && (
          <>
            <div className="fixed inset-0 z-[1050]" onClick={() => setBellOpen(false)} />
            <div className="absolute right-0 top-11 z-[1060] w-80 max-h-96 overflow-y-auto bg-linen dark:bg-bg-secondary border border-alabaster rounded-xl shadow-lg p-2">
              {visible.length === 0 ? (
                <p className="text-small text-graphite py-6 text-center">You&apos;re all caught up.</p>
              ) : (
                visible.map((n) => (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={() => setBellOpen(false)}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-bg transition-fast group"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        n.severity === "urgent" ? "bg-danger" : n.severity === "warning" ? "bg-warning" : "bg-info"
                      }`}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-small font-semibold">{n.title}</span>
                      <span className="block text-caption text-graphite truncate">{n.body}</span>
                    </span>
                    <button
                      aria-label="Dismiss"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        dismiss(n.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <X size={12} className="text-graphite" />
                    </button>
                  </Link>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </div>
  );
}
