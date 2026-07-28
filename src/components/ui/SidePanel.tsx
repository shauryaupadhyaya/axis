"use client";

import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Slide-in panel from the right (380px desktop), full-screen on mobile, per the spec's task/event detail panels. */
export function SidePanel({ open, onClose, title, children, footer }: SidePanelProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1100] flex justify-end"
      style={{ background: "var(--overlay)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="bg-linen dark:bg-bg-secondary w-full md:w-[380px] h-full flex flex-col transition-sheet"
        style={{ boxShadow: "-8px 0 24px var(--shadow-color-hover)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-alabaster">
          <h2 className="text-h2 truncate">{title}</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-bg transition-fast shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="border-t border-alabaster px-5 py-3 flex gap-2 justify-between items-center">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
