"use client";

import { useEffect } from "react";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export function Toast({
  message,
  action,
  onDismiss,
  durationMs = 5000,
}: {
  message: string;
  action?: ToastAction;
  onDismiss: () => void;
  durationMs?: number;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(t);
  }, [onDismiss, durationMs, message]);

  return (
    <div
      role="status"
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-carbon text-white dark:bg-tuscan dark:text-carbon shadow-lg text-small animate-toast-in"
    >
      <span>{message}</span>
      {action && (
        <button
          onClick={action.onClick}
          className="font-semibold underline underline-offset-2 hover:opacity-80 transition-fast"
        >
          {action.label}
        </button>
      )}
      <button onClick={onDismiss} aria-label="Dismiss" className="opacity-60 hover:opacity-100 transition-fast">
        ×
      </button>
    </div>
  );
}
