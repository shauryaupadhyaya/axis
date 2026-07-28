"use client";

import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Renders as a centered modal on desktop (>=1024px) and a bottom sheet
 * with a drag handle on mobile, per the spec's responsive modal rules.
 */
export function Modal({ open, onClose, title, children, footer }: ModalProps) {
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
      className="fixed inset-0 z-[1100] flex items-end lg:items-center justify-center"
      style={{ background: "var(--overlay)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "bg-linen dark:bg-bg-secondary w-full lg:max-w-[480px] max-h-[90vh] flex flex-col",
          "rounded-t-[20px] lg:rounded-xl",
          "transition-sheet"
        )}
        style={{
          boxShadow:
            "0 20px 40px var(--shadow-color-hover)",
        }}
      >
        <div className="lg:hidden flex justify-center pt-2 pb-1">
          <div className="w-7 h-1 rounded-full bg-alabaster" />
        </div>
        <div className="flex items-center justify-between px-6 pt-4 lg:pt-6">
          <h2 className="text-h2">{title}</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-bg transition-fast"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="border-t border-alabaster px-6 py-4 flex gap-2 justify-end sticky bottom-0 bg-inherit">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
